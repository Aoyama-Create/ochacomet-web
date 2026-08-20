// /account/download — 会員向けダウンロードページ
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLatestDesktop, listDesktopArchive } from "@/lib/desktop";

export const metadata = { title: "ダウンロード" };

export default async function DownloadPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/download");
  if (!session.user.emailVerifiedAt) redirect("/verify-email/sent");

  const desktop = await getLatestDesktop();
  // 現行版はフィードが真実。過去版だけ Blob の中身から拾う。
  const desktopPast = desktop ? await listDesktopArchive(desktop.version) : [];

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/account"
          className="text-xs text-ink-soft hover:text-primary"
        >
          ← マイページに戻る
        </Link>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">
          OchaComet のダウンロード
        </h1>

        {/* デスクトップアプリ（推奨） */}
        {desktop ? (
          <section className="mt-8 rounded-2xl border-2 border-primary/30 bg-surface p-8">
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                デスクトップアプリ
              </p>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-extrabold text-primary">
                おすすめ
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-ink">
              v{desktop.version}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              配信画面と設定を1つのウィンドウにまとめたアプリです。インストールして
              開くだけで使えます。更新も自動で届きます。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {desktop.installers.map((ins) => (
                <a
                  key={ins.url}
                  href={ins.url}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] hover:bg-primary-hover"
                >
                  <DownloadIcon />
                  {ins.platform} 版
                  <span className="font-bold opacity-75">
                    {(ins.sizeBytes / 1024 / 1024).toFixed(0)} MB
                  </span>
                </a>
              ))}
              {desktop.installers.every((i) => i.platform !== "Windows") ? (
                <span className="text-xs text-ink-soft">
                  Windows 版は準備中です
                </span>
              ) : null}
            </div>

            {desktopPast.length > 0 ? (
              <details className="mt-6 border-t border-line pt-4">
                <summary className="cursor-pointer text-sm font-extrabold text-ink-soft hover:text-primary">
                  過去バージョン（{desktopPast.length}）
                </summary>
                <p className="mt-2 text-xs text-ink-soft">
                  最新版で問題が出たときの切り戻し用です。通常は上の v
                  {desktop.version} をお使いください。
                </p>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {desktopPast.map((r) => (
                    <li
                      key={r.version}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <span className="text-ink">
                        v{r.version}
                        <span className="ml-2 text-xs text-ink-soft">
                          ({new Date(r.releasedAt).toLocaleDateString()})
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-4">
                        {r.installers.map((ins) => (
                          <a
                            key={ins.url}
                            href={ins.url}
                            className="text-xs font-extrabold text-primary hover:text-primary-hover"
                          >
                            {ins.platform} →
                          </a>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        ) : (
          // 拡張版セクションを消したので、ここが唯一の内容になった。
          // desktop が取れないときに何も出ないと故障に見えるため、必ず何か出す。
          <section className="mt-8 rounded-2xl border border-line bg-surface p-8">
            <p className="text-sm text-ink-soft">
              まだリリースが公開されていません。準備中です。
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
