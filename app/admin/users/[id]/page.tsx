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
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/admin/users"
          className="text-xs text-ink-soft hover:text-primary"
        >
          ← 一覧に戻る
        </Link>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">
          {user.email}
        </h1>

        {/* 基本情報 */}
        <section className="mt-6 rounded-2xl border border-line bg-surface p-8">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-soft">
            基本情報
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row label="ID" value={user.id} />
            <Row label="Tier" value={user.tier} />
            <Row label="Pro Status" value={user.proStatus ?? "—"} />
            <Row label="Pro Source" value={user.proSource ?? "—"} />
            <Row
              label="現在の Friend Code"
              value={
                user.friendCode ? (
                  <span className="font-mono text-xs">{user.friendCode}</span>
                ) : (
                  "—"
                )
              }
            />
            <Row
              label="Friend 期限"
              value={
                user.friendExpiresAt
                  ? new Date(user.friendExpiresAt).toLocaleString()
                  : "—"
              }
            />
            <Row
              label="メール認証"
              value={
                user.emailVerifiedAt ? (
                  <span className="text-primary">完了</span>
                ) : (
                  <span className="text-amber-700">未完了</span>
                )
              }
            />
            <Row
              label="登録日"
              value={new Date(user.createdAt).toLocaleString()}
            />
          </dl>
        </section>

        {/* フレンドコード発行 */}
        <section className="mt-6 rounded-2xl border border-line bg-surface p-8">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-soft">
            フレンドコードを発行
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            既にアクティブな Friend コードがあっても、新しく発行すると上書きされます。
            {friendActive ? (
              <>
                <br />
                <span className="font-extrabold text-amber-700">
                  現在 friend tier (有効期限内) のユーザーです。
                </span>
              </>
            ) : null}
          </p>
          <div className="mt-4">
            <IssueFriendCodeForm targetUserId={user.id} />
          </div>
        </section>

        {/* 発行履歴 */}
        <section className="mt-6 rounded-2xl border border-line bg-surface p-8">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-soft">
            発行履歴 (最新 20 件)
          </h2>
          {codes.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">発行履歴はありません。</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {codes.map((c) => (
                <li key={c.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink">
                      {c.code}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-1 text-xs text-ink-soft">
                    発行: {new Date(c.createdAt).toLocaleString()} ·{" "}
                    期限: {new Date(c.expiresAt).toLocaleString()}
                    {c.activatedAt ? (
                      <>
                        {" "}
                        · 適用: {new Date(c.activatedAt).toLocaleString()}
                      </>
                    ) : null}
                    {c.note ? <> · {c.note}</> : null}
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

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 py-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-mono text-xs text-ink">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: "bg-primary-soft text-primary-deep",
    expired: "bg-zinc-100 text-zinc-700",
    revoked: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
        classes[status] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {status}
    </span>
  );
}
