// signup / login / verify-email 共通のカードレイアウト。
// LP と同じ緑単色基調 (canvas / surface / ink / primary) で揃える。
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: Props) {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md">
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
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-extrabold text-ink"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export const inputClass =
  "block w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export const primaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-full border border-line bg-canvas px-4 py-2.5 text-sm font-extrabold text-ink transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";
