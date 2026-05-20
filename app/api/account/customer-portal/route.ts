// POST /api/account/customer-portal
//
// 認証必須。users.lsCustomerId をもとに LS の Customer Portal URL を発行 → クライアントに返す。
// プラン変更・カード変更・解約はすべて LS 側に委譲する設計。
//
// 200: { ok: true, url }
// 4xx: { ok: false, reason, message }
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getCustomerPortalUrl } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated", message: "ログインが必要です。" },
      { status: 401 },
    );
  }
  if (session.user.tier === "banned") {
    return NextResponse.json(
      { ok: false, reason: "banned", message: "アカウントが停止されています。" },
      { status: 403 },
    );
  }

  const [row] = await db
    .select({ lsCustomerId: users.lsCustomerId })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);
  if (!row?.lsCustomerId) {
    return NextResponse.json(
      {
        ok: false,
        reason: "no_customer",
        message: "Lemon Squeezy の顧客情報が見つかりません。",
      },
      { status: 404 },
    );
  }

  try {
    const url = await getCustomerPortalUrl(row.lsCustomerId);
    if (!url) {
      return NextResponse.json(
        {
          ok: false,
          reason: "no_portal_url",
          message: "Customer Portal URL を取得できませんでした。",
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[customer-portal] getCustomerPortalUrl failed", e);
    return NextResponse.json(
      {
        ok: false,
        reason: "ls_error",
        message: "Customer Portal URL の取得に失敗しました。",
      },
      { status: 502 },
    );
  }
}
