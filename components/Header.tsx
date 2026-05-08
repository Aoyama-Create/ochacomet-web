// 共通ヘッダー。ログイン状態で出し分け (Server Component で auth() を呼ぶ)。
import Link from "next/link";
import { auth } from "@/auth";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-bold text-zinc-900"
        >
          <span aria-hidden className="text-xl">☕</span>
          OchaComet
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Link
                href="/account"
                className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
              >
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
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-800"
              >
                会員登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
