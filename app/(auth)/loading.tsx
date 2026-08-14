// (auth) グループの読み込み中表示。
//
// Cache Components 有効下では「Suspense の外での動的アクセス」がビルドエラーになる。
// これらのページは searchParams（callbackUrl / token など）を読むため境界が要る。
// loading.tsx を置けば Next.js が自動で Suspense を張るので、ページ側は触らずに済む。
// 見た目は components/auth/AuthCard.tsx に合わせる。

export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-[0_8px_24px_rgba(72,135,91,0.06)]">
          <div className="h-7 w-40 animate-pulse rounded bg-line" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-line" />
          <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-line" />
          <div className="mt-8 space-y-4">
            <div className="h-10 w-full animate-pulse rounded-lg bg-line" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-line" />
            <div className="h-10 w-full animate-pulse rounded-full bg-line" />
          </div>
        </div>
      </div>
    </main>
  );
}
