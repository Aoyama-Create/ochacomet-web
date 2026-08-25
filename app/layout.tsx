import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// 日本語は OS 標準の角ゴシックに任せる（app/globals.css の --font-sans 参照）。
// 以前は Zen Maru Gothic を読み込んでいたが、変数名の食い違いで一度も適用されて
// おらず、実質ダウンロードされていなかった。効かせると日本語 Web フォント分の
// 転送とフォント切り替わりが増えるため、読み込み自体をやめる。

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const APP_NAME = "OchaComet";
const APP_TAGLINE =
  "17LIVE ガーディアンのコメント送信を支える配信サポートアプリ";
const APP_DESCRIPTION =
  "OchaComet は 17LIVE のガーディアン (トップリスナー) と認証ライバーのための配信サポートアプリです。入室通知・大ギフトへのお礼・テンプレート送信を「通知 → 承認 → 送信」の手動フローで補助。あなたの会話を肩代わりせず、定型のひと押しだけを引き受けます。macOS に対応（Windows は準備中）。基本機能は無料、Pro プランは 14 日間無料トライアル付き。";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  // 空文字列 ("") もフォールバック対象にするため `||` を使う。
  // (Vercel の Sensitive env vars が CLI pull 時に "" として落ちてくるケース対策)
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    locale: "ja_JP",
    type: "website",
  },
};

// テーマ復元スクリプト。<html> に .dark を付けるだけの最小限。
//
// なぜ Provider ではなくインラインスクリプトなのか:
// next.config.ts の cacheComponents (PPR) 下では「Suspense の外での動的アクセス」が
// ビルドエラーになるため、cookies() でテーマを読む SSR 方式は採れない。
// root layout は静的シェルのまま保ちたい (components/Header.tsx のコメント参照)。
// localStorage を直接読んで first paint 前に class を当てるのが、この構成での唯一の
// ちらつきゼロの方法。
//
// beforeInteractive 相当のタイミングで走らせたいので next/script ではなく素の <script>。
const THEME_INIT = `(function(){try{
var s=localStorage.getItem("ochacomet-theme");
var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.classList.toggle("dark",d);
}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning は上のスクリプトが <html> の class を
    // サーバー出力より先に書き換えるため。ここだけの例外。
    <html
      lang="ja"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
