// 「← ○○に戻る」のリンク。7 箇所で同じ形が書かれていたので共通化した。
// 矢印は文字ではなくアイコン（文字だとフォント依存で高さと太さが揃わない）。
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-extrabold text-ink-soft transition-colors hover:text-primary"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
      {children}
    </Link>
  );
}
