// /admin/users — ユーザー一覧 (admin only)
// middleware (proxy.ts) で /admin/* は admin でないとリダイレクトされるが、
// page でも防御的に requireAdmin() で再チェック。
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
    <main className="flex flex-1 flex-col bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-bold text-zinc-900">ユーザー管理</h1>

        <form className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="メールアドレスで検索"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            検索
          </button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Friend Code</th>
                <th className="px-4 py-3">期限</th>
                <th className="px-4 py-3">認証</th>
                <th className="px-4 py-3">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-500" colSpan={7}>
                    該当ユーザーがいません。
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-700">{u.id}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {u.email}
                      </Link>
                      {u.isAdmin ? (
                        <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700">
                          admin
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{u.tier}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {u.friendCode ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      {u.friendExpiresAt
                        ? new Date(u.friendExpiresAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.emailVerifiedAt ? (
                        <span className="text-emerald-700">済</span>
                      ) : (
                        <span className="text-amber-700">未</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
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
