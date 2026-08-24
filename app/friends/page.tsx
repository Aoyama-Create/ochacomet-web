// /friends — フレンドコード受領者向けの限定公開ガイド (設計書 04 §6)
// 検索エンジンにインデックスさせない (sitemap にも含めない、robots にも noindex)
import type { Metadata } from "next";
import { AuthAwareCta } from "@/components/AuthAwareCta";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "フレンドコードで Pro 機能を使う",
  robots: { index: false, follow: false },
};

export default function FriendsPage() {
  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <header className="border-b border-line pb-6">
          <p className="text-xs font-medium text-warning-ink">招待者限定ページ</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            フレンドコードで Pro 機能を使う
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            このページは招待された方限定です。共有されたフレンドコードを使って
            OchaComet の Pro 機能を期間限定でお試しいただけます。
          </p>
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">使い方</h2>
          <ol className="mt-4 space-y-6">
            <Step n={1} title="会員登録 → アプリをダウンロード">
              <p>
                先に会員登録 (無料)
                を済ませ、マイページからアプリのダウンロードに進んでください。
              </p>
              {/*
                ログイン済みなら会員登録／ログインの2択は意味が無いので、
                マイページへの1本に畳む。
              */}
              <div className="mt-3 flex flex-wrap gap-3">
                <AuthAwareCta
                  className="rounded-full bg-primary px-5 py-2 text-sm font-extrabold text-white hover:bg-primary-hover"
                  signedOut="会員登録する"
                  signedIn="マイページへ"
                />
                <AuthAwareCta
                  className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-extrabold text-ink hover:border-primary"
                  signedOutHref="/login"
                  signedOut="既にお持ちの方 → ログイン"
                  signedInHref="/account/download"
                  signedIn="ダウンロードへ"
                />
              </div>
            </Step>

            <Step n={2} title="アプリをインストールして開く">
              <ul className="ml-4 list-disc text-sm text-ink-soft space-y-1">
                <li>
                  ダウンロードしたファイル (macOS は .dmg / Windows は .exe)
                  を開いてインストールします
                </li>
                <li>OchaComet を起動します</li>
                <li>アプリ内で 17LIVE にログインします</li>
              </ul>
            </Step>

            <Step n={3} title="分析タブを開いてフレンドコードを入力">
              <p>
                アプリ上部の「分析」タブを開き、
                招待されたフレンドコードを入力してください。
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                例: <code className="font-mono">OCHA-XXXX-XXXX-XXXX</code>
              </p>
            </Step>

            <Step n={4} title="「有効化」をクリック">
              <p>
                成功すると「有効化されました」と表示され、Pro
                機能が解放されます。 有効期限はステータス欄に表示されます。
              </p>
            </Step>
          </ol>
        </section>

        <section className="mt-12 rounded-xl border border-warning-line bg-warning-soft/60 p-6">
          <h2 className="text-base font-bold text-warning-ink">注意事項</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-warning-ink space-y-1">
            <li>フレンドコードには有効期限があります (通常 30 日)。</li>
            <li>
              期限が切れた場合は、招待者から新しいコードを共有してもらってください。
            </li>
            <li>このページの URL はテスター以外に共有しないでください。</li>
            <li>不具合・要望は招待者まで直接お知らせください。</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-ink">
            Pro 機能でできること
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-ink-soft sm:grid-cols-2">
            <Bullet>ギフト集計 (BOX / 通常 / イベント自動分類)</Bullet>
            <Bullet>ユーザー別ランキング (BC 降順)</Bullet>
            <Bullet>日付別記録</Bullet>
            <Bullet>セッション管理</Bullet>
            <Bullet>CSV / JSON エクスポート</Bullet>
          </ul>
        </section>
      </div>
    </main>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-sm font-bold text-warning-ink">
          {n}
        </span>
        <h3 className="text-base font-bold text-ink">{title}</h3>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </li>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-success-ink"
        strokeWidth={3}
      />
      {children}
    </li>
  );
}
