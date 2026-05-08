// /admin/releases — リリース一覧
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { releases } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const metadata = { title: "リリース管理" };

export default async function AdminReleasesPage() {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/login?callbackUrl=/admin/releases");

  const rows = await db
    .select({
      version: releases.version,
      sha256: releases.sha256,
      sizeBytes: releases.sizeBytes,
      releaseNotesUrl: releases.releaseNotesUrl,
      uploadedAt: releases.uploadedAt,
      uploadedBy: releases.uploadedBy,
    })
    .from(releases)
    .orderBy(desc(releases.uploadedAt))
    .limit(50);

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">リリース管理</h1>
          <Link
            href="/admin/releases/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            + 新規アップロード
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">SHA-256</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>
                    まだリリースがありません。
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.version}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      v{r.version}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-[10px] text-zinc-500"
                      title={r.sha256}
                    >
                      {r.sha256.slice(0, 16)}…
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {(r.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(r.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-700">
                      {r.releaseNotesUrl ? (
                        <a
                          href={r.releaseNotesUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
