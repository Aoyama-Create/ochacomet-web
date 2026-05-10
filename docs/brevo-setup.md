# Brevo セットアップ運用 Runbook

> OchaComet の transactional / drip メールを Brevo で送るための初期セットアップ + Sender 切り替え手順。
>
> **対応する設計書**: [17-auto-comment-sender/docs/design/09-step-email-campaign.md](../../17-auto-comment-sender/docs/design/09-step-email-campaign.md)

## 1. 全体像

```
[1st リリース時]                    [本番運用時]
─────────────────────              ─────────────────────────
Brevo アカウント作成                  Brevo アカウント作成済
       ↓                                   ↓
Gmail を Single Sender             aoyamacreate.com を
として暫定登録                       Domain Authentication
       ↓                                   ↓
動作確認 (自分宛 only)              noreply@ochacomet.aoyamacreate.com
                                    Sender 追加
                                          ↓
                                    Vercel env を 1 行書き換え
                                          ↓
                                    自動再デプロイ完了
```

**コード設計上の前提**: 送信元アドレスは `BREVO_SENDER_EMAIL` 環境変数で渡しているため、Sender 切替は **コード変更不要 / env 書き換えのみ**で完結する ([lib/brevo.ts](../lib/brevo.ts) 参照)。

---

## 2. 暫定セットアップ (Gmail Sender)

> **用途**: 自分宛の疎通確認・Vercel ログ確認まで。テスター配布前に **必ず**「3. 本番セットアップ」へ移行すること (Gmail Sender はスパム判定されやすく、テスターに届きにくい)。

### 2.1 Brevo アカウント作成

1. https://www.brevo.com/ → **Sign up free**
2. 連絡先 Email / パスワードを入力
3. 確認メール → リンククリック
4. プラン: **Free** (1 日 300 通)

### 2.2 Single Sender 登録 (Gmail)

1. 左サイドバー → **Senders, Domains & Dedicated IPs** → **Senders** タブ
2. **Add a Sender** をクリック
3. 入力:
   - **From Name**: `OchaComet`
   - **From Email**: 受信できる Gmail (例: `you@gmail.com`)
4. **Save**
5. Gmail に Brevo から「Confirm your sender email」メール → リンクをクリック
6. Brevo Sender 一覧で緑のチェック ✓ になれば認証完了

### 2.3 API Key 発行

1. 左サイドバー → **SMTP & API** → **API Keys** タブ
2. **+ Generate a new API key**
3. Name: `ochacomet-web-production`
4. **Generate** → 表示された `xkeysib-xxxxx...` を**すぐコピー** (一度しか表示されない)
5. 1Password / Bitwarden などに保管

### 2.4 Templates 作成 (1st 必須 4 種)

`Campaigns → Templates → + New template → Email → Transactional` で以下を作成:

| Internal name | Subject (例) | 本文で参照する変数 |
|---|---|---|
| `tpl_verification` | `[OchaComet] メールアドレスの確認` | `{{ params.verifyUrl }}` |
| `tpl_password_reset` | `[OchaComet] パスワード再設定` | `{{ params.resetUrl }}` |
| `tpl_welcome` | `[OchaComet] ご登録ありがとうございます` | (任意) |
| `tpl_friend_code_issued` | `[OchaComet] フレンドコードを発行しました` | `{{ params.code }}` `{{ params.expiresAt }}` `{{ params.friendsUrl }}` |

各テンプレ作成後、ID (画面に表示される数値) をメモする。

#### 本文 HTML 例 (`tpl_verification`)

```html
<p>OchaComet にご登録ありがとうございます。</p>
<p>下記のリンクを 24 時間以内に開いて、メールアドレスを確認してください。</p>
<p><a href="{{ params.verifyUrl }}">{{ params.verifyUrl }}</a></p>
<p>心当たりがない場合はこのメールは破棄してください。</p>
```

### 2.5 Vercel env に投入

Vercel Project → Settings → Environment Variables (Production + Preview):

| Key | Value |
|---|---|
| `BREVO_API_KEY` | `xkeysib-...` (Sensitive にチェック) |
| `BREVO_SENDER_EMAIL` | **暫定**: 登録した Gmail (例: `you@gmail.com`) |
| `BREVO_SENDER_NAME` | `OchaComet` |
| `BREVO_TPL_VERIFICATION` | template ID |
| `BREVO_TPL_PASSWORD_RESET` | template ID |
| `BREVO_TPL_WELCOME` | template ID |
| `BREVO_TPL_FRIEND_CODE_ISSUED` | template ID |
| `BREVO_WEBHOOK_SECRET` | 既存の値を保持 |

Save → 自動再デプロイ。

### 2.6 動作確認

