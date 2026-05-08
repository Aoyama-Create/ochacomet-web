import type { Metadata } from "next";
import { Zen_Kaku_Gothic_Antique } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const zenKaku = Zen_Kaku_Gothic_Antique({
  variable: "--font-zen-kaku",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const APP_NAME = "OchaComet";
const APP_TAGLINE = "配信者のそばに、そっと光る一杯。";
const APP_DESCRIPTION =
  "OchaComet は 17.live ガーディアンのための Chrome 拡張です。配信中のギフト・入退室・フォローに自動で気の利いたコメントを返し、配信者と一緒に配信を盛り上げます。";

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
      className={`${zenKaku.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[var(--font-zen-kaku)]">
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
