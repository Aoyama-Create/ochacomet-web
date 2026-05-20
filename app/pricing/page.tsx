// /pricing — 料金プラン詳細ページ
//
// Lemon Squeezy 店舗審査で参照される独立ページ。
// LP の Pricing セクションより詳しい比較表、支払い方法、トライアル詳細、FAQ を持つ。
// CTA は招待制ベータ運用中なので /signup へ。LS チェックアウトに切り替えは Phase 4 で。
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "料金プラン",
  description:
    "OchaComet の料金プラン。Free ¥0 / Pro 月額 ¥1,480 / 年額 ¥14,800 (税込)。14 日間の無料トライアル付き。",
};

export default function PricingPage() {
  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <PageHeader />
      <PlanCards />
      <FeatureMatrix />
      <PaymentInfo />
      <PricingFaq />
      <BottomCta />
    </main>
  );
}

function PageHeader() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-4xl px-6 py-16 text-center">
        <span className="mb-3 inline-block font-[var(--font-nunito)] text-[12px] font-extrabold uppercase tracking-[0.2em] text-primary">
          Pricing
        </span>
        <h1 className="mb-3 text-[34px] font-black tracking-tight sm:text-[42px]">
          料金プラン
        </h1>
        <p className="mx-auto max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Free からはじめて、必要に応じて Pro へ。
          すべての有料プランに <strong className="font-extrabold text-ink">14 日間の無料トライアル</strong>{" "}
          が付きます。トライアル中はいつでも無料で解約できます。
        </p>
        <p className="mt-4 inline-block rounded-full bg-primary-soft px-4 py-1.5 text-[13px] text-primary-deep">
          ベータ期間中はすべて無料。正式版開始は事前にメールでお知らせします。
        </p>
      </div>
    </section>
  );
}

function PlanCards() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <PlanCard
            name="Free"
            price="¥0"
            unit="ずっと無料"
            tagline="まずはここから"
            cta={{ href: "/signup", label: "無料で始める" }}
          />
          <PlanCard
            name="Pro Monthly"
            price="¥1,480"
            unit="/ 月 (税込)"
            tagline="月単位で始めたい方に"
            highlighted
            cta={{ href: "/signup", label: "14 日無料で試す" }}
            note="トライアル期間中はいつでも解約可。請求は 15 日目から。"
          />
          <PlanCard
            name="Pro Yearly"
            price="¥14,800"
            unit="/ 年 (税込)"
            tagline="2 ヶ月分お得"
            cta={{ href: "/signup", label: "14 日無料で試す" }}
            note="月額換算 ¥1,233。1 年で約 ¥2,960 お得です。"
          />
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  name,
  price,
  unit,
  tagline,
  cta,
  highlighted,
  note,
}: {
  name: string;
  price: string;
  unit: string;
  tagline: string;
  cta: { href: string; label: string };
  highlighted?: boolean;
  note?: string;
}) {
  return (
    <article
      className={
        highlighted
          ? "relative rounded-2xl border-2 border-primary bg-surface p-8 shadow-[0_10px_28px_rgba(72,135,91,0.18)]"
          : "rounded-2xl border border-line bg-surface p-8"
      }
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
          おすすめ
        </span>
      ) : null}
      <h2 className="mb-1 text-[20px] font-black text-ink">{name}</h2>
      <p className="mb-5 text-[12px] text-ink-soft">{tagline}</p>
      <div className="mb-6 flex items-baseline gap-1.5">
        <span className="text-[40px] font-black text-ink">{price}</span>
        <span className="text-[12px] text-ink-soft">{unit}</span>
      </div>
      <Link
        href={cta.href}
        className={
          highlighted
            ? "mb-3 inline-flex w-full items-center justify-center rounded-full bg-primary py-3 text-[14px] font-extrabold text-white hover:bg-primary-hover"
            : "mb-3 inline-flex w-full items-center justify-center rounded-full border border-line bg-canvas py-3 text-[14px] font-extrabold text-ink hover:border-primary hover:text-primary"
        }
      >
        {cta.label}
      </Link>
      {note ? (
        <p className="text-[11px] leading-relaxed text-ink-soft">{note}</p>
      ) : null}
    </article>
  );
}

