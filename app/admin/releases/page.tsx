// /admin/releases — リリース一覧
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { releases } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { BackLink } from "@/components/ui/BackLink";
import { Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

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
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <BackLink href="/admin/users">ユーザー管理に戻る</BackLink>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">
              リリース管理
            </h1>
          </div>
          <Link
            href="/admin/releases/new"
            className={buttonClass()}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            新規アップロード
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-canvas">
              <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">SHA-256</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-ink-soft"
                    colSpan={5}
                  >
                    まだリリースがありません。
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.version} className="hover:bg-canvas/60">
                    <td className="px-4 py-3 font-extrabold text-ink">
                      v{r.version}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-[10px] text-ink-soft"
                      title={r.sha256}
                    >
                      {r.sha256.slice(0, 16)}…
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {(r.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {new Date(r.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.releaseNotesUrl ? (
                        <a
                          href={r.releaseNotesUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-extrabold text-primary hover:text-primary-hover"
                        >
                          link
                        </a>
                      ) : (
                        <span className="text-ink-soft">—</span>
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
