// 法務系ページ (Terms / Privacy / Refund / Legal) の共通レイアウト。
// 見出し階層、リスト、リンクのスタイルを統一する。
import type { ReactNode } from "react";

type Props = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalPage({ title, lastUpdated, children }: Props) {
  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <header className="mb-10 border-b border-line pb-8">
          <h1 className="text-3xl font-black tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            最終更新日: {lastUpdated}
          </p>
        </header>
        <article className="prose-legal">{children}</article>
      </div>
    </main>
  );
}
