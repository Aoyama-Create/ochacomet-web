// POST /api/admin/2fa/request
// ログイン済み管理者に対し、メール OTP (6桁) を生成して登録メールに送信する。
// チェックリスト §1b。
//
// 200: { ok: true }
// 401/403: { ok: false, reason }
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { sendAdminOtpEmail } from "@/lib/email";
import { generateOtpCode, hashOtp, otpExpiryFromNow } from "@/lib/adminOtp";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated" },
      { status: 401 },
    );
  }
  if (!session.user.isAdmin || !session.user.email) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const code = generateOtpCode();
  const userId = Number(session.user.id);

  await db
    .update(users)
    .set({
      adminOtpHash: hashOtp(code),
      adminOtpExpires: otpExpiryFromNow(),
      adminOtpAttempts: 0,
    })
    .where(eq(users.id, userId));

  const res = await sendAdminOtpEmail({ email: session.user.email }, code);
  if (!res.ok) {
    // dev では BREVO 未設定でも console fallback で ok。ここに来たら実障害。
    console.error("[admin 2fa] failed to send OTP email", res.error);
    return NextResponse.json(
      { ok: false, reason: "email_failed" },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
