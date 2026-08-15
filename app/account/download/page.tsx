// /account/download — 会員向けダウンロードページ
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases } from "@/db/schema";
import { getLatestDesktop, listDesktopArchive } from "@/lib/desktop";

export const metadata = { title: "ダウンロード" };

export default async function DownloadPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/download");
  if (!session.user.emailVerifiedAt) redirect("/verify-email/sent");

  const all = await db
    .select({
      version: releases.version,
      releaseNotesUrl: releases.releaseNotesUrl,
      sizeBytes: releases.sizeBytes,
      uploadedAt: releases.uploadedAt,
    })
    .from(releases)
    .orderBy(desc(releases.uploadedAt))
    .limit(10);

  const latest = all[0] ?? null;
  const past = all.slice(1);
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
              配信画面と設定を1つのウィンドウにまとめたアプリ版です。Chrome
              拡張の読み込み作業が不要で、更新も自動で届きます。
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

            {/* 未署名なので OS が警告を出す。ここを書いておかないと詰まる。 */}
            <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              <p className="font-extrabold">⚠ 初回起動時に OS の警告が出ます</p>
              <p className="mt-1.5">
                <b>macOS 15 以降</b>:
                一度開こうとして拒否されたあと、システム設定 →
                プライバシーとセキュリティ →
                下の方にある「このまま開く」を押します。
              </p>
              <p className="mt-1">
                <b>macOS 14 以前</b>: アプリを右クリック →「開く」→
                ダイアログの「開く」。
              </p>
              <p className="mt-1">
                <b>Windows</b>:
                「WindowsによってPCが保護されました」→「詳細情報」→「実行」。
              </p>
              <p className="mt-1.5 opacity-80">
                開発元の署名を付けていないためで、2回目以降は出ません。
              </p>
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
        ) : null}

        {/* Chrome 拡張版（ダウンロード・手順・過去版を 1 つにまとめる） */}
        <section className="mt-6 rounded-2xl border border-line bg-surface p-8">
          <p className="text-xs font-extrabold uppercase tracking-wider text-ink-soft">
            Chrome 拡張版
          </p>

          {latest ? (
            <>
              <div className="mt-3 flex items-baseline gap-3">
                <h2 className="text-3xl font-black text-ink">
                  v{latest.version}
                </h2>
                <p className="text-xs text-ink-soft">
                  公開: {new Date(latest.uploadedAt).toLocaleDateString()} ·{" "}
                  {(latest.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={`/api/download/ochacomet-v${latest.version}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] hover:bg-primary-hover"
                >
                  <DownloadIcon />
                  ダウンロード
                </a>
                {latest.releaseNotesUrl ? (
                  <a
                    href={latest.releaseNotesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-extrabold text-ink-soft hover:text-primary"
                  >
                    リリースノート →
                  </a>
                ) : null}
              </div>

              {/* 手順はダウンロードボタンの直下に置く。別カードに離すと見落とされる。 */}
              <h3 className="mt-8 text-sm font-extrabold text-ink">
                インストール手順
              </h3>
              <ol className="mt-3 space-y-3 text-sm text-ink">
                <Step n={1}>ZIP を解凍する</Step>
                <Step n={2}>
                  Chrome で{" "}
                  <code className="rounded bg-canvas px-1.5 py-0.5 text-[12px]">
                    chrome://extensions
                  </code>{" "}
                  を開く
                </Step>
                <Step n={3}>右上の「デベロッパーモード」を ON</Step>
                <Step n={4}>
                  「パッケージ化されていない拡張機能を読み込む」→
                  解凍したフォルダを選択
                </Step>
                <Step n={5}>
                  拡張アイコンが表示されたら、「分析」タブにフレンドコードまたはライセンスキーを入力
                </Step>
              </ol>
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
                ⚠ 解凍フォルダを移動すると拡張 ID
                が変わるため、読み込んだ後はフォルダを移動しないでください。
              </p>

              {past.length > 0 ? (
                <details className="mt-6 border-t border-line pt-4">
                  <summary className="cursor-pointer text-sm font-extrabold text-ink-soft hover:text-primary">
                    過去バージョン（{past.length}）
                  </summary>
                  <ul className="mt-3 divide-y divide-line text-sm">
                    {past.map((r) => (
                      <li
                        key={r.version}
                        className="flex items-center justify-between py-3"
                      >
                        <span className="text-ink">
                          v{r.version}
                          <span className="ml-2 text-xs text-ink-soft">
                            ({new Date(r.uploadedAt).toLocaleDateString()})
                          </span>
                        </span>
                        <a
                          href={`/api/download/ochacomet-v${r.version}`}
                          className="text-xs font-extrabold text-primary hover:text-primary-hover"
                        >
                          ダウンロード →
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              まだリリースが公開されていません。準備中です。
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-extrabold text-primary"
      >
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
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