function FeatureMatrix() {
  const rows: { feature: string; free: string | boolean; pro: string | boolean }[] = [
    { feature: "自動コメント送信 (手動承認モード)", free: true, pro: true },
    { feature: "完全自動モード (切替式)", free: true, pro: true },
    { feature: "テンプレート管理 (最大 20 件)", free: true, pro: true },
    { feature: "ニックネーム挿入", free: true, pro: true },
    { feature: "ギフト・入退室・フォロー・シェア検知", free: true, pro: true },
    { feature: "通知設定 (デスクトップ通知)", free: true, pro: true },
    { feature: "ランダム遅延 (人間らしさ)", free: true, pro: true },
    { feature: "ギフト集計 (BOX / 通常 / イベント自動分類)", free: false, pro: true },
    { feature: "ユーザー別ランキング (BC 降順)", free: false, pro: true },
    { feature: "日付別記録 / セッション管理", free: false, pro: true },
    { feature: "CSV / JSON エクスポート", free: false, pro: true },
    { feature: "サポート (メール)", free: "通常", pro: "優先" },
  ];

  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <h2 className="mb-8 text-center text-[24px] font-black text-ink">
          機能比較
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-canvas">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th className="px-4 py-3 text-left font-extrabold text-ink">
                  機能
                </th>
                <th className="w-24 px-4 py-3 text-center font-extrabold text-ink-soft">
                  Free
                </th>
                <th className="w-24 px-4 py-3 text-center font-extrabold text-primary">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.feature}
                  className={i % 2 === 0 ? "bg-canvas" : "bg-surface/40"}
                >
                  <td className="px-4 py-3 text-ink">{r.feature}</td>
                  <td className="px-4 py-3 text-center">
                    <Cell value={r.free} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Cell value={r.pro} highlighted />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Cell({
  value,
  highlighted,
}: {
  value: string | boolean;
  highlighted?: boolean;
}) {
  if (typeof value === "boolean") {
    return value ? (
      <span
        aria-label="あり"
        className={
          highlighted
            ? "inline-grid h-6 w-6 place-items-center rounded-full bg-primary text-white"
            : "inline-grid h-6 w-6 place-items-center rounded-full bg-line text-ink-soft"
        }
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    ) : (
      <span aria-label="なし" className="text-ink-soft">
        —
      </span>
    );
  }
  return <span className="text-[13px] text-ink">{value}</span>;
}

function PaymentInfo() {
  const items = [
    {
      title: "支払い方法",
      body: "クレジットカード (Visa / Mastercard / American Express / JCB)。Lemon Squeezy を通じて安全に決済します。",
    },
    {
      title: "14 日間の無料トライアル",
      body: "Pro プランは 14 日間無料で全機能をお試しいただけます。トライアル中はいつでも解約可能で、課金は 15 日目から開始されます。",
    },
    {
      title: "自動更新",
      body: "月額プランは毎月、年額プランは毎年、契約日と同じ日に自動で更新されます。解約はいつでもマイページから可能。",
    },
    {
      title: "解約・返金",
      body: "解約は契約期間の終了時点で反映され、残り期間は引き続き Pro 機能をご利用いただけます。返金は原則行いませんが、不具合・誤課金は個別にご相談ください。",
    },
  ];

  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <h2 className="mb-10 text-center text-[24px] font-black text-ink">
          お支払いについて
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-line bg-surface p-6"
            >
              <h3 className="mb-2 text-[15px] font-extrabold text-ink">
                {it.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                {it.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-[12px] text-ink-soft">
          詳細は <Link href="/refund" className="underline hover:text-primary">返金ポリシー</Link>{" "}
          /{" "}
          <Link href="/legal" className="underline hover:text-primary">
            特定商取引法に基づく表記
          </Link>{" "}
          をご確認ください。
        </p>
      </div>
    </section>
  );
}

function PricingFaq() {
  const items = [
    {
      q: "ベータ期間中も Pro プランを購入できますか?",
      a: "現在は招待制ベータ運用中のため、有料プランの販売はまだ開始していません。フレンドコードをお持ちの方は Pro 相当の機能を期間限定でお試しいただけます。正式版開始時にメールでご案内します。",
    },
    {
      q: "Free と Pro の違いは何ですか?",
      a: "コメント自動送信・テンプレート管理など基本機能は Free でもご利用いただけます。Pro ではギフト集計やランキング、エクスポートなど配信後の振り返りに便利な機能が追加されます。",
    },
    {
      q: "途中で月額 → 年額 (またはその逆) に変更できますか?",
      a: "はい、可能です。マイページから切り替えていただけます。差額の精算は Lemon Squeezy の標準ルールに従います。",
    },
    {
      q: "トライアル期間中に解約するとどうなりますか?",
      a: "トライアル期間内に解約された場合、課金は発生しません。解約後もトライアル終了日までは Pro 機能をご利用いただけます。",
    },
    {
      q: "領収書・請求書は発行できますか?",
      a: "Lemon Squeezy のカスタマーポータルから領収書 (PDF) をいつでもダウンロードいただけます。個別の請求書フォーマットが必要な場合はお問い合わせください。",
    },
  ];

  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <h2 className="mb-10 text-center text-[24px] font-black text-ink">
          よくあるご質問
        </h2>
        <div className="space-y-3">
          {items.map((it) => (
            <details
              key={it.q}
              className="group rounded-2xl border border-line bg-canvas p-5 open:border-primary/30"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-[15px] font-extrabold text-ink">
                <span>{it.q}</span>
                <span
                  aria-hidden
                  className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition-transform group-open:rotate-45"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <section className="bg-canvas px-6 py-20">
      <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-surface px-10 py-14 text-center">
        <h2 className="mb-3 text-[26px] font-black tracking-tight text-ink sm:text-[30px]">
          まずは Free から、または招待制ベータへ。
        </h2>
        <p className="mx-auto mb-8 max-w-md text-[14px] leading-relaxed text-ink-soft">
          会員登録は 1 分で完了。トライアル付きの Pro プランは正式版開始時にご案内します。
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_18px_rgba(72,135,91,0.32)] hover:-translate-y-px hover:bg-primary-hover"
        >
          会員登録して始める
        </Link>
      </div>
    </section>
  );
}
