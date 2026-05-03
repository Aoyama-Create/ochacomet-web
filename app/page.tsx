// 1st リリース LP の placeholder。
// セクション構成 (設計書 04-web-pages §2):
//   Hero / Features 3 カラム / How it Works 4 ステップ / Pro Plan 比較 / Final CTA
// 実装は plan §3 Track 2 Week 3 で本実装に差し替え。
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 text-zinc-900">
      <section className="w-full max-w-4xl px-8 py-32 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          OchaComet
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          配信者のそばに、そっと光る一杯。
        </p>
        <p className="mt-8 text-base text-zinc-700 max-w-2xl mx-auto leading-relaxed">
          17.live ガーディアンのための Chrome 拡張。配信中のギフト・入退室・フォローに自動で気の利いたコメントを返し、
          配信者と一緒に配信を盛り上げます。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-3 text-base font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            会員登録して試す
          </Link>
          <Link
            href="/account/subscription"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-8 py-3 text-base font-medium text-zinc-900 hover:bg-white transition-colors"
          >
            Pro プラン (準備中)
          </Link>
        </div>
        <p className="mt-12 text-xs text-zinc-400">
          このページはスケルトン段階の placeholder です。本実装は近日公開予定。
        </p>
      </section>
    </main>
  );
}
