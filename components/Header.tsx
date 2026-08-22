// 共通ヘッダー。
//
// **このコンポーネント自体は同期（静的）に保つこと。**
// ここで `await auth()` を呼ぶと root layout 経由で配下の全ページが動的になり、
// 規約ページのような完全に静的な文書まで CDN キャッシュも静的プリレンダも効かなくなる
// （実際そうなっており、/terms の TTFB が 400ms、コールドスタートが 1.8 秒だった）。
//
// ログイン状態で出し分ける部分は HeaderAuth に切り出し、Suspense でストリーミングする。
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { HeaderAuth, HeaderAuthFallback } from "./HeaderAuth";

// 背景は不透明な白（bg-surface）。透過していたころは backdrop-blur で下地を
// 透かしていたが、不透明にすると blur は効かないので外してある。
//
// ★ border-b は外さないこと。LP のヒーローは bg-primary-soft なので白との
//   境目が色差で見えるが、それ以外のページは body が bg-canvas (#faf9f4) で
//   白との差がほぼ無く、線を外すとヘッダーが溶ける。
export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-extrabold text-ink"
        >
          {/* 透過のマーク。角丸は掛けない（丸める対象の面が無い） */}
          <Image
            src="/ochacomet-mark.svg"
            width={28}
            height={28}
            alt=""
            aria-hidden
            className="h-7 w-7"
            unoptimized
          />
          OchaComet
        </Link>

        <Suspense fallback={<HeaderAuthFallback />}>
          <HeaderAuth />
        </Suspense>
      </div>
    </header>
  );
}
