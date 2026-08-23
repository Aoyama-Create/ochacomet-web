// POST /api/webhooks/stripe
//
// Stripe が送ってくる checkout / subscription / invoice イベントを処理し、
// users テーブルの proStatus / proSource / stripeCustomerId / stripeSubscriptionId /
// licenseKey / proPeriodEndsAt / tier を更新する。
//
// 認証: stripe-signature ヘッダを STRIPE_WEBHOOK_SECRET で検証 (SDK 組み込み)。
//
// ユーザー紐付け:
//   - subscription/checkout: metadata.user_id (checkout 時に付与) を最優先 → email → stripeCustomerId
//   - proSource='admin_grant' のユーザーは Stripe イベントで proSource を上書きしない
//   - イベントの順序逆転に強くするため、subscription は常に最新状態を retrieve して反映する
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminActions, users } from "@/db/schema";
import {
  constructWebhookEvent,
  getSubscription,
  mapStripeStatus,
  subscriptionPeriodEnd,
} from "@/lib/stripe";
import { generateLicenseKey } from "@/lib/license/generate";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(raw, sig);
  } catch (e) {
    console.warn("[stripe webhook] signature verification failed", String(e));
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.type,
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(
          event.type,
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.type,
          event.data.object as Stripe.Invoice,
        );
        break;
      default:
        // 未対応イベントは 200 で受け流す (Stripe の retry を起こさないため)
        console.log("[stripe webhook] unhandled event", event.type);
    }
  } catch (e) {
    console.error("[stripe webhook] handler failed", {
      event: event.type,
      error: String(e),
    });
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: event.type });
}

/* ----------------------------------------------------------------
   checkout.session.completed
   ---------------------------------------------------------------- */

async function handleCheckoutCompleted(
  event: string,
  s: Stripe.Checkout.Session,
): Promise<void> {
  const userIdMeta = s.client_reference_id ?? undefined;
  const email = (s.customer_details?.email ?? s.customer_email ?? "").toLowerCase();
  const customerId =
    typeof s.customer === "string" ? s.customer : (s.customer?.id ?? null);
  const subscriptionId =
    typeof s.subscription === "string"
      ? s.subscription
      : (s.subscription?.id ?? null);

  const userId = await resolveUserId({ userIdMeta, email, customerId });
  if (!userId) {
    // email はログに出さない。customerId / client_reference_id で追跡できる
    // (同ファイルの subscription 側と同じ形)。
    console.warn("[stripe webhook] no user for checkout", {
      event,
      customerId,
      clientReferenceId: userIdMeta ?? null,
    });
    return;
  }

  // サブスクの最新状態を取り直して反映 (raw payload を信用しすぎない)
  const sub = subscriptionId ? await getSubscription(subscriptionId) : null;
  await applySubscriptionToUser(event, userId, customerId, subscriptionId, sub);
}

/* ----------------------------------------------------------------
   customer.subscription.created / updated / deleted
   ---------------------------------------------------------------- */

async function handleSubscriptionEvent(
  event: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const userIdMeta = sub.metadata?.user_id ?? undefined;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const userId = await resolveUserId({ userIdMeta, email: "", customerId });
  if (!userId) {
    console.warn("[stripe webhook] no user for subscription", {
      event,
      customerId,
    });
    return;
  }

  await applySubscriptionToUser(event, userId, customerId, sub.id, sub);
}

/* ----------------------------------------------------------------
   invoice.payment_failed → past_due
   ---------------------------------------------------------------- */

async function handleInvoicePaymentFailed(
  event: string,
  invoice: Stripe.Invoice,
): Promise<void> {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer?.id ?? null);
  if (!customerId) return;

  const [u] = await db
    .select({ id: users.id, proSource: users.proSource, tier: users.tier })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  if (!u) return;
  if (u.proSource === "admin_grant" || u.tier === "banned") return;

  await db
    .update(users)
    .set({ proStatus: "past_due", updatedAt: new Date() })
    .where(eq(users.id, u.id));

  await audit(u.id, event, { customerId, invoiceId: invoice.id });
}

