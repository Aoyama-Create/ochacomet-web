// 公開 LP — 招待制ベータ募集 (1st リリースのフェーズに合わせた構成)。
// セクション: Hero / Why this exists / How it helps / Our Policy / How to Join / FAQ / Final CTA
// ポジショニング: ガーディアン中心 + 認証ライバーも歓迎 / 「自動」ではなく「通知 → 承認 → 送信の補助」
// 配色: 緑単色基調 (拡張 popup.css の #48875b 系)
import Link from "next/link";
import { OchaCometPopup } from "@/components/lp/OchaCometPopup";
import { NotificationToast } from "@/components/lp/NotificationToast";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <WhyThisExists />
      <HowItHelps />
      <OurPolicy />
      <HowToJoin />
      <Faq />
      <FinalCta />
    </main>
  );
}

/* ============================================================
   Hero
   ============================================================ */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-52 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(72,135,91,0.18)_0%,transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-72 -left-52 h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(72,135,91,0.10)_0%,transparent_65%)]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-24">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1 text-[12px] font-bold tracking-wide text-primary">
            <span aria-hidden className="oc-pulse h-1.5 w-1.5 rounded-full bg-primary" />
            招待制ベータ募集中 · 17LIVE ガーディアン向け
          </span>
          <h1 className="mb-5 text-[34px] font-black leading-[1.25] tracking-tight sm:text-[44px] lg:text-[52px]">
            毎晩、推しの配信を
            <br />
            <span className="relative inline-block text-primary">
              <span className="relative z-10">支えるあなたへ。</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 z-0 h-2.5 rounded bg-primary-soft"
              />
            </span>
          </h1>
          <p className="mb-3 max-w-[520px] text-[17px] leading-relaxed text-ink-soft">
            入室通知、ギフトへのお礼、定期的な一声。
            ガーディアンの「あと一言」を、Chrome 拡張がそっと手伝います。
          </p>
          <p className="mb-8 max-w-[520px] text-[14px] leading-relaxed text-ink-soft">
            完全自動化のためのツールではありません。<strong className="font-extrabold text-ink">通知 → 承認 → 送信</strong>の手動フローで、
            あなたの会話を肩代わりせず、定型のひと押しだけを引き受けます。
          </p>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_18px_rgba(72,135,91,0.32)] transition-transform hover:-translate-y-px hover:bg-primary-hover"
            >
              <MailIcon />
              ベータ募集に登録する
            </Link>
            <a
              href="#how-to-join"
              className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-7 py-3.5 text-[15px] font-extrabold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              招待の流れを見る
            </a>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-soft">
            <li className="inline-flex items-center gap-1.5">
              <CheckIcon /> 招待制（フレンドコードを受け取り次第ご案内）
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckIcon /> ベータ期間中は無料でご利用可
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckIcon /> いつでも退会できます
            </li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[380px] md:mx-0 md:w-fit">
          {/* 通知トースト: モバイルでは popup の上にスタック、md+ で左上に被せて「通知 → 承認 → 送信」の瞬間を可視化 */}
          <div className="mb-3 md:absolute md:-left-14 md:-top-8 md:z-20 md:mb-0 md:rotate-[-3deg]">
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
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto w-full max-w-4xl px-6 py-24">
        <SectionHead
          tag="Why this exists"
          title="気づけば、毎晩 PC の前。"
          lead="配信の少し前から張り付いて、入室への挨拶、迷惑な人の見張り、定期的な盛り上げ、ライバーさんへの報告。"
        />
        <div className="grid gap-4 text-[15px] leading-relaxed text-ink md:grid-cols-2">
          <p>
            ガーディアンを続けていると、いつのまにか配信中はずっと
            コメント欄から目が離せなくなります。新しく入ってきたリスナーへの一声、
            大ギフトを贈ってくれたギフターへのお礼、コンボへの反応 ——
            一つひとつは小さくても、積み重なると 3 時間 4 時間と続きます。
          </p>
          <p>
            OchaComet は、その<strong className="font-extrabold">「あと一言」を素早く届ける</strong>ためだけの補助です。
            あなたの代わりに喋るのではなく、入室通知や大ギフトを見逃さないようにし、
            候補テンプレを横に並べておくだけ。<strong className="font-extrabold">送るかどうかはあなたが決めます。</strong>
          </p>
        </div>
        <p className="mt-8 text-center text-[13px] text-ink-soft">
          認証ライバーの方も、配信中の細かな対応を軽くするためにお使いいただけます。
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
      title: "入室・退出を見逃さない",
      body: "新規リスナーやリピーターの入退室を検知し、popup に通知。横に並んだ候補テンプレからワンタップで一声を送れます。",
    },
    {
      n: "02",
      icon: "📝",
      title: "テンプレートとニックネーム挿入",
      body: "挨拶・お礼・告知のテンプレを最大 20 件登録。リスナーごとのニックネームを差し込んで、テンプレ感のない一言に。",
    },
    {
      n: "03",
      icon: "📒",
      title: "ガチイベ期の見守り記録",
      body: "ギフターの大ギフト・コンボ・イベントギフトをセッション単位で記録。配信後の振り返りや、ライバーさんへの報告に使えます。",
    },
  ];

  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          tag="How it helps"
          title="あなたの会話は、あなたのまま。"
          lead="代行ではなく補助。通知 → 承認 → 送信の手動フローを中心に、定型の作業だけを軽くします。"
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
              <p className="text-[14px] leading-relaxed text-ink-soft">{it.body}</p>
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
          title="補助に徹するための、設計思想。"
          lead="ガーディアン文化を壊さず、17LIVE のルールも壊さない使い方を、ツール側から後押しします。"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <PolicyCard
            title="完全自動より、手動承認を推奨"
            body="既定の動作モードは「通知 → 承認 → 送信」。完全自動モードも切り替えで選べますが、初期画面では推奨されません。"
          />
          <PolicyCard
            title="17LIVE 利用規約に準拠した使い方を"
            body="自動化に該当しうる挙動はリスクが伴います。完全自動の常用ではなく、補助としての利用をお願いしています。ご利用は配信者ご自身の責任において。"
          />
          <PolicyCard
            title="データはあなたの PC に留めます"
            body="設定・テンプレート・ギフト記録は Chrome のローカルストレージに保存。配信中のコメントやリスナー情報を外部サーバーへ送ることはありません。"
          />
          <PolicyCard
            title="人間味を残す細部"
            body="送信前のランダム遅延、テンプレのバリエーション、ニックネーム差し込みなど、ファミリー感を保つための仕掛けを標準搭載しています。"
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
   How to Join
   ============================================================ */
