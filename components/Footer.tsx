import Link from "next/link";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-8 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {YEAR} OchaComet</p>
        <nav className="flex gap-4">
          <Link href="/" className="hover:text-zinc-900">
            ホーム
          </Link>
          <Link href="/login" className="hover:text-zinc-900">
            ログイン
          </Link>
          <a
            href="mailto:support@ochacomet.aoyamacreate.com"
            className="hover:text-zinc-900"
          >
            お問い合わせ
          </a>
        </nav>
      </div>
    </footer>
  );
}
