// verification token の消費ロジック。Server Component と REST API から共通で呼ぶ。
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/db/schema";

export type VerifyEmailResult =
  | { ok: true; email: string }
  | { ok: false; reason: "missing" | "invalid_or_expired" | "user_missing" };

export async function consumeVerificationToken(
  token: string,
): Promise<VerifyEmailResult> {
  if (!token) return { ok: false, reason: "missing" };

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

  await db
    .update(users)
    .set({ emailVerifiedAt: now, updatedAt: now })
    .where(eq(users.id, user.id));
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.token, token));

  return { ok: true, email };
}
