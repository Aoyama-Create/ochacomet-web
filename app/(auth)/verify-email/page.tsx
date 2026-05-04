// /verify-email?token=XXX
// クエリのトークンを検証して users.email_verified_at を立てる。サーバーコンポーネント。
import Link from "next/link";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/db/schema";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

type VerifyOutcome =
  | { ok: true; email: string }
  | { ok: false; reason: "missing" | "invalid_or_expired" | "user_missing" };

async function consumeToken(token: string): Promise<VerifyOutcome> {
  const now = new Date();

  const [tok] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, now),
      ),
    )
    .limit(1);
  if (!tok) return { ok: false, reason: "invalid_or_expired" };

  const email = tok.identifier;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return { ok: false, reason: "user_missing" };

  // 認証完了 + token 削除
  await db
    .update(users)
    .set({ emailVerifiedAt: now, updatedAt: now })
    .where(eq(users.id, user.id));
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.token, token));

  return { ok: true, email };
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const outcome: VerifyOutcome = token
    ? await consumeToken(token)
    : { ok: false, reason: "missing" };

  if (outcome.ok) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 p-8">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold text-zinc-900">メール認証が完了しました</h1>
          <p className="mt-4 text-sm text-zinc-700">
            <span className="font-medium">{outcome.email}</span> を認証済としました。
          </p>
          <Link
            href="/login?verified=1"
            className="mt-6 inline-block rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            ログインへ
          </Link>
        </div>
      </main>
    );
  }

  const message =
    outcome.reason === "missing"
      ? "認証トークンが見つかりません。メール内のリンクを開き直してください。"
      : outcome.reason === "user_missing"
        ? "このアカウントは存在しません。"
        : "認証リンクの有効期限が切れているか、無効です。再度サインアップしてください。";

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-bold text-zinc-900">メール認証に失敗しました</h1>
        <p className="mt-4 text-sm text-red-600">{message}</p>
        <Link
          href="/signup"
          className="mt-6 inline-block text-sm font-medium text-zinc-900 underline"
        >
          サインアップに戻る
        </Link>
      </div>
    </main>
  );
}
