// /admin/users — ユーザー一覧 (admin only)
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const metadata = { title: "ユーザー管理" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/login?callbackUrl=/admin/users");

  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const baseSelect = {
    id: users.id,
    email: users.email,
    tier: users.tier,
    friendCode: users.friendCode,
    friendExpiresAt: users.friendExpiresAt,
    isAdmin: users.isAdmin,
    emailVerifiedAt: users.emailVerifiedAt,
    createdAt: users.createdAt,
  };
  const rows = query
    ? await db
        .select(baseSelect)
        .from(users)
        .where(ilike(users.email, `%${query}%`))
        .orderBy(desc(users.createdAt))
        .limit(50)
    : await db
        .select(baseSelect)
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(50);

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-ink">
            ユーザー管理
          </h1>
          <Link
            href="/admin/releases"
            className="text-xs font-extrabold text-ink-soft hover:text-primary"
          >
            リリース管理 →
          </Link>
        </div>

        <form className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="メールアドレスで検索"
            className="flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white hover:bg-primary-hover"
          >
            検索
          </button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-canvas">
              <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Friend Code</th>
                <th className="px-4 py-3">期限</th>
                <th className="px-4 py-3">認証</th>
                <th className="px-4 py-3">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-ink-soft"
                    colSpan={7}
                  >
                    該当ユーザーがいません。
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="hover:bg-canvas/60">
                    <td className="px-4 py-3 text-ink-soft">{u.id}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-extrabold text-ink hover:text-primary"
                      >
                        {u.email}
                      </Link>
                      {u.isAdmin ? (
                        <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-700">
                          admin
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      <TierBadge tier={u.tier} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-soft">
                      {u.friendCode ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {u.friendExpiresAt
                        ? new Date(u.friendExpiresAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.emailVerifiedAt ? (
                        <span className="font-extrabold text-primary">済</span>
                      ) : (
                        <span className="font-extrabold text-amber-700">未</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {new Date(u.createdAt).toLocaleDateString()}
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

function TierBadge({ tier }: { tier: string }) {
  const classes: Record<string, string> = {
    free: "bg-zinc-100 text-zinc-700",
    pro: "bg-primary-soft text-primary-deep",
    friend: "bg-amber-100 text-amber-800",
    banned: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
        classes[tier] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {tier}
    </span>
  );
}
