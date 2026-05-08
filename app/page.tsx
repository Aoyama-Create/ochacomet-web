// 公開 LP (設計書 04 §2)。
// セクション: Hero / Features 3 カラム / How it Works 4 ステップ / Pro Plan 比較 / Final CTA
// 1st リリース: Lemon Squeezy は未連携なので「Pro 購入」は「準備中」状態。
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      {/* HERO */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-amber-50 via-zinc-50 to-zinc-50">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center md:py-28">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            17LIVE 配信者の相棒
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            配信者のそばに、
            <br className="md:hidden" />
            そっと光る一杯。
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-700 sm:text-lg">
            17LIVE のギフト・入退室・フォローに合わせて、自動でコメントを返す Chrome 拡張。
            配信者と一緒に配信を盛り上げます。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-7 py-3 text-base font-medium text-white hover:bg-zinc-800"
            >
              会員登録して試す (無料)
            </Link>
            <a
              href="#pro-plan"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-7 py-3 text-base font-medium text-zinc-900 hover:border-zinc-400"
            >
              Pro プランを見る
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES OVERVIEW */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">主な機能</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <FeatureCard
              icon="🤖"
              title="自動コメント送信"
              body="ギフト・入退室・フォロー・シェアに自動で返信。送信タイミングはランダム/固定で人間らしく。"
            />
            <FeatureCard
              icon="📋"
              title="テンプレート管理"
              body="複数のテンプレートを色分けで管理。ニックネーム挿入や条件分岐対応で配信スタイルに合わせられます。"
            />
            <FeatureCard
              icon="🎁"
              title="ギフト集計 (Pro)"
              body="セッション単位でギフトを自動集計。BC 順位・日付別記録・CSV 出力で配信を振り返れます。"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">使い方</h2>
          <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
            <Step
              n={1}
              title="会員登録 + ZIP 取得"
              body="会員サイトに登録すると拡張の ZIP をダウンロードできます。"
            />
            <Step
              n={2}
              title="拡張を読み込む"
              body="Chrome の chrome://extensions で「パッケージ化されていない…」を選択。"
            />
            <Step
              n={3}
              title="17LIVE で設定"
              body="拡張アイコンから動作モード・テンプレートを設定します。"
            />
            <Step
              n={4}
              title="自動で送信"
              body="ギフトや入室を検知すると、設定したコメントを自動送信します。"
            />
          </ol>
        </div>
      </section>

      {/* PRO PLAN */}
      <section id="pro-plan" className="bg-white scroll-mt-16">
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">プラン比較</h2>
          <p className="mt-2 text-center text-sm text-zinc-500">
            まずは無料プランでお試しいただき、必要に応じて Pro へ。
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <PlanCard
              title="Free"
              price="¥0"
              priceSuffix=""
              cta={
                <Link
                  href="/signup"
                  className="block rounded-full bg-zinc-900 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800"
                >
                  無料で始める
                </Link>
              }
              features={[
                "自動コメント送信",
                "テンプレート管理 (ニックネーム挿入)",
                "ギフト・フォロー・入退室・シェア検知",
                "通知制御",
              ]}
            />
            <PlanCard
              title="Pro"
              price="¥980"
              priceSuffix="/月"
              highlight
              cta={
                <button
                  type="button"
                  disabled
                  className="block w-full cursor-not-allowed rounded-full bg-zinc-200 py-2.5 text-center text-sm font-medium text-zinc-500"
                >
                  購入 (準備中)
                </button>
              }
              features={[
                "Free プランの全機能",
                "ギフト集計 (BOX/通常/イベント自動分類)",
                "ユーザー別ランキング (BC降順)",
                "日付別記録 / セッション管理",
                "CSV / JSON エクスポート",
              ]}
              footnote="14 日間の無料トライアル付き"
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-zinc-900 text-zinc-50">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">今すぐ始めよう</h2>
          <p className="max-w-md text-sm text-zinc-300">
            無料登録は 1 分で完了。クレジットカード不要。
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-amber-300 px-8 py-3 text-base font-bold text-amber-950 hover:bg-amber-400"
          >
            会員登録して試す
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
      <div aria-hidden className="text-4xl">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{body}</p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-xl bg-white p-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
        {n}
      </div>
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600">{body}</p>
    </li>
  );
}

function PlanCard({
  title,
  price,
  priceSuffix,
  features,
  cta,
  highlight,
  footnote,
}: {
  title: string;
  price: string;
  priceSuffix: string;
  features: string[];
  cta: React.ReactNode;
  highlight?: boolean;
  footnote?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        highlight
          ? "border-amber-300 bg-amber-50/40 shadow-sm"
          : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-bold">{title}</h3>
        {highlight ? (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
            おすすめ
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-sm text-zinc-500">{priceSuffix}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-2 text-sm text-zinc-700">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5 text-emerald-600">
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>
      {footnote ? (
        <p className="mt-4 text-xs text-zinc-500">{footnote}</p>
      ) : null}
      <div className="mt-6">{cta}</div>
    </div>
  );
}
