// 共通ヘッダー。ログイン状態で出し分け (Server Component で auth() を呼ぶ)。
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-extrabold text-ink"
        >
          <Image
            src="/ochacomet-icon.png"
            width={28}
            height={28}
            alt=""
            aria-hidden
            className="h-7 w-7 rounded-md"
            unoptimized
          />
          OchaComet
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Link
                href="/account"
                className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-primary-soft hover:text-primary"
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
                className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-primary-soft hover:text-primary"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-primary px-4 py-1.5 font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] transition-colors hover:bg-primary-hover"
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
