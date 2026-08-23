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
  | "missing_name"
  | "internal_error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 80;

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function signup(input: {
  email: string;
  password: string;
  passwordConfirm?: string;
  displayName: string;
  /** 新機能・キャンペーンのお知らせを受け取ることへの同意。既定 false (オプトイン)。 */
  optinMarketing?: boolean;
}): Promise<SignupResult> {
  const email = input.email.toLowerCase().trim();
  const password = input.password;
  const confirm = input.passwordConfirm;
  const displayName = (input.displayName ?? "").trim().slice(0, MAX_NAME_LENGTH);
  const optinMarketing = input.optinMarketing === true;

  if (!displayName) {
    return {
      ok: false,
      error: "missing_name",
      message: "お名前を入力してください。",
    };
  }
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
  // ログに email を出さないために id を持ち回る (末尾の console.error 参照)。
  let userId: number;
  if (existing.length > 0) {
    if (existing[0].emailVerifiedAt) {
      // 既に認証済 → 何も書かず "already_verified" を返す。
      // UI 側でも「メールを送信しました」を出す (列挙対策)。
      return { ok: true, status: "already_verified" };
    }
    // 未認証のスタブが残っているケース: displayName を最新値で上書き。
    // emailOptinMarketing は触らない。既に本人が意思表示している値を、
    // 再 signup フォームの状態で上書きしてしまわないため。
    await db
      .update(users)
      .set({ displayName, updatedAt: new Date() })
      .where(eq(users.id, existing[0].id));
    userId = existing[0].id;
    resultStatus = "resent";
  } else {
    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        displayName,
        tier: "free",
        emailOptinMarketing: optinMarketing,
      })
      .returning({ id: users.id });
    userId = created.id;
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
  // ログに email は出さない (userId で追跡できる)。
  const sent = await sendVerificationEmail({ email }, token);
  if (!sent.ok) {
    console.error("[signup] verification email failed", { userId, error: sent.error });
  }

  return { ok: true, status: resultStatus };
}
