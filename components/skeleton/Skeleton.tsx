// スケルトンの共通部品。
//
// なぜ要るのか: loading.tsx は「ページ全体の穴」の fallback になる
// (cacheComponents 下では page.tsx が auth() を呼ぶため、その page が
//  丸ごと動的な穴になり、loading.tsx がそのセグメント唯一の Suspense 境界になる)。
// つまりスケルトンは「ページの一部」ではなく「ページ全体のレイアウト」と
// 一致していないと、確定時に必ずガタつく。
//
// 以前は app/account/loading.tsx 1 枚が max-w の異なる 5 ページ
// (5xl / 2xl / 3xl / 3xl / 2xl) を兼ねていて、原理的に追従できなかった。
// ルートごとに loading.tsx を置き、器はここから借りる形にする。
//
// 寸法を実物に合わせる方針は components/HeaderAuth.tsx の
// HeaderAuthFallback（透明な実寸ダミー）と同じ考え方。

export type Width = "md" | "2xl" | "3xl" | "5xl" | "6xl";

const MAX_W: Record<Width, string> = {
  md: "max-w-md",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

/** ページの器。max-w と縦パディングを実ページに合わせて渡す。 */
export function PageSkeleton({
  width,
  py = "py-12",
  children,
}: {
  width: Width;
  /** 実ページの py-* をそのまま渡す (マイページだけ py-8) */
  py?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className={`mx-auto w-full ${MAX_W[width]} px-6 ${py}`}>
        {children}
      </div>
    </main>
  );
}

/** 1 本のバー。幅はクラスで渡す。 */
export function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-line ${className}`} />;
}

/** 「← 戻る」+ h1 (+ リード文) の見出しブロック。 */
export function HeadingSkeleton({
  back = false,
  lead = false,
}: {
  back?: boolean;
  lead?: boolean;
}) {
  return (
    <>
      {back ? <Bar className="h-3 w-28" /> : null}
      {/* h1 は text-2xl = 行の高さ約 32px */}
      <Bar className={`${back ? "mt-2" : ""} h-8 w-56`} />
      {lead ? <Bar className="mt-2 h-3 w-72" /> : null}
    </>
  );
}

/** 角丸カード。実ページの mt-* / p-* をそのまま渡す。 */
export function CardSkeleton({
  className = "mt-6",
  padding = "p-6",
  children,
}: {
  className?: string;
  padding?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={`${className} rounded-2xl border border-line bg-surface ${padding}`}
    >
      {children}
    </section>
  );
}

/** dl を n 列で並べたときの行。マイページ・サブスクの基本情報用。 */
export function DefinitionListSkeleton({
  rows,
  cols = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  rows: number;
  cols?: string;
}) {
  return (
    <div className={`mt-4 grid grid-cols-1 gap-x-6 gap-y-2 ${cols}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 border-b border-line/60 py-2"
        >
          <Bar className="h-3 w-20" />
          <Bar className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/** 表。列数と行数を実物に合わせる。 */
export function TableSkeleton({
  columns,
  rows = 6,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="min-w-full text-sm">
        <thead className="bg-canvas">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Bar className="h-2.5 w-12" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Bar className={`h-3 ${c === 1 ? "w-40" : "w-12"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
