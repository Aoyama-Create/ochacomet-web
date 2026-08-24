// signup / login / verify-email 共通のカードレイアウト。
// LP と同じ緑単色基調 (canvas / surface / ink / primary) で揃える。
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";

type Props = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * 入力欄を 2 列に並べるページ用の、少しだけ広いカード。
   * 会員登録は項目が 4 つあり、1 列だとログイン (2 つ) と高さが揃わないため、
   * 2 列に組んで同じ行数にしている。
   *
   * ログイン (max-w-md / 448px) との差は 64px に留める。ページを行き来したときに
   * カードの大きさが変わって見えるため、2 列が成立する最小限の幅にする。
   */
  wide?: boolean;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
  wide,
}: Props) {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"}`}>
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-[0_8px_24px_rgba(72,135,91,0.06)]">
          <h1 className="text-2xl font-black tracking-tight text-ink">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {description}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? (
          <p className="mt-5 text-center text-sm text-ink-soft">{footer}</p>
        ) : null}
      </div>
    </main>
  );
}

/* ============================================================
   フォーム共通: ラベル / 入力 / プライマリボタン
   ============================================================ */

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      {/*
        hint はラベルの横に置く。入力欄の下に出すとその行だけ背が高くなり、
        2 列に組んだときに行の高さが揃わなくなる。
      */}
      <div className="flex items-baseline gap-2">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-extrabold text-ink"
        >
          {label}
        </label>
        {hint ? (
          <span className="shrink-0 text-[11px] text-ink-soft">{hint}</span>
        ) : null}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export const inputClass =
  "block w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

// 任意同意のチェックボックス。既定オフで使うこと (オプトイン)。
export const checkboxClass =
  "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-primary/20";

// 実体は components/ui/button.ts。ここは既存の import 名を保つための再輸出。
export const primaryButtonClass = buttonClass({ width: "full" });

export const secondaryButtonClass = buttonClass({
  variant: "secondary",
  width: "full",
});
