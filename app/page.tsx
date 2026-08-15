// 公開 LP — Free + Pro 並立型 (フリーミアム)。
// セクション: Hero / Why this exists / How it helps / Our Policy / Who it's for / Pricing / How to Use / FAQ / Final CTA
// ポジショニング: ガーディアン中心 + ライバーも歓迎 / 「自動」ではなく「通知 → 承認 → 送信の補助」 / JTBD 型 課題→解決訴求
// 配色: 緑単色基調 (拡張 popup.css の #48875b 系)
import Link from "next/link";
import { AuthAwareCta } from "@/components/AuthAwareCta";
import { OchaCometPopup } from "@/components/lp/OchaCometPopup";
import { NotificationToast } from "@/components/lp/NotificationToast";

export default function Home() {
  // リリース優先で一旦ヒーローのみ公開する暫定フラグ。
  // NEXT_PUBLIC_LP_HERO_ONLY=true でヒーロー以外を非表示。false / 未設定で全復活。
  const heroOnly = process.env.NEXT_PUBLIC_LP_HERO_ONLY === "true";
  return (
    <main className="flex flex-1 flex-col">
      <Hero heroOnly={heroOnly} />
      {!heroOnly && (
        <>
          <WhyThisExists />
          <HowItHelps />
          <OurPolicy />
          <WhoFor />
          <Pricing />
          <HowToUse />
          <Faq />
          <FinalCta />
        </>
      )}
    </main>
  );
}

/* ============================================================
   Hero
   ============================================================ */
function Hero({ heroOnly }: { heroOnly?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-primary-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-52 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(72,135,91,0.18)_0%,transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-72 -left-52 h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(72,135,91,0.10)_0%,transparent_65%)]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="min-w-0 text-center md:text-left">
          <span className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-surface px-3.5 py-1 text-[11px] font-bold tracking-wide text-primary shadow-[0_1px_2px_rgba(72,135,91,0.08)] sm:text-[12px]">
            <span
              aria-hidden
              className="oc-pulse h-1.5 w-1.5 rounded-full bg-primary"
            />
            ガーディアン・ライバー向け
          </span>
          <h1 className="mb-4 text-[30px] font-black leading-tight tracking-normal [text-shadow:0_0_1px_currentColor] sm:text-[40px] lg:text-[48px]">
            <span className="text-[1.08em] font-semibold">17LIVE</span>
            <span className="text-[0.88em]">の</span>お茶だし
            <span className="text-[0.88em]">と</span>
            <br />
            ギフト反応<span className="text-[0.88em]">を</span>補助
            <span className="text-[0.88em]">する</span>
            <br />
            <span className="relative inline-block text-primary">
              <span className="relative z-10">サポートツール</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 z-0 h-3 rounded bg-canvas"
              />
            </span>
          </h1>
          {/* <p className="mb-5 max-w-[520px] text-[15px] font-bold text-primary-deep">
            — 毎晩の「あと一言」を、もう少し楽に。
          </p> */}
          <p className="mx-auto mb-3 max-w-[520px] text-[17px] leading-relaxed text-ink-soft md:mx-0">
            入室通知、ギフトへのお礼、配信中の記録...
            <br />
            手作業で抱えがちな定型対応を、テンプレ+ワンタップで処理する
            <br />
            サポートツールです。
          </p>
          {/* <p className="mb-8 max-w-[520px] text-[14px] leading-relaxed text-ink-soft">
            動作は「<strong className="font-extrabold text-ink">通知 → 承認 → 送信</strong>」の手動承認フロー。<br />
            会話の代行ではなく、候補テンプレを横に出して、送るかどうかは利用者が決めます。
          </p> */}

          <div className="mb-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <AuthAwareCta
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_18px_rgba(72,135,91,0.32)] transition-transform hover:-translate-y-px hover:bg-primary-hover"
              signedOut={
                <>
                  <MailIcon />
                  無料で始める
                </>
              }
              signedIn="マイページへ"
            />
            {/* 料金セクション非表示 (heroOnly) のときはアンカー切れになるため隠す */}
            {!heroOnly && (
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-7 py-3.5 text-[15px] font-extrabold text-ink transition-colors hover:border-primary hover:text-primary"
              >
                料金プランを見る
              </a>
            )}
          </div>

          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-ink-soft md:justify-start">
            <li className="inline-flex items-center gap-1.5">
              <CheckIcon /> 基本機能はずっと無料
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckIcon /> Pro は 14 日間無料トライアル
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckIcon /> いつでも解約OK
            </li>
          </ul>
        </div>

        <div className="relative mx-auto mt-6 w-full min-w-0 max-w-[320px] sm:max-w-[380px] md:mx-0 md:mt-0 md:w-fit">
          {/* 通知トースト: 全 viewport で popup 左上に被せて「通知 → 承認 → 送信」の瞬間を可視化 */}
          <div className="absolute -left-2 -top-6 z-20 w-[240px] -rotate-3 sm:-left-6 sm:w-[280px] md:-left-14 md:-top-8 md:w-auto">
            <NotificationToast />
          </div>
          <OchaCometPopup />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Why this exists
   ============================================================ */
