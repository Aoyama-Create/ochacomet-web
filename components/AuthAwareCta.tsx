// ログイン状態で中身とリンク先が変わる CTA。
//
// ログイン済みの人に「会員登録」ボタンを見せ続けるのは紛らわしいので、
// マイページへの導線に差し替える。middleware 側でも /signup /login への遷移は
// 塞いでいるが、あちらは「行けてしまったときの受け皿」で、こちらは「そもそも
// 誘わない」ための表示。
//
// **Suspense で包むのが要点。** ここで直接 auth() を呼ぶと、置いたページ全体が
// 動的になり、公開ページを静的配信にした意味が消える（→ 設計は
// components/HeaderAuth.tsx と同じ）。
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getSession } from "@/lib/session";

type Props = {
  /** 呼び出し側のボタンスタイルをそのまま使う */
  className: string;
  /** 未ログイン時の中身 */
  signedOut: ReactNode;
  /** 未ログイン時のリンク先 */
  signedOutHref?: string;
  /** ログイン時の中身 */
  signedIn: ReactNode;
  /** ログイン時のリンク先 */
  signedInHref?: string;
};

export function AuthAwareCta(props: Props) {
  return (
    <Suspense fallback={<Placeholder {...props} />}>
      <Resolved {...props} />
    </Suspense>
  );
}

async function Resolved({
  className,
  signedOut,
  signedOutHref = "/signup",
  signedIn,
  signedInHref = "/account",
}: Props) {
  const session = await getSession();
  const user = session?.user;
  return (
    <Link href={user ? signedInHref : signedOutHref} className={className}>
      {user ? signedIn : signedOut}
    </Link>
  );
}

/**
 * ログイン状態が確定するまでの表示。
 *
 * 未ログイン時の中身をそのまま出すと、ログイン済みの人に一瞬「会員登録」が見えてしまい、
 * 今回消したい紛らわしさが残る。**中身は未ログイン時のものを描いたうえで文字を透明にし、
 * 寸法だけ確保する**（空にするとボタンが潰れてレイアウトがずれる）。
 */
function Placeholder({ className, signedOut }: Props) {
  return (
    <span
      className={`${className} pointer-events-none text-transparent select-none`}
      aria-hidden
    >
      {signedOut}
    </span>
  );
}
