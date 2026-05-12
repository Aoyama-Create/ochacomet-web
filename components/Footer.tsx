import Link from "next/link";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>© {YEAR} OchaComet</p>
        <nav className="flex gap-4">
          <Link href="/" className="hover:text-primary">
            ホーム
          </Link>
          <Link href="/login" className="hover:text-primary">
            ログイン
          </Link>
          <a
            href="mailto:support@ochacomet.aoyamacreate.com"
            className="hover:text-primary"
          >
            お問い合わせ
          </a>
        </nav>
      </div>
    </footer>
  );
}
