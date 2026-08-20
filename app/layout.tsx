import type { Metadata } from "next";
import { Zen_Maru_Gothic, Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const zenMaru = Zen_Maru_Gothic({
  variable: "--font-zen-maru",
  weight: ["400", "500", "700", "900"],
  preload: false,
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const APP_NAME = "OchaComet";
const APP_TAGLINE = "17LIVE ガーディアンのコメント送信を支えるサポートツール";
const APP_DESCRIPTION =
  "OchaComet は 17LIVE のガーディアン (トップリスナー) と認証ライバーのためのサポートツールです。入室通知・大ギフトへのお礼・テンプレート送信を「通知 → 承認 → 送信」の手動フローで補助。あなたの会話を肩代わりせず、定型のひと押しだけを引き受けます。macOS / Windows 対応のデスクトップアプリで提供。基本機能は無料、Pro プランは 14 日間無料トライアル付き。";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${zenMaru.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-[var(--font-zen-maru)]">
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