function WhyThisExists() {
  const items = [
    {
      n: "01",
      icon: "⌨️",
      title: "入室応対の取りこぼし",
      body: "リスナーの入室は分散して発生し、コメントを打っている間に次の入室が重なる。手打ちでは反応が間に合わず、一声が抜けやすい。",
    },
    {
      n: "02",
      icon: "🎁",
      title: "ギフトお礼の重複・漏れ",
      body: "コンボ中に複数のギフトが連続すると、誰に何を返したかを目視で追いきれない。同じ相手に二重に返してしまったり、お礼自体が漏れたりする。",
    },
    {
      n: "03",
      icon: "📋",
      title: "配信後の記録欠落",
      body: "配信終了後、誰がどのギフトを何 BC 贈ったかが残らない。ライバーへの報告や次回の対応に活かせず、毎回スクショを遡ることになる。",
    },
  ];

  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          tag="Why this exists"
          title="ガーディアン業務の、こんな課題に。"
          lead="配信中の応対と配信後の記録は、手作業のままだと取りこぼしや重複が起きやすい作業です。OchaComet はその3つの典型的な負荷を対象にしています。"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <article
              key={it.n}
              className="relative overflow-hidden rounded-2xl border border-line bg-canvas p-8"
            >
              <span
                aria-hidden
                className="absolute right-5 top-4 font-[var(--font-nunito)] text-[44px] font-black leading-none text-line"
              >
                {it.n}
              </span>
              <div
                aria-hidden
                className="mb-4 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-primary-soft text-2xl"
              >
                {it.icon}
              </div>
              <h3 className="mb-2 text-[19px] font-black">{it.title}</h3>
              <p className="text-[14px] leading-relaxed text-ink-soft">
                {it.body}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-[13px] text-ink-soft">
          いずれも、自動化ではなく「気付かせる +
          候補を出す」補助で十分に軽くできる作業です。
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   How it helps
   ============================================================ */
function HowItHelps() {
  const items = [
    {
      n: "01",
      icon: "🔔",
      title: "入室・退出を検知して通知",
      body: "リスナーの入退室を popup に通知。横に並んだ候補テンプレからワンタップで送信できるため、手打ちの遅延をなくす。",
      addresses: "課題01 への対応",
    },
    {
      n: "02",
      icon: "📝",
      title: "テンプレ + ニックネーム差し込み",
      body: "挨拶・お礼・告知のテンプレを最大 20 件登録。リスナーごとのニックネームを自動挿入し、コピペ感のない送信を可能にする。",
      addresses: "課題02 への対応",
    },
    {
      n: "03",
      icon: "📒",
      title: "ギフトをセッション単位で記録",
      body: "BOX・通常・イベントギフトを送信者・BC 数とともに自動記録。配信後に CSV / JSON で書き出し、ライバーへの報告に使える。",
      addresses: "課題03 への対応",
    },
  ];

  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          tag="How it helps"
          title="課題を、こう解決します。"
          lead="Why で挙げた3つの課題に対し、検知 → 通知 → 候補テンプレ提示の流れで、手動承認のまま処理時間を短縮します。"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <article
              key={it.n}
              className="relative overflow-hidden rounded-2xl border border-line bg-surface p-8 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_6px_20px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)]"
            >
              <span
                aria-hidden
                className="absolute right-5 top-4 font-[var(--font-nunito)] text-[44px] font-black leading-none text-line"
              >
                {it.n}
              </span>
              <div
                aria-hidden
                className="mb-4 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-primary-soft text-2xl"
              >
                {it.icon}
              </div>
              <h3 className="mb-2 text-[19px] font-black">{it.title}</h3>
              <p className="text-[14px] leading-relaxed text-ink-soft">
                {it.body}
              </p>
              <p className="mt-3 text-[12px] font-bold text-primary">
                ▶ {it.addresses}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Our Policy
   ============================================================ */
function OurPolicy() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto w-full max-w-4xl px-6 py-20">
        <SectionHead
          tag="Our Policy"
          title="設計上のスタンス。"
          lead="定型作業を軽くしつつ、配信中の会話の質を落とさないために、ツール側で守っている設計上のルールです。"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <PolicyCard
            title="既定モードは手動承認"
            body="起動時の動作モードは「通知 → 承認 → 送信」。送信ボタンを押すのは常に利用者で、自動化モードは設定で明示的に切り替えた場合のみ動作する。"
          />
          <PolicyCard
            title="代行ではなく補助に限定"
            body="テンプレ送信前のランダム遅延、複数バリエーションのテンプレ、ニックネーム差し込みなど、機械的な送信にならないための機構を標準搭載。会話の主導権は利用者側に残す設計。"
          />
          <PolicyCard
            title="データはローカル保存"
            body="設定・テンプレート・ギフト記録は Chrome のローカルストレージに保存。配信中のコメントやリスナー情報を外部サーバーへ送信しない。"
          />
          <PolicyCard
            title="送信パターンを単調にしない"
            body="送信前のランダム遅延、複数候補テンプレからの選択、ニックネーム差し込みにより、同一文言の連投を回避する設計。"
          />
        </div>
      </div>
    </section>
  );
}

function PolicyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-6">
      <div className="mb-2 flex items-start gap-2">
        <span
          aria-hidden
          className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-primary text-white"
        >
          <svg
            width="12"
            height="12"
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
        <h3 className="text-[15px] font-extrabold text-ink">{title}</h3>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

/* ============================================================
   Who it's for
   ============================================================ */
function WhoFor() {
  const items = [
    {
      icon: "🛡",
      title: "17LIVE ガーディアン",
      body: "推しの配信を毎回見守り、入室応対・ギフトお礼・コンボ反応を担当している方。1配信あたりの応対量が多く、手打ちでの追従が難しくなっている方に。",
    },
    {
      icon: "🎤",
      title: "17LIVE ライバー",
      body: "配信中、コメント返しと進行を同時にこなしている方。定型のリアクションをテンプレ化して、リスナーへの応対に集中したい方に。",
    },
    {
      icon: "📊",
      title: "ガチイベ期の記録担当",
      body: "配信後にギフター別の集計や CSV / JSON でのエクスポートが必要な方。手動での記録が現実的でない量のギフトを扱う配信向け。",
    },
  ];

  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          tag="Who it's for"
          title="対象ユーザー。"
          lead="配信中の応対と配信後の記録を、手作業で抱えている方を対象にしています。"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <article
              key={it.title}
              className="rounded-2xl border border-line bg-surface p-8"
            >
              <div
                aria-hidden
                className="mb-4 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-primary-soft text-2xl"
              >
                {it.icon}
              </div>
              <h3 className="mb-2 text-[19px] font-black">{it.title}</h3>
              <p className="text-[14px] leading-relaxed text-ink-soft">
                {it.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Pricing
   ============================================================
   フリーミアム構成 (Free + Pro Monthly + Pro Yearly)。
   Stripe 審査で参照される価格表示の根拠 (詳細は /pricing)。
*/
function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          tag="Pricing"
          title="料金プラン。"
          lead="応対の補助機能は Free で無料利用可。配信記録・集計・エクスポートが必要な場合は Pro(14 日間無料トライアル)。"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <PricingCard
            tier="Free"
            price="¥0"
            unit="ずっと無料"
            description="自動コメント送信・テンプレ・通知の基本機能"
            features={[
              "通知 → 承認 → 送信フロー",
              "テンプレ管理 (最大 20 件)",
              "ニックネーム挿入",
              "ギフト・入退室・フォロー・シェア検知",
            ]}
            cta={{ href: "/signup", label: "無料で始める" }}
          />
          <PricingCard
            tier="Pro Monthly"
            price="¥1,480"
            unit="/ 月 (税込)"
            description="ギフト集計・ユーザー別ランキング・記録エクスポートを追加"
            highlighted
            features={[
              "Free の全機能",
              "ギフト集計 (BOX / 通常 / イベント)",
              "ユーザー別ランキング (BC 降順)",
              "日付別記録 / セッション管理",
              "CSV / JSON エクスポート",
              "14 日間の無料トライアル付き",
            ]}
            cta={{ href: "/signup", label: "14 日無料で始める" }}
          />
          <PricingCard
            tier="Pro Yearly"
            price="¥14,800"
            unit="/ 年 (税込)"
            description="2 ヶ月分お得な年額プラン"
            features={[
              "月額プランの全機能",
              "年額は ¥1,233 / 月相当",
              "1 年で約 ¥2,960 お得",
              "14 日間の無料トライアル付き",
            ]}
            cta={{ href: "/signup", label: "14 日無料で始める" }}
          />
        </div>

        <p className="mt-10 text-center text-[13px] text-ink-soft">
          決済は{" "}
          <a
            href="https://stripe.com/jp"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-primary"
          >
            Stripe
          </a>{" "}
          を通じて行われます。クレジットカード (Visa / Mastercard / AmEx / JCB)
          に対応。
        </p>
        <p className="mt-2 text-center text-[12px] text-ink-soft">
          価格・支払条件の詳細は{" "}
          <Link href="/pricing" className="underline hover:text-primary">
            料金ページ
          </Link>{" "}
          /{" "}
          <Link href="/refund" className="underline hover:text-primary">
            返金ポリシー
          </Link>{" "}
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

function PricingCard({
  tier,
  price,
  unit,
  description,
  features,
  cta,
  highlighted,
}: {
  tier: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  cta: { href: string; label: string };
  highlighted?: boolean;
}) {
  return (
    <article
      className={
        highlighted
          ? "relative rounded-2xl border-2 border-primary bg-surface p-8 shadow-[0_8px_24px_rgba(72,135,91,0.18)]"
          : "rounded-2xl border border-line bg-surface p-8"
      }
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
          おすすめ
        </span>
      ) : null}
      <h3 className="mb-1 text-[18px] font-black text-ink">{tier}</h3>
      <p className="mb-5 text-[13px] leading-relaxed text-ink-soft">
        {description}
      </p>
      <div className="mb-6 flex items-baseline gap-1.5">
        <span className="text-[36px] font-black text-ink">{price}</span>
        <span className="text-[12px] text-ink-soft">{unit}</span>
      </div>
      <ul className="mb-8 space-y-2 text-[13px] text-ink">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">
              <CheckIcon />
            </span>
            <span className="leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>
      <AuthAwareCta
        className={
          highlighted
            ? "inline-flex w-full items-center justify-center rounded-full bg-primary py-2.5 text-[14px] font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] hover:bg-primary-hover"
            : "inline-flex w-full items-center justify-center rounded-full border border-line bg-canvas py-2.5 text-[14px] font-extrabold text-ink hover:border-primary hover:text-primary"
        }
        signedOutHref={cta.href}
        signedOut={cta.label}
        // 有料プランはログイン済みならサブスク管理へ送るのが自然
        signedInHref={highlighted ? "/account/subscription" : "/account"}
        signedIn={highlighted ? "プランを見る" : "マイページへ"}
      />
    </article>
  );
}

