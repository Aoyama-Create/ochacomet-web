# OchaComet Web

OchaComet (旧: 17 Auto Comment Sender) Chrome 拡張のクローズド DRM 配布基盤。

会員サイト + ZIP 配布 API + フレンドコード検証 API + ステップメール配信を Vercel 上で動かす単一の Next.js 16 リポジトリ。

- 拡張本体リポ: `../17-auto-comment-sender/`
- 設計書: `../17-auto-comment-sender/docs/design/`
- 1st リリース実装プラン: `~/.claude/plans/1st-lp-zip-plan-fizzy-alpaca.md`

## スタック

- Next.js 16.2 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- Auth.js v5 (Credentials + JWT セッション)
- Drizzle ORM + Postgres
- Vercel Blob (ZIP 配布) / Vercel KV → Upstash Redis (レート制限)
- Brevo (transactional + drip メール)

## ローカル開発

### 前提

- Node.js 20+ (`node --version` → `v20.x`)
- Docker Desktop (Postgres ローカル起動用)

### セットアップ

```bash
# 1. 依存インストール
npm install

# 2. ローカル DB 起動 (postgres:16-alpine、port 5432)
npm run db:up

# 3. 環境変数
cp .env.local.example .env.local
# AUTH_SECRET / WATERMARK_SECRET / CRON_SECRET / BREVO_WEBHOOK_SECRET を生成して埋める:
#   openssl rand -base64 32

# 4. DB マイグレーション
npm run db:migrate

# 5. dev server
npm run dev
# → http://localhost:3000
```

### よく使うコマンド

