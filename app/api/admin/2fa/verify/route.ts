// POST /api/admin/2fa/verify   body: { code: string }
// メール OTP を照合し、成功したら admin_2fa クッキー (署名済み JWT, 12h) を発行する。
// チェックリスト §1b。
//
// 200: { ok: true }  (Set-Cookie: admin_2fa)
// 400/401/403/429: { ok: false, reason }
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { OTP_MAX_ATTEMPTS, verifyOtpHash } from "@/lib/adminOtp";
import {
  ADMIN_2FA_COOKIE,
  ADMIN_2FA_COOKIE_MAX_AGE,
  signAdmin2faToken,
} from "@/lib/admin2faCookie";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated" },
      { status: 401 },
    );
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  let body: { code?: unknown } = {};
  try {
    body = (await req.json()) as { code?: unknown };
  } catch {
    /* empty */
  }
  const code = String(body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, reason: "bad_code" }, { status: 400 });
  }

  const userId = Number(session.user.id);
  const [row] = await db
    .select({
      adminOtpHash: users.adminOtpHash,
      adminOtpExpires: users.adminOtpExpires,
      adminOtpAttempts: users.adminOtpAttempts,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row?.adminOtpHash || !row.adminOtpExpires) {
    return NextResponse.json({ ok: false, reason: "no_otp" }, { status: 400 });
  }
  if (row.adminOtpExpires <= new Date()) {
    return NextResponse.json({ ok: false, reason: "expired" }, { status: 400 });
  }
  if ((row.adminOtpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json(
      { ok: false, reason: "too_many_attempts" },
      { status: 429 },
    );
  }

  if (!verifyOtpHash(code, row.adminOtpHash)) {
    await db
      .update(users)
      .set({ adminOtpAttempts: (row.adminOtpAttempts ?? 0) + 1 })
      .where(eq(users.id, userId));
    return NextResponse.json({ ok: false, reason: "mismatch" }, { status: 400 });
  }

  // 成功: OTP を無効化し、admin_2fa クッキーを発行
  await db
    .update(users)
    .set({ adminOtpHash: null, adminOtpExpires: null, adminOtpAttempts: 0 })
    .where(eq(users.id, userId));

  const token = await signAdmin2faToken(userId);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_2FA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_2FA_COOKIE_MAX_AGE,
  });
  return res;
}
