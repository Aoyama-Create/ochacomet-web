// プライバシーポリシー
//
// Lemon Squeezy 店舗審査の必須要件 + 個人情報保護法 (日本) に準拠する範囲。
// 提供者の連絡先と収集情報・利用目的を明示。
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "OchaComet における個人情報の取り扱いについて",
};

const LAST_UPDATED = "2026年5月19日";

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー" lastUpdated={LAST_UPDATED}>
      <p>
        OchaComet (以下「本サービス」) の提供者 (以下「当方」) は、ユーザーの個人情報を以下のとおり取り扱います。
        本サービスを利用する前に、本ポリシーをよくお読みください。
      </p>

      <h2>第 1 条 (収集する情報)</h2>
      <p>当方は、本サービスの提供にあたり、次の情報をユーザーから取得します。</p>
      <ol>
        <li>
          <strong>アカウント登録情報</strong>: メールアドレス、パスワード (argon2id でハッシュ化して保存)
        </li>
        <li>
          <strong>決済情報</strong>: Lemon Squeezy 経由で受け取る顧客 ID、サブスクリプション ID、
          ライセンスキー、トライアル期限、サブスク状態 (active / past_due / cancelled 等)。
          クレジットカード番号は当方では収集せず、Lemon Squeezy 側でのみ保管されます。
        </li>
        <li>
          <strong>利用ログ</strong>: ダウンロード履歴 (バージョン、IP アドレス、User-Agent、ダウンロード時刻)、
          フレンドコードの発行・適用履歴、管理アクションログ
        </li>
        <li>
          <strong>メール配信状況</strong>: 送信ログ、配信完了 / 開封 / バウンス / 配信停止の状態 (Brevo Webhook 経由)
        </li>
        <li>
          <strong>拡張機能 (Chrome 拡張) のローカルデータ</strong>: 配信中に検知したギフト・入退室イベント、テンプレート、
          ニックネーム等の設定情報。これらは <strong>ユーザーのブラウザ内 (chrome.storage.local) に保存</strong>され、
          当方のサーバには送信されません。ただし、メール認証時のメールアドレス、ライセンス検証時のライセンスキー、
          フレンドコード検証時のコード等、認証目的のデータは当方のサーバに送信されます。
        </li>
      </ol>

      <h2>第 2 条 (利用目的)</h2>
      <p>当方は、取得した個人情報を以下の目的で利用します。</p>
      <ol>
        <li>本サービスの提供、運営、保守</li>
        <li>ユーザー認証、不正利用防止、アカウント管理</li>
        <li>有料プランの課金処理、サブスクリプション状態の管理</li>
        <li>本サービスに関するお知らせ、サポート、メール配信 (transactional + 任意のマーケティングメール)</li>
        <li>サービス改善のための統計分析 (個人を特定しない形での集計)</li>
        <li>法令に基づく対応、不正行為への対処</li>
      </ol>

      <h2>第 3 条 (第三者提供)</h2>
      <p>
        当方は、ユーザーの同意なく個人情報を第三者に提供しません。ただし、次のいずれかに該当する場合はこの限りではありません。
      </p>
      <ol>
        <li>法令に基づく場合 (裁判所、警察等からの開示請求)</li>
        <li>人の生命、身体、財産の保護のために必要であり、ユーザーの同意を得ることが困難な場合</li>
        <li>本サービスの運営に必要な業務委託先 (下記) に対し、必要な範囲で提供する場合</li>
      </ol>

      <h2>第 4 条 (業務委託先)</h2>
      <p>当方は、本サービスの運営にあたり、以下の業務委託先を利用します。これらの委託先は各自のプライバシーポリシーに従って情報を取り扱います。</p>
      <table>
        <thead>
          <tr>
            <th>委託先</th>
            <th>用途</th>
            <th>提供情報</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vercel Inc.</td>
            <td>Web ホスティング、関数実行</td>
            <td>HTTP リクエスト全般 (IP、UA、Cookie 等)</td>
          </tr>
          <tr>
            <td>Neon Inc.</td>
            <td>データベース (Postgres)</td>
            <td>アカウント情報、利用ログ、決済情報</td>
          </tr>
          <tr>
            <td>Lemon Squeezy (Sold through Link, LLC)</td>
            <td>決済処理、サブスクリプション管理</td>
            <td>メールアドレス、決済情報 (クレジットカード番号は LS が直接管理)</td>
          </tr>
          <tr>
            <td>Brevo (旧 Sendinblue)</td>
            <td>メール配信</td>
            <td>メールアドレス、配信本文、配信状態</td>
          </tr>
          <tr>
            <td>Upstash (Vercel Marketplace 経由)</td>
            <td>レート制限、キャッシュ</td>
            <td>ユーザー ID と一時的なカウンタ</td>
          </tr>
        </tbody>
      </table>

      <h2>第 5 条 (Cookie / セッション管理)</h2>
      <p>
        本サービスは、ユーザー認証を維持するためにブラウザの Cookie を使用します。
        セッショントークンは Auth.js (NextAuth.js) によって JWT 形式で発行・検証されます。
        Cookie の無効化は技術的に可能ですが、その場合ログインを必要とする機能が利用できなくなります。
      </p>
      <p>
        本サービスは現時点で Google Analytics 等の第三者解析ツールを使用していません。
        将来導入する場合は、本ポリシーを更新したうえで、ユーザーに通知します。
      </p>

      <h2>第 6 条 (情報の管理・保管期間)</h2>
      <ol>
        <li>パスワードは argon2id でハッシュ化し、平文では保存しません。</li>
        <li>
          ダウンロード履歴等の監査ログは原則 1 年間保持し、それ以降は自動削除されます (運用上の必要に応じて延長する場合あり)。
        </li>
        <li>アカウント削除の希望があれば、関連情報を合理的な期間内に削除します。法令により保管が必要な情報を除く。</li>
      </ol>

      <h2>第 7 条 (開示・訂正・利用停止の請求)</h2>
      <p>
        ユーザーは、自己の個人情報について、開示、訂正、追加、削除、利用停止の請求を行うことができます。
        請求は{" "}
        <a href="mailto:support@ochacomet.aoyamacreate.com">support@ochacomet.aoyamacreate.com</a>{" "}
        宛にメールでお願いします。本人確認のため、追加で情報をお尋ねする場合があります。
      </p>

      <h2>第 8 条 (海外への移転)</h2>
      <p>
        前述の業務委託先のうち、Vercel、Neon、Lemon Squeezy、Brevo、Upstash は米国またはヨーロッパに本社を置いており、
        個人情報は同国のデータセンターに保管される場合があります。各社は GDPR / CCPA に準拠した運用を行っています。
      </p>

      <h2>第 9 条 (本ポリシーの変更)</h2>
      <p>
        当方は、必要に応じて本ポリシーを変更します。変更後のポリシーは、本サービス上に掲載した時点で効力を生じます。
        重要な変更がある場合はメール等で別途お知らせします。
      </p>

      <h2>お問い合わせ</h2>
      <p>
        本ポリシーに関するお問い合わせは{" "}
        <a href="mailto:support@ochacomet.aoyamacreate.com">support@ochacomet.aoyamacreate.com</a>{" "}
        までご連絡ください。
      </p>
    </LegalPage>
  );
}
