// ヘッダーのうち、ログイン状態で出し分ける部分だけ。
//
// `auth()` は Cookie を読むため、これを含むツリーは動的になる。Header 本体から
// 切り離して Suspense に包むことで、**ページの静的シェルは CDN から即座に返し、
// この部分だけ後からストリーミングする**（Cache Components / PPR）。
import Link from "next/link";
import { getSession } from "@/lib/session";

const NAV = "flex items-center gap-1 text-sm";
const LINK =
  "rounded-md px-3 py-1.5 text-ink-soft hover:bg-primary-soft hover:text-primary";
const CTA =
  "rounded-full bg-primary px-4 py-1.5 font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] transition-colors hover:bg-primary-hover";

export async function HeaderAuth() {
  const session = await getSession();
  const user = session?.user;

  return (
    <nav className={NAV}>
      {user ? (
        <>
          <Link href="/account" className={LINK}>
            マイページ
          </Link>
          {user.isAdmin ? (
            <Link
              href="/admin/users"
              className="rounded-md px-3 py-1.5 text-violet-700 hover:bg-violet-50"
            >
              Admin
            </Link>
          ) : null}
        </>
      ) : (
        <>
          <Link href="/login" className={LINK}>
            ログイン
          </Link>
          <Link href="/signup" className={CTA}>
            会員登録
          </Link>
        </>
      )}
    </nav>
  );
}

/**
 * ログイン状態が確定するまでの表示。
 *
 * 未ログイン UI をそのまま出すと、ログイン済みのユーザーに一瞬
 * 「ログイン / 会員登録」が見えてしまうので、中身の無いプレースホルダにする。
 *
 * ヘッダーは sticky で高さ h-14 固定。差し替わった瞬間にガタつかないよう、
 * 実物のボタンと同じ寸法（px/py とテキスト量）を確保しておく。
 */
export function HeaderAuthFallback() {
  return (
    <nav className={NAV} aria-hidden>
      <span className="rounded-md px-3 py-1.5 text-transparent select-none">
        ログイン
      </span>
      <span className="rounded-full bg-line/60 px-4 py-1.5 font-extrabold text-transparent select-none">
        会員登録
      </span>
    </nav>
  );
}
