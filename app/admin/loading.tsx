// /admin 配下の読み込み中表示。
// 理由は app/account/loading.tsx のコメント参照（これが無いと遷移が止まって見える）。
// 管理画面は一覧が主なので、行の骨組みを出す。

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="h-7 w-52 animate-pulse rounded bg-line" />
        <section className="mt-8 rounded-2xl border border-line bg-surface p-8">
          <div className="h-3 w-32 animate-pulse rounded bg-line" />
          <ul className="mt-6 divide-y divide-line">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between py-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-line" />
                <div className="h-3 w-20 animate-pulse rounded bg-line" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
