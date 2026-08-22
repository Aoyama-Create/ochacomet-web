import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/session";

const YEAR = new Date().getFullYear();

const FOOTER_LINK = "hover:text-primary";

/**
 * フッターのログイン導線。
 *
 * ログイン済みの人に「ログイン / 会員登録」を出し続けるのは紛らわしいので、
 * マイページ 1 本に畳む。
 *
 * Footer は root layout に置かれているため、**ここで直接 getSession() を呼ぶと
 * 全ページが動的になる**（公開ページの静的配信が壊れる）。必ず Suspense で包む。
 */
function FooterAuthLinks() {
  return (
    <Suspense fallback={<FooterAuthFallback />}>
      <FooterAuthResolved />
    </Suspense>
  );
}

async function FooterAuthResolved() {
  const session = await getSession();
  if (session?.user) {
    return (
      <li>
        <Link href="/account" className={FOOTER_LINK}>
          マイページ
        </Link>
      </li>
    );
  }
  return (
    <>
      <li>
        <Link href="/login" className={FOOTER_LINK}>
          ログイン
        </Link>
      </li>
      <li>
        <Link href="/signup" className={FOOTER_LINK}>
          会員登録
        </Link>
      </li>
    </>
  );
}

/** 未ログイン時と同じ行数・文字数を透明で確保し、確定時に行がずれないようにする。 */
function FooterAuthFallback() {
  return (
    <>
      <li aria-hidden className="text-transparent select-none">
        ログイン
      </li>
      <li aria-hidden className="text-transparent select-none">
        会員登録
      </li>
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 text-xs text-ink-soft">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-extrabold text-ink">OchaComet</p>
            <p className="mt-2 leading-relaxed">
              17LIVEを効率化する配信サポートアプリ。
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
              <FooterAuthLinks />
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
              {/*
                外部の Google フォームへ。
                ★ 法務ページ（利用規約・プライバシー・特商法・返金ポリシー）の
                  mailto は変えないこと。特商法は連絡手段の表示義務、
                  プライバシーは開示請求の窓口、返金は申請手順の一部で、
                  フォームに置き換えると法定表示として弱くなる。
              */}
              <li>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScoBqE5Xe0j2skILcqeDnlNzXLWOyZPbKyWftEs13qfskRQiQ/viewform"
                  target="_blank"
                  rel="noreferrer"
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
