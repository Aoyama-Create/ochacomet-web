// (public) グループの読み込み中表示。理由は app/(auth)/loading.tsx のコメント参照。

export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-[0_8px_24px_rgba(72,135,91,0.06)]">
          <div className="h-7 w-48 animate-pulse rounded bg-line" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-line" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-line" />
        </div>
      </div>
    </main>
  );
}
