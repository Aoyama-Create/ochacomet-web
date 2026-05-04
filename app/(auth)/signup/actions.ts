"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export type SignupFormState = {
  ok: boolean;
  error?: string;
};

export async function signupAction(
  _prev: SignupFormState | undefined,
  formData: FormData,
): Promise<SignupFormState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!isValidEmail(email)) {
    return { ok: false, error: "メールアドレスの形式が正しくありません。" };
  }
  if (password.length < 8) {
    return { ok: false, error: "パスワードは 8 文字以上にしてください。" };
  }
  if (password !== passwordConfirm) {
    return { ok: false, error: "パスワード (確認) が一致しません。" };
  }

  // 同一メールアドレスの登録は静かに「メール送信した」と返す (列挙攻撃対策)
  const existing = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: number;
  if (existing.length > 0) {
    userId = existing[0].id;
    // 既に認証済なら何もせず /verify-email/sent へ誘導
    if (existing[0].emailVerifiedAt) {
      redirect("/verify-email/sent");
    }
  } else {
    const passwordHash = await hashPassword(password);
    const [inserted] = await db
      .insert(users)
      .values({ email, passwordHash, tier: "free" })
      .returning({ id: users.id });
    userId = inserted.id;
  }

  // 古い未使用トークンを掃除して新規発行
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  const token = newToken();
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  // void: メール送信失敗してもユーザー作成自体は成功させる (ログには残す)
  const result = await sendVerificationEmail({ email }, token);
  if (!result.ok) {
    console.error("[signup] verification email failed", {
      userId,
      error: result.error,
    });
  }

  redirect("/verify-email/sent");
}