1. `https://ochacomet.aoyamacreate.com/signup` で別の Gmail (= テスター用) に登録
2. 受信トレイ (+ **spam フォルダ**) を確認
3. リンクをクリック → 認証完了
4. Vercel Function Logs で `[brevo:dev-fallback]` がもう出ないことを確認

---

## 3. 本番セットアップ (独自ドメイン認証)

### 3.1 ドメイン認証 (Brevo 側)

1. Brevo → **Senders, Domains & Dedicated IPs** → **Domains** タブ
2. **Add a Domain** → `aoyamacreate.com` を入力
3. 認証用の DNS レコード一覧が表示される。**4 つの値を控える** (現行仕様: 所有確認 TXT + DKIM 2 本 CNAME + DMARC TXT):

| 種類 | Brevo の "Name" | 種別 | 値の例 |
|---|---|---|---|
| **Brevo code** (所有確認) | `@` (root) | TXT | `brevo-code:654392354e0453f8117828c2f75012f0` |
| **DKIM 1** | `brevo1._domainkey` | CNAME | `b1.aoyamacreate-com.dkim.brevo.com` |
| **DKIM 2** | `brevo2._domainkey` | CNAME | `b2.aoyamacreate-com.dkim.brevo.com` |
| **DMARC** | `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` |

> **Note**: Brevo の DKIM はかつて `mail._domainkey` の TXT 1 本だったが、現行仕様では `b1` / `b2._domainkey` の **CNAME 2 本** に変わっている。CNAME 先のホスト名はドメインのドット (`.`) をハイフン (`-`) に置き換えた形で `<domain-with-hyphen>.dkim.brevo.com` になる (例: `aoyamacreate.com` → `aoyamacreate-com.dkim.brevo.com`)。
>
> SPF はこの仕様では明示的に要求されない (DKIM のみで Brevo の domain authentication は成立)。送達率を後で更に上げたい場合のみ別途追加。

### 3.2 ムームー DNS にレコード追加

1. https://muumuu-domain.com/checkout/login にログイン
2. 左サイドバー **ドメイン操作** → **ムームー DNS**
3. `aoyamacreate.com` の **変更** ボタン
4. **カスタム設定** タブ (初回はカスタム設定の有効化に同意)
5. 以下の 4 レコードを追加:

| サブドメイン | 種別 | 内容 (Brevo の値そのまま、引用符なし) | 優先度 |
|---|---|---|---|
| **(空欄)** ← `@` の意味 | TXT | `brevo-code:<Brevo が提示した hex>` | (空) |
| `brevo1._domainkey` | CNAME | `b1.aoyamacreate-com.dkim.brevo.com` | (空) |
| `brevo2._domainkey` | CNAME | `b2.aoyamacreate-com.dkim.brevo.com` | (空) |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | (空) |

6. **セットアップ情報変更** で保存

#### ムームー DNS の入力上の注意

- **`@` は空欄**: ムームー DNS では root (= ドメインそのもの) を表すには **サブドメイン欄を空欄**にする。`@` の文字を入れない
- **CNAME の値は末尾ドットなしで OK**: `b1.aoyamacreate-com.dkim.brevo.com` のように貼ると自動で FQDN 扱い
- **CNAME のサブドメインに `_` (アンダースコア) を含む値は許容**: `brevo1._domainkey` でエラーは出ない
- **TXT の値に引用符 `"..."` を付けない**: 中身だけ貼る
- **既存 SPF レコードに干渉しない**: 今回 SPF は追加しないので、既存の root TXT (もしあれば) はそのまま
- **Vercel 用の既存レコードは触らない**: `ochacomet` の CNAME (cname.vercel-dns.com) など Vercel 設定済のものはそのまま

### 3.3 DNS 反映確認

10 分〜数時間 (最大 48 時間)。コマンドラインで:

```bash
dig +short aoyamacreate.com TXT | grep brevo-code           # 所有確認 TXT
dig +short brevo1._domainkey.aoyamacreate.com CNAME         # DKIM 1
dig +short brevo2._domainkey.aoyamacreate.com CNAME         # DKIM 2
dig +short _dmarc.aoyamacreate.com TXT                      # DMARC
```

期待される出力:
```
"brevo-code:654392354e0453f8117828c2f75012f0"
b1.aoyamacreate-com.dkim.brevo.com.
b2.aoyamacreate-com.dkim.brevo.com.
"v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com"
```

4 行すべて値が返れば反映完了。

### 3.4 Brevo で Verify

1. Brevo の Domains 画面に戻る
2. `aoyamacreate.com` の **Authenticate this domain** (or 各レコード横の **Verify**) をクリック
3. 全レコードに緑のチェックマーク ✓ が付けば成功

### 3.5 本番 Sender 追加

1. **Senders** タブ → **Add a Sender**
2. 入力:
   - **From Name**: `OchaComet`
   - **From Email**: `noreply@ochacomet.aoyamacreate.com`
