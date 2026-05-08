// /admin/users/[id] — 個別ユーザー詳細 + フレンドコード発行
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { friendCodes, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { IssueFriendCodeForm } from "./IssueFriendCodeForm";

export const metadata = { title: "ユーザー詳細" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/login?callbackUrl=/admin/users");

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) notFound();

  const codes = await db
    .select({
      id: friendCodes.id,
      code: friendCodes.code,
      durationDays: friendCodes.durationDays,
      expiresAt: friendCodes.expiresAt,
      activatedAt: friendCodes.activatedAt,
      revokedAt: friendCodes.revokedAt,
      status: friendCodes.status,
      note: friendCodes.note,
      createdAt: friendCodes.createdAt,
    })
    .from(friendCodes)
    .where(eq(friendCodes.issuedToUserId, id))
    .orderBy(desc(friendCodes.createdAt))
    .limit(20);

  const friendActive =
    user.tier === "friend" &&
    user.friendExpiresAt &&
    new Date(user.friendExpiresAt) > new Date();

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <Link
            href="/admin/users"
            className="text-xs text-zinc-500 hover:underline"
          >
            ← 一覧に戻る
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">
            {user.email}
          </h1>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-medium text-zinc-500">基本情報</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-zinc-500">ID</dt>
            <dd className="text-zinc-900">{user.id}</dd>
            <dt className="text-zinc-500">Tier</dt>
            <dd className="text-zinc-900">{user.tier}</dd>
            <dt className="text-zinc-500">Pro Status</dt>
            <dd className="text-zinc-900">{user.proStatus ?? "—"}</dd>
            <dt className="text-zinc-500">Pro Source</dt>
            <dd className="text-zinc-900">{user.proSource ?? "—"}</dd>
            <dt className="text-zinc-500">現在の Friend Code</dt>
            <dd className="font-mono text-zinc-900">
              {user.friendCode ?? "—"}
            </dd>
            <dt className="text-zinc-500">Friend 期限</dt>
            <dd className="text-zinc-900">
              {user.friendExpiresAt
                ? new Date(user.friendExpiresAt).toLocaleString()
                : "—"}
            </dd>
            <dt className="text-zinc-500">メール認証</dt>
            <dd
              className={
                user.emailVerifiedAt ? "text-emerald-700" : "text-amber-700"
              }
            >
              {user.emailVerifiedAt
                ? new Date(user.emailVerifiedAt).toLocaleString()
                : "未認証"}
            </dd>
            <dt className="text-zinc-500">登録日</dt>
            <dd className="text-zinc-900">
              {new Date(user.createdAt).toLocaleString()}
            </dd>
          </dl>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-medium text-zinc-500">
            フレンドコードを発行
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            既にアクティブな Friend コードがあっても、新しく発行すると上書きされます。
            {friendActive ? (
              <>
                <br />
                <span className="text-amber-700">
                  現在 friend tier (有効期限内) のユーザーです。
                </span>
              </>
            ) : null}
          </p>
          <div className="mt-4">
            <IssueFriendCodeForm targetUserId={user.id} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-medium text-zinc-500">
            発行履歴 (最新 20 件)
          </h2>
          {codes.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">発行履歴はありません。</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {codes.map((c) => (
                <li key={c.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-700">
                      {c.code}
                    </span>
                    <span
                      className={
                        c.status === "active"
                          ? "text-emerald-700 text-xs"
                          : c.status === "expired"
                            ? "text-zinc-500 text-xs"
                            : "text-red-700 text-xs"
                      }
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    発行: {new Date(c.createdAt).toLocaleString()} / 期限:{" "}
                    {new Date(c.expiresAt).toLocaleString()}
                    {c.activatedAt
                      ? ` / 適用: ${new Date(c.activatedAt).toLocaleString()}`
                      : ""}
                    {c.note ? ` / ${c.note}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
