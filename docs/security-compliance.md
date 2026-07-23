# セキュリティ対策措置状況 申告根拠（クレジット取引セキュリティ対策協議会 チェックリスト）

Stripe（日本）のアカウント審査で提出する「セキュリティ対策措置状況申告書」の根拠資料。各項目を「実装」または「運用」でどう満たしているかを対応づける。

**大前提**: 決済は **Stripe Checkout（ホスト型決済ページ）** を利用し、**カード情報は当社サーバーを一切通過・保存しない**（PCI DSS SAQ A 相当）。以下はいずれも「はい」で回答できる状態。

---

## §1. 管理者画面のアクセス制限と ID/PW 管理 → ✅

| 要件 | 対応 | 実装箇所 |
| --- | --- | --- |
| 管理者アクセスの IP 制限 or ベーシック認証 | `/admin`・`/api/admin` に **HTTP ベーシック認証**（`ADMIN_BASIC_USER`/`ADMIN_BASIC_PASS`）を最前段で適用 | [proxy.ts](../proxy.ts) `passesBasicAuth` |
| 二段階認証 / 二要素認証 | 管理者ログイン後、**登録メールへ 6 桁 OTP** を送信・確認し、署名済み `admin_2fa` クッキー成立まで `/admin` にアクセス不可 | [proxy.ts](../proxy.ts) / [lib/adminOtp.ts](../lib/adminOtp.ts) / [lib/admin2faCookie.ts](../lib/admin2faCookie.ts) / [app/api/admin/2fa/](../app/api/admin/2fa) / [app/admin/verify/](../app/admin/verify) |
| ログイン失敗でアカウントロック（10 回以下） | 失敗 **10 回で 15 分ロック**。成功でリセット。理由は非開示 | [auth.ts](../auth.ts) `authorize`（`LOGIN_LOCK_THRESHOLD=10`） |
| 管理者パスワード管理 | Argon2id（OWASP 2024 推奨パラメータ）でハッシュ保存 | [lib/password.ts](../lib/password.ts) |

## §2. データディレクトリ露出による設定不備対策 → ✅

- 重要ファイルを公開ディレクトリに置かない：シークレットは環境変数、データは Neon(Postgres)、配布 ZIP は **認証プロキシ経由**でのみ配信（Blob 直 URL は非公開）。`public/` は静的アセットのみ。参照: [lib/blob.ts](../lib/blob.ts) / [app/api/download/[artifact]/route.ts](../app/api/download/%5Bartifact%5D/route.ts)
- アップロード可能ファイルの制限：一般ユーザーのアップロード機能は無い。**管理者のみ**が ZIP をアップロードし、拡張子・SHA-256 を検証。参照: [app/api/admin/releases/route.ts](../app/api/admin/releases/route.ts)

## §3. Web アプリケーションの脆弱性対策 → ✅

- SQL インジェクション対策：**Drizzle ORM のパラメータ化クエリ**のみを使用（生 SQL 連結なし）。
- クロスサイト・スクリプティング対策：**React / Next.js の自動エスケープ**。`dangerouslySetInnerHTML` は使用しない。
- セキュアコーディング / 入力値チェック：認証・フォーム入力にサーバー側バリデーションを実装。リリース前にソースレビューを実施。
- 脆弱性診断 / ペネトレーションテスト（**運用**）：リリース前に OWASP ZAP 等で診断し指摘に対応。以後**四半期ごと**に定期実施する。→ 実施記録を本ファイル末尾に追記していく。

## §4. マルウェア対策（ウイルス対策ソフト）→ ✅（運用）

- 実行基盤は **Vercel（サーバーレス）/ Neon（マネージド Postgres）** で、OS/インフラのマルウェア対策は基盤提供事業者が実施。自社で常駐サーバー OS を保有しない。
- 運用端末（開発 PC）に**ウイルス対策ソフトを導入**し、シグネチャ更新と定期フルスキャンを実施。

## §5. 悪質な有効性確認・クレジットマスター対策 → ✅

- **Stripe が有効性確認の回数を自動制限**（Radar）。
- **EMV 3-D セキュア**を Stripe ダッシュボードで有効化（本人確認）。
- **エラー内容の非表示**：カード入力・エラー表示は Stripe Checkout（ホスト側）が汎用表示。ログイン失敗も理由を開示しない（§1c）。

## §6. 不正ログイン対策 → ✅

- **ユーザー登録時の個人情報（メールアドレス）の確認**：登録時にメール認証を必須化。参照: [lib/auth/signup.ts](../lib/auth/signup.ts) / [lib/auth/verifyEmail.ts](../lib/auth/verifyEmail.ts)
- 補強：ログイン試行回数の制限・ロック（§1c と共通）。

---

## 委託先情報

- セキュリティ対策の実行主体：**自社（従業員）**。開発・運用を自社で実施。

## 関連ページ（審査で URL 提示を求められた場合）

- 特定商取引法に基づく表記: `/legal`
- 返金ポリシー: `/refund`
- プライバシーポリシー: `/privacy`
- 利用規約: `/terms`

## 脆弱性診断 実施記録

| 実施日 | 手法 / ツール | 対象 | 結果・対応 |
| --- | --- | --- | --- |
| (未実施) | OWASP ZAP 等 | 本番相当環境 | リリース前に実施予定 |
