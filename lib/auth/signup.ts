// signup の中核ロジック。Server Action と REST API の両方から呼ぶ。
//
// 戻り値は redirect しない (呼び元の Server Action / route.ts が判断する)。
// 既存メールへの再 signup は静かに verification token だけ再発行する (列挙攻撃対策)。

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type SignupResult =
  | { ok: true; status: "created" | "already_verified" | "resent" }
  | { ok: false; error: SignupErrorCode; message: string };

export type SignupErrorCode =
  | "invalid_email"
  | "weak_password"
  | "password_mismatch"
  | "internal_error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function signup(input: {
  email: string;
  password: string;
  passwordConfirm?: string;
}): Promise<SignupResult> {
  const email = input.email.toLowerCase().trim();
  const password = input.password;
  const confirm = input.passwordConfirm;

  if (!EMAIL_RE.test(email)) {
    return {
      ok: false,
      error: "invalid_email",
      message: "メールアドレスの形式が正しくありません。",
    };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: "weak_password",
      message: `パスワードは ${MIN_PASSWORD_LENGTH} 文字以上にしてください。`,
    };
  }
  if (typeof confirm === "string" && password !== confirm) {
    return {
      ok: false,
      error: "password_mismatch",
      message: "パスワード (確認) が一致しません。",
    };
  }

  const existing = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let resultStatus: "created" | "already_verified" | "resent";
  if (existing.length > 0) {
    if (existing[0].emailVerifiedAt) {
      // 既に認証済 → 何も書かず "already_verified" を返す。
      // UI 側でも「メールを送信しました」を出す (列挙対策)。
      return { ok: true, status: "already_verified" };
    }
    resultStatus = "resent";
  } else {
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({ email, passwordHash, tier: "free" });
    resultStatus = "created";
  }

  // verification token を再発行 (古い未使用トークンは捨てる)
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  const token = newToken();
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  await db.insert(verificationTokens).values({ identifier: email, token, expires });

  // メール送信失敗はログのみ。signup 自体は成功扱い。
  const sent = await sendVerificationEmail({ email }, token);
  if (!sent.ok) {
    console.error("[signup] verification email failed", { email, error: sent.error });
  }

  return { ok: true, status: resultStatus };
}