| コマンド              | 用途                                                          |
| --------------------- | ------------------------------------------------------------- |
| `npm run dev`         | dev server (Turbopack)                                        |
| `npm run db:up`       | Postgres コンテナ起動                                         |
| `npm run db:down`     | Postgres コンテナ停止 (データは保持)                          |
| `npm run db:reset`    | Postgres 完全リセット (volume ごと削除)                       |
| `npm run db:generate` | `db/schema.ts` から SQL マイグレーションを差分生成            |
| `npm run db:migrate`  | 未適用マイグレーションを DB に適用                            |
| `npm run db:studio`   | Drizzle Studio (https://local.drizzle.studio) で DB 閲覧      |
| `npm run lint`        | ESLint                                                        |

### 初期 admin アカウントの作成

会員管理画面 (`/admin/*`) には `users.is_admin = TRUE` のユーザーだけ入れる。

```bash
# 1. /signup で自分のアカウントを作る (メール認証は dev では mailpit 等で受け取る)
# 2. psql で is_admin を立てる
docker exec -it ochacomet-postgres psql -U ochacomet -d ochacomet_dev -c \
  "UPDATE users SET is_admin = true WHERE email = 'you@example.com';"
```

### API テスト (Bruno)

UI なしで signup / login / フレンドコード検証などを叩くための Bruno collection を `bruno/` に同梱。

```bash
# Bruno を未インストールなら
brew install bruno   # GUI
# または CLI
npm i -g @usebruno/cli

# GUI: Bruno を起動 → Open Collection → このリポジトリの bruno/ を選択
# CLI 例:
cd bruno
bru run "01 Auth/01 Signup.bru" --env Local
```

**典型フロー (Local 環境)**:
1. `01 Auth/01 Signup` → ユーザー作成 + verification email (dev では Vercel Function ログ or Postgres `verification_tokens` テーブルから token を取得)
2. token を Bruno の `verifyToken` 環境変数に設定 → `02 Verify Email (GET)` 実行
3. `04 CSRF Token` → 環境変数 `csrfToken` に自動保存
4. `05 Login` → cookie jar に session-token が入る
5. `06 Session` で current user を確認

`bruno/02 Friend Codes/01 Validate (stub)` は実装次第でアサーションを足す。

## ディレクトリ構成 (1st リリーススコープ)

```
ochacomet-web/
├── app/
│   ├── layout.tsx                         # OchaComet ブランド共通レイアウト
│   ├── page.tsx                           # 公開 LP (Hero / Features / Pro Plan / CTA)
│   ├── friends/page.tsx                   # noindex のフレンドコード受領者ガイド
│   ├── (auth)/                            # サインアップ / ログイン / メール認証
│   ├── account/                           # マイページ + /account/download
│   ├── admin/                             # /admin/users + /admin/releases
│   ├── (public)/unsubscribe/page.tsx      # 1-click unsubscribe 確認画面
│   └── api/
│       ├── auth/[...nextauth]/            # Auth.js ハンドラ
│       ├── codes/validate/                # 拡張から叩かれるフレンドコード検証
│       ├── download/[artifact]/           # 認証 + watermark + レート制限
│       ├── admin/                         # ZIP upload / フレンドコード発行
│       ├── cron/email-campaign/           # Vercel Cron が日次で叩く
│       ├── email/unsubscribe/             # 1-click unsubscribe (RFC 8058)
│       └── webhooks/brevo/                # Brevo delivered/opened/bounce
├── components/                            # Header, Footer 等共通 UI
├── db/
│   ├── schema.ts                          # Drizzle スキーマ (11 table + 7 enum)
│   └── migrations/                        # drizzle-kit generate の出力
├── lib/
│   ├── db.ts                              # Drizzle クライアント (singleton pool)
│   ├── password.ts                        # argon2id ラッパ
│   ├── email.ts                           # Auth.js 経由の transactional メール
│   ├── brevo.ts                           # Brevo SDK ラッパ
│   ├── campaign.ts                        # friend_received 5 段の step 配列
│   ├── blob.ts                            # Vercel Blob put/get
│   ├── watermark.ts                       # ZIP に WATERMARK.txt 注入
│   ├── rateLimit.ts                       # KV ベースレート制限 (10 req / 24h)
│   └── audit.ts                           # download_audit / admin_actions 書き込み
├── auth.ts                                # Auth.js v5 設定
├── middleware.ts                          # /account /admin ガード
├── drizzle.config.ts
├── next.config.ts
├── docker-compose.yml                     # ローカル Postgres
└── .env.local.example
```

実装の優先順は `~/.claude/plans/1st-lp-zip-plan-fizzy-alpaca.md` の §3 を参照。

## 環境変数

`.env.local.example` を `.env.local` にコピーして埋める。Vercel 本番では同じキーを Project Settings → Environment Variables に投入する。

| 変数                                      | 用途                                                |
| ----------------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`                            | Postgres 接続文字列 (ローカル / Vercel Postgres)    |
| `AUTH_SECRET`                             | Auth.js JWT 署名鍵 (`openssl rand -base64 32`)      |
| `AUTH_URL`                                | 本番では `https://ochacomet.aoyamacreate.com`       |
| `BLOB_READ_WRITE_TOKEN`                   | Vercel Blob (ZIP ストレージ)                        |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN`    | Upstash Redis (レート制限)                          |
| `WATERMARK_SECRET`                        | ZIP 透かしの HMAC-SHA256 鍵                         |
| `BREVO_API_KEY`, `BREVO_WEBHOOK_SECRET`   | Brevo (メール送信 + Webhook 署名検証)               |
| `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | 送信元                                              |
| `BREVO_TPL_*`                             | Brevo Template ID (作成後の数値)                    |
| `CRON_SECRET`                             | Vercel Cron が `/api/cron/*` を叩く Bearer トークン |

## デプロイ (Vercel)

1. Vercel ダッシュボードで `ochacomet-web` プロジェクトを作成 (GitHub 連携)
2. Storage → Postgres / Blob を attach、Marketplace から Upstash Redis を attach
3. Environment Variables に `.env.local.example` の各キーを投入 (`AUTH_URL` は本番ドメイン)
4. デプロイ → `*.vercel.app` で動作確認
5. Settings → Domains で `ochacomet.aoyamacreate.com` (本番) と `dev.ochacomet.aoyamacreate.com` (preview) を追加
6. レジストラ DNS に Vercel 指示の CNAME / A レコードを登録 (DNS 反映 10分〜数時間)
7. Brevo の SPF/DKIM/DMARC を `aoyamacreate.com` に追加 (反映 24-48h)

詳細は `~/.claude/plans/1st-lp-zip-plan-fizzy-alpaca.md` の Day 0 5 フェーズを参照。

## 設計参照

- 全体ロードマップ: `../17-auto-comment-sender/docs/release-plan.md`
- ZIP 配布: `../17-auto-comment-sender/docs/design/06-zip-distribution.md`
- 会員サイト: `../17-auto-comment-sender/docs/design/07-member-site.md`
- LP: `../17-auto-comment-sender/docs/design/04-web-pages.md`
- ステップメール: `../17-auto-comment-sender/docs/design/09-step-email-campaign.md`
- フレンドコード判定: `../17-auto-comment-sender/docs/design/01-license-verification.md`
# ochacomet-web