function HowToJoin() {
  const steps = [
    {
      n: 1,
      title: "メールで登録",
      body: "メールアドレスとパスワードでアカウント作成。本人確認のメールが届きます。",
    },
    {
      n: 2,
      title: "招待を待つ",
      body: "ベータ枠のご案内ができ次第、フレンドコードと案内をメールでお送りします。",
    },
    {
      n: 3,
      title: "拡張を読み込む",
      body: "chrome://extensions で「パッケージ化されていない拡張機能を読み込む」から選択。5〜10 分ほど。",
    },
    {
      n: 4,
      title: "推しの配信で使う",
      body: "popup でフレンドコードを入力し、配信ページを開けばすぐに通知が動き始めます。",
    },
  ];

  return (
    <section id="how-to-join" className="scroll-mt-16 bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          tag="How to join"
          title="招待の流れ。"
          lead="ベータ枠は順次ご案内します。お急ぎの場合はメール本文でご相談ください。"
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
              <p className="text-[13px] leading-relaxed text-ink-soft">{s.body}</p>
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
      q: "17LIVE の利用規約に違反しませんか？",
      a: "OchaComet は「通知 → 承認 → 送信」の手動フローを推奨設定としており、完全自動の常用は想定していません。ただし自動化に該当しうる挙動を含むため、最終的な利用範囲は配信者ご自身の判断と責任でお願いしています。17LIVE の規約は適宜ご確認ください。",
    },
    {
      q: "使うとアカウントが BAN されることはありますか？",
      a: "弊社が BAN を保証することも、回避を保証することもできません。手動承認モードでの利用 + 送信前のランダム遅延 + 人間らしいバリエーションのテンプレ、という設計上の配慮はありますが、最終的なリスクは利用者側にあります。",
    },
    {
      q: "配信のコメントやリスナー情報は外部に送られますか？",
      a: "送りません。設定・テンプレ・ギフト記録などはすべて Chrome のローカルストレージに保存され、当方のサーバーへ送信されることはありません。会員サイトに送るのはメールアドレスとログイン情報のみです。",
    },
    {
      q: "招待が届くまでどれくらいかかりますか？",
      a: "ベータ枠は順次ご案内しています。早ければ数日、混雑時で 2〜3 週間ほどお待ちいただくことがあります。お急ぎの場合は登録時のメールでご事情をお知らせください。",
    },
    {
      q: "ベータ期間中の料金は？将来の料金は？",
      a: "ベータ期間中は無料でご利用いただけます。将来的に有料プランを予定していますが、価格・開始時期ともに正式決定後にメールで事前にご案内します。決まる前に課金が発生することはありません。",
    },
    {
      q: "認証ライバーですが、使えますか？",
      a: "はい、ご利用いただけます。配信中のリスナー対応の細部を軽くする補助として設計されており、ライバー側の利用も歓迎しています。ベータ募集フォームのご事情欄にその旨をお書きください。",
    },
  ];

  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-3xl px-6 py-24">
        <SectionHead
          tag="FAQ"
          title="よくあるご質問。"
          lead="ベータご利用前に、特に気になりやすい点をまとめました。"
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
          まずは、招待を受け取るところから。
        </h2>
        <p className="relative mx-auto mb-8 max-w-md text-[16px] text-white/75">
          メールアドレスを登録いただくと、ベータ枠が空き次第ご案内します。
          無理にお誘いすることはありません。
        </p>
        <Link
          href="/signup"
          className="relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-[15px] font-extrabold text-primary-deep shadow-[0_6px_18px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-px"
        >
          <MailIcon />
          ベータ募集に登録する
        </Link>
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
