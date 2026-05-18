import Link from "next/link";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 text-xs text-ink-soft">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-extrabold text-ink">OchaComet</p>
            <p className="mt-2 leading-relaxed">
              17LIVE 配信を支えるガーディアン向け Chrome 拡張。
            </p>
            <p className="mt-3 text-[11px]">© {YEAR} OchaComet</p>
          </div>

          <nav aria-label="Product">
            <p className="mb-2 font-bold text-ink">Product</p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="hover:text-primary">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary">
                  料金
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary">
                  ログイン
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-primary">
                  会員登録
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <p className="mb-2 font-bold text-ink">Legal</p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/terms" className="hover:text-primary">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-primary">
                  返金ポリシー
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-primary">
                  特定商取引法に基づく表記
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Support">
            <p className="mb-2 font-bold text-ink">Support</p>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="mailto:support@ochacomet.aoyamacreate.com"
                  className="hover:text-primary"
                >
                  お問い合わせ
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
