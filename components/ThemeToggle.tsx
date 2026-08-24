// テーマ切り替えボタン。ヘッダー右端に置く。
//
// **components/ 配下で唯一の Client Component。**
// ここで cookies() / headers() を読んではいけない。next.config.ts の
// cacheComponents (PPR) 下では、Suspense の外での動的アクセスがビルドエラーになり、
// Header は root layout 経由で全ページに効くため、配下が丸ごと動的化する。
// (components/Header.tsx の先頭コメント参照)
//
// ★ 現在のテーマを React の state で持たない。
//   state にすると「マウントするまで不定 → 確定したら再描画」となり、
//   アイコンが一瞬遅れて出る。代わりに太陽と月の両方を描いておき、
//   どちらを見せるかは dark: バリアント（= <html> の .dark）に任せる。
//   これで初期描画から正しいアイコンが出て、ハイドレーションのズレも起きない。
//   初期の .dark 付与は app/layout.tsx のインラインスクリプトが担当している。
"use client";

import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "ochacomet-theme";

export function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // プライベートブラウジング等で保存できなくても、切り替え自体は成立させる
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="テーマを切り替える"
      title="テーマを切り替える"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-primary-soft hover:text-primary"
    >
      {/* ライト時は「これから暗くする」= 月、ダーク時は「これから明るくする」= 太陽 */}
      <Moon className="h-4 w-4 dark:hidden" strokeWidth={2.2} />
      <Sun className="hidden h-4 w-4 dark:block" strokeWidth={2.2} />
    </button>
  );
}
