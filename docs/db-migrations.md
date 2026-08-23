# DB マイグレーション運用（ローカル / 本番）

Drizzle によるスキーマ変更とマイグレーション適用の手順。**特に本番(Neon)への適用には落とし穴がある**ので必ず本ページに従う。

## ローカル（通常フロー）

```bash
# 1. db/schema.ts を編集
# 2. マイグレーション SQL を生成 (db/migrations/NNNN_*.sql)
npm run db:generate
# 3. ローカル DB (.env.local の DATABASE_URL = docker postgres) に適用
npm run db:migrate
```

---

## 本番（Neon）への適用 — ⚠️ 重要な落とし穴

### 落とし穴 1: `drizzle-kit migrate` は `.env.local` を自動読込する
`DATABASE_URL='<本番URL>' npm run db:migrate` としても、drizzle-kit が `.env.local` を読み込み、**インラインで渡した本番 URL を上書き**して**ローカル DB に適用してしまう**ことがある（ログに `injected env from .env.local` と出る）。本番に当てたつもりでローカルに当たる事故が起きる。

### 落とし穴 2: 本番は履歴と実スキーマがズレている（drift）
本番 Neon は過去に schema を先行適用した経緯があり、`drizzle.__drizzle_migrations`（適用履歴）が実スキーマより遅れている。この状態で `drizzle-kit migrate` を流すと、既に存在するカラムに対して `ADD COLUMN` が走り **`42701 column already exists` で失敗**する。

> 結論: **本番に対して `drizzle-kit migrate` を素直に流してはいけない**（当面は）。

### 当面の安全な本番適用手順（推奨）
新しいマイグレーション `db/migrations/NNNN_*.sql` を本番へ反映するとき：

1. その SQL を **冪等化**する（`ADD COLUMN IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` / `ALTER TYPE ... ADD VALUE IF NOT EXISTS`）。
2. 本番接続文字列は **Vercel → Storage → Postgres**、または **Neon コンソール**から取得する。**チャット等に貼らない**（貼ってしまったら即ローテーション）。
3. 一時 node スクリプトで直接適用する（drizzle-kit を経由しないので env 事故が起きない）:

```js
// _apply.mjs  (実行後に削除)
import pg from "pg";
const c = new pg.Client({ connectionString: process.env.PROD, ssl: { rejectUnauthorized: false } });
await c.connect();
const stmts = [
  // 対象マイグレーションの各文を冪等化して列挙
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "example_col" text`,
  // CREATE INDEX IF NOT EXISTS ...
  // ALTER TYPE "..." ADD VALUE IF NOT EXISTS '...'   (enum 追加)
];
for (const s of stmts) { await c.query(s); console.log("ok:", s.slice(0, 60)); }
await c.end();
```

```bash
PROD='postgresql://…/neondb?sslmode=require' node _apply.mjs && rm -f _apply.mjs
```

（Neon コンソールの SQL エディタに冪等化 SQL を貼って実行してもよい。）

4. 適用後、`information_schema.columns` 等で対象カラム/索引の存在を確認する。

> 実績: 2026-07 に 0002(Stripe) / 0003(lockout・OTP) のカラムをこの方式で本番へ手当てした。

### 0004 (退会のための FK 変更) — **本番未適用**

`db/migrations/0004_productive_lyja.sql` はローカルにのみ適用済み。**本番にはまだ流していない。**

退会機能 (`lib/account/deleteUser.ts`) はこの FK 変更を前提にしているので、
**適用するまで本番では退会もユーザー削除も失敗する** (FK 制約違反)。

冪等版 (Neon SQL エディタか `_apply.mjs` にそのまま貼れる):

```sql
ALTER TABLE "download_audit" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "download_audit" DROP CONSTRAINT IF EXISTS "download_audit_user_id_users_id_fk";
ALTER TABLE "download_audit" ADD CONSTRAINT "download_audit_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "admin_actions" DROP CONSTRAINT IF EXISTS "admin_actions_target_user_id_users_id_fk";
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_users_id_fk"
  FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
```

適用後の確認:

```sql
SELECT is_nullable FROM information_schema.columns
 WHERE table_name = 'download_audit' AND column_name = 'user_id';   -- YES になる

SELECT tc.constraint_name, rc.delete_rule
  FROM information_schema.table_constraints tc
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
 WHERE tc.constraint_name IN ('download_audit_user_id_users_id_fk',
                              'admin_actions_target_user_id_users_id_fk');  -- SET NULL になる
```

`admin_actions.admin_id` / `friend_codes.issued_by_admin_id` / `releases.uploaded_by` は
**わざと `no action` のまま**にしてある。監査ログの「誰がやったか」を消さないため、
管理者アカウントは削除できない設計 (`lib/account/deleteUser.ts` が明示的に弾く)。

### 恒久対応: 履歴のベースライン化（落ち着いたらやる）
以後 `drizzle-kit migrate` を本番でも普通に使えるようにするには、実スキーマと `drizzle.__drizzle_migrations` を整合させる必要がある。メンテナンス枠で慎重に：

1. 本番の実スキーマが、ローカルの最新マイグレーション適用後の状態と**完全一致**していることを確認する。
2. 一致したら、`drizzle.__drizzle_migrations` に 0000〜最新までの行を「適用済み」として記録する。
   - drizzle が記録する各行の `hash` はマイグレーション SQL から生成される。正確な hash を再現するのが難しい場合は、
     **本番と同一スキーマの新規 DB に対して一度だけ正規に `drizzle-kit migrate` を通し、その `__drizzle_migrations` の内容を本番へコピー**する、などの方法をとる。
3. 以降の本番適用では `.env.local` の上書き問題を避けるため、次のいずれかにする:
   - 本番適用時だけ `.env.local` を一時退避する、
   - 本番専用の drizzle config / 別 env ファイルを使う、
   - drizzle-orm の `migrate()` を直接呼ぶスクリプトを用意する。

---

## クイックリファレンス

| やること | コマンド / 方法 |
| --- | --- |
| スキーマ→SQL 生成 | `npm run db:generate` |
| ローカル適用 | `npm run db:migrate` |
| 本番適用 | 上記「当面の安全な本番適用手順」（冪等 SQL を直接適用） |
| 本番接続文字列の取得 | Vercel → Storage → Postgres / Neon コンソール |
