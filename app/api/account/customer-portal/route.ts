// POST /api/account/customer-portal
//
// 認証必須。users.stripeCustomerId をもとに Stripe Billing Portal の URL を発行 → クライアントに返す。
// プラン変更・カード変更・解約・領収書はすべて Stripe 側に委譲する設計。
//
// 200: { ok: true, url }
// 4xx: { ok: false, reason, message }
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { createBillingPortalSession } from "@/lib/stripe";

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
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);
  if (!row?.stripeCustomerId) {
    return NextResponse.json(
      {
        ok: false,
        reason: "no_customer",
        message: "Stripe の顧客情報が見つかりません。",
      },
      { status: 404 },
    );
  }

  try {
    const url = await createBillingPortalSession(row.stripeCustomerId);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[customer-portal] createBillingPortalSession failed", e);
    return NextResponse.json(
      {
        ok: false,
        reason: "stripe_error",
        message: "Billing Portal URL の取得に失敗しました。",
      },
      { status: 502 },
    );
  }
}
