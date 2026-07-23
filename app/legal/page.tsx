// 特定商取引法に基づく表記
//
// カタログ型 (請求あり次第開示) — 事業者名と連絡先メールのみ常時公開し、
// 住所・電話番号は購入者からの請求があれば遅滞なく開示する形式。
// 個人事業主が住所公開を避けるための一般的な手法 (要件は満たす)。
//
// 後で会社化・レンタルオフィス契約等を経て、住所をフル開示に切り替える可能性あり。
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "OchaComet の事業者情報",
};

const LAST_UPDATED = "2026年5月19日";

export default function LegalPage_() {
  return (
    <LegalPage
      title="特定商取引法に基づく表記"
      lastUpdated={LAST_UPDATED}
    >
      <table>
        <tbody>
          <tr>
            <th>販売事業者名</th>
            <td>青山 あるは (Aluha Aoyama)</td>
          </tr>
          <tr>
            <th>所在地</th>
            <td>
              請求があり次第、遅滞なく開示します。
              <br />
              <span className="text-xs text-ink-soft">
                (お問い合わせ先メールアドレス宛にご請求ください)
              </span>
            </td>
          </tr>
          <tr>
            <th>電話番号</th>
            <td>
              請求があり次第、遅滞なく開示します。
              <br />
              <span className="text-xs text-ink-soft">
                (お問い合わせは原則メールにて承ります)
              </span>
            </td>
          </tr>
          <tr>
            <th>メールアドレス</th>
            <td>
              <a href="mailto:support@ochacomet.aoyamacreate.com">
                support@ochacomet.aoyamacreate.com
              </a>
            </td>
          </tr>
          <tr>
            <th>運営責任者</th>
            <td>青山 あるは</td>
          </tr>
          <tr>
            <th>販売価格</th>
            <td>
              各商品の購入ページ (
              <a href="/pricing">/pricing</a>
              ) に記載
              <br />
              <span className="text-xs text-ink-soft">
                月額プラン: ¥1,480 (税込) / 月
                <br />
                年額プラン: ¥14,800 (税込) / 年
              </span>
            </td>
          </tr>
          <tr>
            <th>商品代金以外の必要料金</th>
            <td>
              インターネット接続料金、通信料金等はお客様の負担となります。
            </td>
          </tr>
          <tr>
            <th>お支払い方法</th>
            <td>
              クレジットカード (Stripe 経由で Visa, Mastercard, American Express, JCB 等)
            </td>
          </tr>
          <tr>
            <th>お支払い時期</th>
            <td>
              月額プラン: 各請求月の同日に自動課金
              <br />
              年額プラン: 契約日から 1 年ごとに自動課金
              <br />
              無料トライアル期間 (14 日間) は課金されません。
            </td>
          </tr>
          <tr>
            <th>商品の引渡し時期</th>
            <td>
              お申し込み後、即時に Pro 機能をご利用いただけます。
              拡張機能はマイページからいつでもダウンロード可能です。
            </td>
          </tr>
          <tr>
            <th>解約・返金</th>
            <td>
              詳細は <a href="/refund">返金ポリシー</a> をご確認ください。
              <br />
              解約は <a href="/account/subscription">マイページ</a>{" "}
              または Stripe のカスタマーポータルから行えます。
            </td>
          </tr>
          <tr>
            <th>動作環境</th>
            <td>
              Google Chrome (バージョン 114 以上) / Chromium ベースのブラウザ
              <br />
              17LIVE Web 版 (https://www.17.live/) のアカウントが必要です
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-8 text-xs text-ink-soft">
        ※ 本ページは「特定商取引に関する法律」第 11 条 (通信販売についての広告) に基づく表記です。
        ご請求があった場合は、購入者の方に対し、所在地・電話番号を遅滞なくお伝えします。
      </p>
    </LegalPage>
  );
}
