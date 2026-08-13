// /account 配下の読み込み中表示。
//
// これが無いと App Router は「サーバーコンポーネントの解決が終わるまで遷移しない」ため、
// ボタンを押しても一拍なにも起きず、固まったように見える。
// loading.tsx を置くと Next.js が自動で Suspense 境界を張り、**即座に遷移してから**
// この内容を出すようになる。
//
// /account 配下（download / profile / subscription）はどれもカードを縦に積む構成なので、
// 共通のカード骨組みで足りる。ページごとに用意すると二重管理になる。

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="h-3 w-28 animate-pulse rounded bg-line" />
        <div className="mt-3 h-7 w-64 animate-pulse rounded bg-line" />

        <CardSkeleton lines={3} />
        <CardSkeleton lines={2} />
      </div>
    </main>
  );
}

function CardSkeleton({ lines }: { lines: number }) {
  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface p-8">
      <div className="h-3 w-24 animate-pulse rounded bg-line" />
      <div className="mt-4 h-8 w-40 animate-pulse rounded bg-line" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-line"
            // 行ごとに長さを変えて、のっぺりしないようにする
            style={{ width: `${90 - i * 18}%` }}
          />
        ))}
      </div>
      <div className="mt-6 h-10 w-44 animate-pulse rounded-full bg-line" />
    </section>
  );
}