/* ============================================================
   How to Use
   ============================================================ */
function HowToUse() {
  const steps = [
    {
      n: 1,
      title: "メールで登録",
      body: "メールアドレスとパスワードでアカウント作成。本人確認のメールが届きます。",
    },
    {
      n: 2,
      title: "アプリをダウンロード",
      body: "マイページから macOS / Windows 版を取得。Free プランはすぐに使えます。",
    },
    {
      n: 3,
      title: "インストールしてログイン",
      body: "インストーラを実行し、アプリ内で 17LIVE にログイン。5 分ほどで終わります。",
    },
    {
      n: 4,
      title: "推しの配信で使う",
      body: "配信ページを開けばすぐに通知が動き始めます。Pro は設定画面からライセンスキーを入力。",
    },
  ];

  return (
    <section id="how-to-use" className="scroll-mt-16 bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          tag="How to use"
          title="使い始めるまでの流れ。"
          lead="アカウント登録からインストールまで、所要時間およそ 10 分。Free プランの利用にクレジットカード登録は不要です。"
        />
        <ol className="relative grid gap-8 md:grid-cols-4">
          <div
            aria-hidden
            className="absolute left-[12%] right-[12%] top-7 hidden h-px md:block"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #e5e3d8 0 8px, transparent 8px 14px)",
            }}
          />
          {steps.map((s) => (
            <li key={s.n} className="relative z-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border-2 border-primary bg-surface font-[var(--font-nunito)] text-xl font-black text-primary shadow-[0_0_0_6px_rgba(72,135,91,0.08)]">
                {s.n}
              </div>
              <h4 className="mb-2 text-[16px] font-extrabold">{s.title}</h4>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
   ============================================================ */
function Faq() {
  const items = [
    {
      q: "OchaComet の動作モードは？",
      a: "既定では「通知 → 承認 → 送信」の手動承認フローで動作します。リスナーの入退室やギフト受領をフックに popup へ通知し、候補テンプレを横に並べて表示します。送信ボタンを押すのは利用者です。完全自動モードは設定で明示的に切り替えた場合のみ動作し、初期画面では選ばれていません。送信前のランダム遅延、複数バリエーションのテンプレ、ニックネーム差し込みなど、同一文言の連投を避けるための機構が標準搭載されています。",
    },
    {
      q: "配信のコメントやリスナー情報は外部に送られますか？",
      a: "送りません。設定・テンプレ・ギフト記録などはすべて Chrome のローカルストレージに保存され、当方のサーバーへ送信されることはありません。会員サイトに送るのはメールアドレスとログイン情報、サポート連絡先などプロフィール情報のみです。",
    },
    {
      q: "Free と Pro の違いは？",
      a: "Free プランは自動コメント送信・テンプレート管理・通知制御など基本機能を無料で永続的にお使いいただけます。Pro プラン (月額 ¥1,480 / 年額 ¥14,800、税込) では、配信後の振り返りに使えるギフト集計・ユーザー別ランキング・日付別記録・CSV エクスポートなどが追加されます。",
    },
    {
      q: "14 日無料トライアルの仕組みは？",
      a: "Pro プランを初めてご契約される方には 14 日間の無料トライアルが付きます。トライアル期間中はいつでも無料で解約でき、課金は 15 日目から開始されます。クレジットカードの登録は必要ですが、トライアル中に解約すれば請求は発生しません。",
    },
    {
      q: "解約や返金はできますか？",
      a: "解約はマイページまたは Stripe のカスタマーポータルからいつでも可能です。解約後も契約期間の終了まで Pro 機能をご利用いただけます。返金は原則行いませんが、不具合・誤課金などは個別にご相談ください (詳細は返金ポリシー)。",
    },
    {
      q: "ライバー側でも使えますか？",
      a: "はい、ご利用いただけます。配信中のリスナー応対を補助する用途で設計されており、ライバー側からの利用にも対応しています。コメント返しと進行を同時にこなす場面で、定型リアクションをテンプレ化してお使いください。",
    },
  ];

  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-3xl px-6 py-24">
        <SectionHead
          tag="FAQ"
          title="よくあるご質問。"
          lead="動作仕様・プラン・トライアル・解約・対象ユーザーに関する代表的な質問をまとめています。"
        />
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

/* ============================================================
   Final CTA
   ============================================================ */
function FinalCta() {
  return (
    <section className="bg-canvas px-6 py-20">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#1f3d29_0%,#162c1f_100%)] px-12 py-16 text-center text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(126,194,143,0.35)_0%,transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-24 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(126,194,143,0.18)_0%,transparent_60%)]"
        />
        <h2 className="relative mb-3 text-[32px] font-black sm:text-[38px]">
          次の配信から、応対と記録を軽くする。
        </h2>
        <p className="relative mx-auto mb-8 max-w-md text-[16px] text-white/75">
          1 分で会員登録 → アプリをダウンロードしてすぐに使えます。 Free
          プランは永続無料、Pro は 14 日間無料でお試しいただけます。
        </p>
        <AuthAwareCta
          className="relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-[15px] font-extrabold text-primary-deep shadow-[0_6px_18px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-px"
          signedOut={
            <>
              <MailIcon />
              無料で始める
            </>
          }
          signedIn="マイページへ"
        />
      </div>
    </section>
  );
}

/* ============================================================
   Shared
   ============================================================ */
function SectionHead({
  tag,
  title,
  lead,
}: {
  tag: string;
  title: string;
  lead: string;
}) {
  return (
    <div className="mb-12 text-center">
      <span className="mb-3 inline-block font-[var(--font-nunito)] text-[12px] font-extrabold uppercase tracking-[0.2em] text-primary">
        {tag}
      </span>
      <h2 className="mb-3 text-[28px] font-black tracking-tight sm:text-[34px]">
        {title}
      </h2>
      <p className="mx-auto max-w-2xl text-[16px] text-ink-soft">{lead}</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  );
}