/* ----------------------------------------------------------------
   共通: subscription 状態を users に反映
   ---------------------------------------------------------------- */

async function applySubscriptionToUser(
  event: string,
  userId: number,
  customerId: string | null,
  subscriptionId: string | null,
  sub: Stripe.Subscription | null,
): Promise<void> {
  const [current] = await db
    .select({
      proSource: users.proSource,
      tier: users.tier,
      licenseKey: users.licenseKey,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!current) return;

  const status = sub ? sub.status : "canceled";
  const newProStatus = mapStripeStatus(status);
  const periodEnd = sub ? subscriptionPeriodEnd(sub) : null;
  const now = new Date();

  const updates: Record<string, unknown> = {
    proStatus: newProStatus,
    proPeriodEndsAt: periodEnd,
    updatedAt: now,
  };
  if (customerId) updates.stripeCustomerId = customerId;
  if (subscriptionId) updates.stripeSubscriptionId = subscriptionId;
  if (current.proSource !== "admin_grant") {
    updates.proSource = "stripe";
  }

  // tier 昇格 (free / friend → pro)。trialing / active のとき。
  if (
    current.tier !== "banned" &&
    (newProStatus === "trialing" || newProStatus === "active")
  ) {
    updates.tier = "pro";
    // Pro 化の瞬間にライセンスキーを発行 (未発行なら)。renewal では維持。
    if (!current.licenseKey) {
      updates.licenseKey = generateLicenseKey();
    }
  }

  // 解約完了 / 期間満了で tier を free に戻す (admin_grant / banned は触らない)
  if (
    (event === "customer.subscription.deleted" ||
      newProStatus === "cancelled") &&
    current.proSource !== "admin_grant" &&
    current.tier !== "banned"
  ) {
    updates.tier = "free";
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
  await audit(userId, event, {
    customerId,
    subscriptionId,
    status,
    periodEnd: periodEnd?.toISOString() ?? null,
  });
}

/* ----------------------------------------------------------------
   ユーザー紐付け
   ---------------------------------------------------------------- */

/**
 * metadata.user_id → email → stripeCustomerId の順で users を引く。
 * email でも見つからなければ unclaimed スタブを作成。
 */
async function resolveUserId(args: {
  userIdMeta: string | undefined;
  email: string;
  customerId: string | null;
}): Promise<number | null> {
  const { userIdMeta, email, customerId } = args;

  // 1. metadata.user_id (checkout 時に付与)
  if (userIdMeta) {
    const n = parseInt(userIdMeta, 10);
    if (Number.isInteger(n) && n > 0) {
      const [row] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, n))
        .limit(1);
      if (row) return row.id;
    }
  }

  // 2. email 完全一致
  if (email) {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (row) return row.id;
  }

  // 3. stripeCustomerId 一致 (subscription.updated 等、email が無いイベント向け)
  if (customerId) {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);
    if (row) return row.id;
  }

  // 4. 紐付け不能 → email があれば unclaimed スタブを作成
  if (!email) return null;
  try {
    const [row] = await db
      .insert(users)
      .values({
        email,
        passwordHash: null,
        tier: "free",
        statusClaimed: false,
      })
      .returning({ id: users.id });
    // email はログに出さない (userId で引ける)。
    console.log("[stripe webhook] created unclaimed stub", { userId: row.id });
    return row.id;
  } catch {
    // UNIQUE 競合 → 引き直し
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row?.id ?? null;
  }
}

async function audit(
  userId: number,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await db
    .insert(adminActions)
    .values({
      adminId: userId, // システム自動更新は targetUser を adminId に流用
      targetUserId: userId,
      action: `stripe:${event}`,
      payload,
    })
    .catch((e) => console.error("[stripe webhook] audit insert failed", e));
}
