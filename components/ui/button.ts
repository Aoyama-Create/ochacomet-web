// ボタンのクラス定数。
//
// 経緯: 以前は primary 相当の className が 7 箇所、secondary 相当が 6 箇所に
// コピペされていて、padding だけが少しずつ違っていた (px-4/5/6/7/8 の 5 通り)。
// アイコンを入れるにあたって全部に gap-2 を足す必要が出たので、この機会に集約する。
//
// 使い方:
//   <button className={buttonClass()}>保存する</button>              // primary / md
//   <button className={buttonClass({ variant: "danger" })}>削除</button>
//   <Link className={buttonClass({ variant: "ghost", size: "sm" })}>…</Link>
//
// アイコンは children にそのまま置けばよい (gap-2 が効く)。
//   <button className={buttonClass()}><Save className="h-4 w-4" />保存する</button>

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonWidth = "auto" | "full";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT: Record<ButtonVariant, string> = {
  // 主要導線。影はブランド色に合わせた緑寄りのもの。
  primary:
    "bg-primary text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] hover:bg-primary-hover",
  // 併置される副次導線。地は canvas なのでカードの上でも沈まない。
  secondary:
    "border border-line bg-canvas text-ink hover:border-primary hover:text-primary",
  // 取り消せない操作の「確定」だけに使う。入口には使わない (dangerLinkClass 参照)。
  danger: "bg-danger text-white hover:bg-danger-hover",
  // 枠なし。テーブル行の操作など、密度が高い場所向け。
  ghost:
    "border border-line text-ink-soft hover:border-primary hover:text-primary",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-[11px]",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-[15px]",
};

export function buttonClass(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth;
  className?: string;
}): string {
  const variant = opts?.variant ?? "primary";
  const size = opts?.size ?? "md";
  const width = opts?.width === "full" ? "w-full" : "";
  return [BASE, VARIANT[variant], SIZE[size], width, opts?.className ?? ""]
    .filter(Boolean)
    .join(" ");
}

/**
 * 取り消せない操作への「入口」リンク。
 * 塗りつぶしにはせず、赤い文字＋下線に留める。
 * 確定は必ず二段階目 (buttonClass({ variant: "danger" })) で行う。
 */
export const dangerLinkClass =
  "inline-flex items-center gap-1.5 text-xs font-extrabold text-danger-ink underline underline-offset-4 transition-colors hover:text-danger";
