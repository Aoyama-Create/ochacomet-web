// /account/download — 会員向けダウンロードページ
// 認証は middleware で防御されているので、page では session を取りに行く程度。
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases } from "@/db/schema";

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

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <Link
            href="/account"
            className="text-xs text-zinc-500 hover:underline"
          >
            ← マイページに戻る
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">
            OchaComet のダウンロード
          </h1>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          {latest ? (
            <>
              <h2 className="text-sm font-medium text-zinc-500">最新版</h2>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="text-xl font-bold text-zinc-900">
                  v{latest.version}
                </p>
                <p className="text-xs text-zinc-500">
                  公開日:{" "}
                  {new Date(latest.uploadedAt).toLocaleDateString()} /{" "}
                  サイズ: {(latest.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <a
                href={`/api/download/ochacomet-v${latest.version}`}
                className="mt-4 inline-block rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                ダウンロード
              </a>
              {latest.releaseNotesUrl ? (
                <a
                  href={latest.releaseNotesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-3 text-sm text-zinc-700 underline"
                >
                  リリースノート
                </a>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              まだリリースが公開されていません。準備中です。
            </p>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-medium text-zinc-500">
            インストール手順
          </h2>
          <ol className="mt-3 list-decimal pl-5 text-sm text-zinc-700 space-y-1">
            <li>ZIP を解凍する</li>
            <li>
              Chrome で <code>chrome://extensions</code> を開く
            </li>
            <li>右上のデベロッパーモードを ON</li>
            <li>
              「パッケージ化されていない拡張機能を読み込む」→ 解凍したフォルダを選択
            </li>
            <li>拡張アイコンが表示されたら、Pro タブにフレンドコードを入力</li>
          </ol>
        </section>

        {past.length > 0 ? (
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium text-zinc-500">過去バージョン</h2>
            <ul className="mt-3 divide-y divide-zinc-100 text-sm">
              {past.map((r) => (
                <li
                  key={r.version}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-zinc-700">
                    v{r.version}
                    <span className="ml-2 text-xs text-zinc-500">
                      ({new Date(r.uploadedAt).toLocaleDateString()})
                    </span>
                  </span>
                  <a
                    href={`/api/download/ochacomet-v${r.version}`}
                    className="text-xs text-zinc-700 underline hover:text-zinc-900"
                  >
                    ダウンロード
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