3. **Save**

ドメイン認証済みなら個別の verification email は不要 (または届けば受信して確認)。

### 3.6 Vercel env を 1 行書き換え

Vercel Project → Settings → Environment Variables:

```
BREVO_SENDER_EMAIL  =  noreply@ochacomet.aoyamacreate.com
```

→ Save → 自動再デプロイ。**コード変更不要**で切り替え完了。

### 3.7 暫定 Gmail Sender の整理

Brevo の Senders 一覧から、暫定で登録した Gmail の Sender を **Delete** (任意。残しても害はない)。

### 3.8 動作確認

#### 3.8.1 mail-tester でスコア

1. https://www.mail-tester.com/ を開いて表示される一意のメール (例: `test-xxxxx@srv1.mail-tester.com`) をコピー
2. Brevo → Templates → `tpl_verification` を開く
3. **Send test** → 上記メールアドレスに送信
4. mail-tester に戻って **Then check your score** → **9.0 / 10 以上**ならドメイン認証成功

#### 3.8.2 サインアップで実際に送る

1. `https://ochacomet.aoyamacreate.com/signup` で新しいメールで登録
2. 受信トレイ (主に inbox に届くこと、spam フォルダに**入っていない**こと) を確認
3. リンクをクリック → 認証完了

---

## 4. トラブルシューティング

| 症状 | 原因 / 対処 |
|---|---|
| Brevo の Domains で「The domain is not authenticated yet」 | DNS 反映を待つ。`dig` で値が見えてもキャッシュ伝播待ち、最大 48h。ログ採りには [§3.3 の dig コマンド](#33-dns-反映確認) を使う |
| `dig` で TXT/CNAME が空 | レジストラ側でレコードがそもそも入っていない、もしくはサブドメイン欄を間違えている。ムームー DNS は **サブドメイン欄に `aoyamacreate.com` を含めない** (例: `brevo1._domainkey.aoyamacreate.com` ではなく `brevo1._domainkey` だけ書く) |
| `dig CNAME` が `NXDOMAIN` を返す | CNAME の Name に `_` を含む場合、レジストラによっては受け付けないが、ムームー DNS は受け付ける。値の末尾にドット `.` が必要かを再確認。基本は不要 |
| Brevo で 4 つのうち一部だけ赤バツ | そのレコードだけ追加漏れ or 値ミス。ムームー DNS の対応行を再確認して修正 + 再保存 |
| メールが spam フォルダ | DKIM 1/2 のどちらかが未認証または値が違う。mail-tester の詳細で確認。両方緑なら通常 inbox に届く |
| `[brevo:dev-fallback]` がログに残る | `BREVO_API_KEY` または `BREVO_SENDER_EMAIL` が空。Vercel env を確認 + 再デプロイ |
| 「Sender not authenticated」 (送信時エラー) | `BREVO_SENDER_EMAIL` のドメインが認証ドメイン外 (例: 認証は `aoyamacreate.com`、Sender が `gmail.com`)。一致するように env を書き換え |
| MX レコード問題で Sender verification email が届かない | 一時的に自分の Gmail を Sender にしてテスト後、MX を整えて切り替え |
| 暫定 Gmail で送ると spam に入る | これは仕様 (Brevo 経由送信なのに From が Gmail で DKIM の selector 不一致)。テスターには「3. 本番セットアップ」完了後に配布 |

---

## 5. 関連ファイル

- 送信ロジック: [`lib/brevo.ts`](../lib/brevo.ts) — Brevo SMTP API ラッパ
- 送信用途別 wrapper: [`lib/email.ts`](../lib/email.ts) — `sendVerificationEmail` / `sendPasswordResetEmail` / `sendWelcomeEmail`
- env テンプレート: [`.env.local.example`](../.env.local.example)
- 設計書: [09-step-email-campaign.md](../../17-auto-comment-sender/docs/design/09-step-email-campaign.md)

---

## 6. 切替日のチェックリスト (本番運用開始時)

- [ ] DNS 4 レコード (Brevo code TXT / DKIM 1 CNAME / DKIM 2 CNAME / DMARC TXT) がムームー DNS に追加され `dig` で 4 行すべて見える
- [ ] Brevo Domains で `aoyamacreate.com` が緑のチェック (4 つ全部)
- [ ] `noreply@ochacomet.aoyamacreate.com` を Sender に追加 + verify 済
- [ ] Vercel env の `BREVO_SENDER_EMAIL` を本番アドレスに更新
- [ ] mail-tester.com で **9.0/10 以上**
- [ ] `/signup` 実テストで spam フォルダに入らず inbox に届く
- [ ] 暫定 Gmail Sender を Brevo から Delete (任意)
