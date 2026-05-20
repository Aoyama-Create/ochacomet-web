// POST /api/webhooks/lemonsqueezy
//
// Lemon Squeezy が送ってくる subscription_* / order_* / license_key_* イベントを処理し、
// users テーブルの proStatus / proSource / lsCustomerId / lsSubscriptionId / lsLicenseKey /
// lsTrialEndsAt / tier を更新する。
//
// 認証: x-signature ヘッダの HMAC-SHA256 を `LEMONSQUEEZY_WEBHOOK_SECRET` で検証。
//
// 設計書 07 §6 に準拠:
//   - email ベースでユーザー紐付け
//   - email 一致なし → unclaimed スタブ (status_claimed=false) を作成
//   - proSource='admin_grant' のユーザーは LS イベントで上書きしない
//   - 古い event (updated_at が DB より古い) は無視
//
// Brevo の transactional は別途 (subscription_started 等) で送る予定だが
// 1st リリーススコープでは最小ロジックのみで、メール送信は後付けで OK。
import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminActions, users } from "@/db/schema";
import {
  mapSubscriptionStatus,
  verifyWebhookSignature,
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

type Meta = {
  event_name?: string;
  custom_data?: { user_id?: string };
};

type SubscriptionAttrs = {
  customer_id: number;
  user_email: string;
  status: string;
  trial_ends_at: string | null;
  renews_at: string | null;
  ends_at: string | null;
  variant_id: number;
  variant_name?: string;
  updated_at: string;
  cancelled?: boolean;
};

type OrderAttrs = {
  customer_id: number;
  user_email: string;
  status: string;
};

type LicenseKeyAttrs = {
  customer_id: number;
  user_email: string;
  key: string;
  status: string;
};

type WebhookPayload = {
  meta?: Meta;
  data?: {
    type?: string;
    id?: string;
    attributes?: SubscriptionAttrs | OrderAttrs | LicenseKeyAttrs;
  };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");

  if (!verifyWebhookSignature(raw, sig)) {
    console.warn("[ls webhook] invalid signature");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const event = payload.meta?.event_name ?? "";
  const dataType = payload.data?.type;
  const dataId = payload.data?.id;
  const attrs = payload.data?.attributes;
  const customUserId = payload.meta?.custom_data?.user_id;

  if (!event || !dataType || !dataId || !attrs) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    if (event.startsWith("subscription_")) {
      await handleSubscriptionEvent(
        event,
        dataId,
        attrs as SubscriptionAttrs,
        customUserId,
      );
    } else if (event === "order_created" || event === "order_refunded") {
      await handleOrderEvent(event, dataId, attrs as OrderAttrs, customUserId);
    } else if (event.startsWith("license_key_")) {
      await handleLicenseKeyEvent(
        event,
        dataId,
        attrs as LicenseKeyAttrs,
        customUserId,
      );
    } else {
      // 未対応イベントは 200 で受け流す (LS の retry を起こさないため)
      console.log("[ls webhook] unhandled event", event);
    }
  } catch (e) {
    console.error("[ls webhook] handler failed", { event, error: String(e) });
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event });
}

/* ----------------------------------------------------------------
   Subscription イベント
   ---------------------------------------------------------------- */

async function handleSubscriptionEvent(
  event: string,
  subscriptionId: string,
  attrs: SubscriptionAttrs,
  customUserId: string | undefined,
): Promise<void> {
  const email = (attrs.user_email ?? "").toLowerCase();
  const userId = await resolveUserId(email, customUserId);
  if (!userId) {
    console.warn("[ls webhook] no user to attach", { event, email });
    return;
  }

  // proSource='admin_grant' のユーザーは LS イベントで proStatus を上書きしない
  const [current] = await db
    .select({
      proSource: users.proSource,
      tier: users.tier,
      updatedAt: users.updatedAt,
      lsSubscriptionId: users.lsSubscriptionId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!current) return;

  // 古い event を skip (時刻逆転対策)
  const eventTime = new Date(attrs.updated_at);
  if (current.updatedAt && current.updatedAt > eventTime) {
    // 既存の subscription_id と異なる場合は新規購入の可能性があるので例外的に許可
    if (current.lsSubscriptionId === subscriptionId) {
      console.log("[ls webhook] event is older than DB, skipping", { event });
      return;
    }
  }

  const newProStatus = mapSubscriptionStatus(attrs.status);
  const now = new Date();

  // admin_grant の場合は ls_* と proStatus は反映するが proSource は触らない
  const updates: Record<string, unknown> = {
    proStatus: newProStatus,
    lsCustomerId: String(attrs.customer_id),
    lsSubscriptionId: subscriptionId,
    lsTrialEndsAt: attrs.trial_ends_at ? new Date(attrs.trial_ends_at) : null,
    updatedAt: now,
  };
  if (current.proSource !== "admin_grant") {
    updates.proSource = "lemon_squeezy";
  }

  // tier の昇格判定 (free / friend → pro)
  if (
    current.tier !== "banned" &&
    (newProStatus === "trialing" || newProStatus === "active")
  ) {
    updates.tier = "pro";
  }

  // 解約完了 (ends_at が過去 = もはや有効期間が終わっている) なら tier='free' に戻す
  if (
    (event === "subscription_expired" ||
      (event === "subscription_cancelled" && attrs.ends_at &&
        new Date(attrs.ends_at) <= now)) &&
    current.proSource !== "admin_grant" &&
    current.tier !== "banned"
  ) {
    updates.tier = "free";
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  await db.insert(adminActions).values({
    adminId: userId, // システム自動更新の場合は targetUser を adminId に流用 (一貫性のために 0 admin を avoidance)
    targetUserId: userId,
    action: `ls:${event}`,
    payload: {
      subscriptionId,
      customerId: attrs.customer_id,
      status: attrs.status,
      variantId: attrs.variant_id,
      trialEndsAt: attrs.trial_ends_at,
      renewsAt: attrs.renews_at,
      endsAt: attrs.ends_at,
    },
  }).catch((e) => console.error("[ls webhook] audit insert failed", e));
}

/* ----------------------------------------------------------------
   Order イベント (license key 同梱の単発購入想定。1st は使わない)
   ---------------------------------------------------------------- */

async function handleOrderEvent(
  event: string,
  orderId: string,
  attrs: OrderAttrs,
  customUserId: string | undefined,
): Promise<void> {
  const email = (attrs.user_email ?? "").toLowerCase();
  const userId = await resolveUserId(email, customUserId);
  if (!userId) return;

  // 1st では subscription 経由の課金のみなので、ここでは customer_id だけ紐付ける
  const updates: Record<string, unknown> = {
    lsCustomerId: String(attrs.customer_id),
    updatedAt: new Date(),
  };

  await db.update(users).set(updates).where(eq(users.id, userId));
  await db.insert(adminActions).values({
    adminId: userId,
    targetUserId: userId,
    action: `ls:${event}`,
    payload: { orderId, customerId: attrs.customer_id, status: attrs.status },
  }).catch((e) => console.error("[ls webhook] audit insert failed", e));
}

/* ----------------------------------------------------------------
   License key イベント
   ---------------------------------------------------------------- */

async function handleLicenseKeyEvent(
  event: string,
  licenseKeyId: string,
  attrs: LicenseKeyAttrs,
  customUserId: string | undefined,
): Promise<void> {
  const email = (attrs.user_email ?? "").toLowerCase();
  const userId = await resolveUserId(email, customUserId);
  if (!userId) return;

  const updates: Record<string, unknown> = {
    lsCustomerId: String(attrs.customer_id),
    lsLicenseKey: attrs.key, // 拡張がここを `validate` API で叩く想定
    updatedAt: new Date(),
  };

  await db.update(users).set(updates).where(eq(users.id, userId));
  await db.insert(adminActions).values({
    adminId: userId,
    targetUserId: userId,
    action: `ls:${event}`,
    payload: {
      licenseKeyId,
      customerId: attrs.customer_id,
      keyTail: attrs.key.slice(-4),
      status: attrs.status,
    },
  }).catch((e) => console.error("[ls webhook] audit insert failed", e));
}

/* ----------------------------------------------------------------
   ユーザー紐付け
   ---------------------------------------------------------------- */

/**
 * email ベースで users を引く。なければ webhook 受け取り時点の email から
 * unclaimed スタブを作成して id を返す。custom_data.user_id があれば最優先。
 */
async function resolveUserId(
  email: string,
  customUserId: string | undefined,
): Promise<number | null> {
  // 1. custom_data.user_id (checkout 時に渡した signed link 由来) を優先
  if (customUserId) {
    const n = parseInt(customUserId, 10);
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

  // 3. 紐付け不能 → unclaimed スタブを作成 (設計書 07 §6.2.2)
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
    console.log("[ls webhook] created unclaimed stub", {
      email,
      userId: row.id,
    });
    return row.id;
  } catch (e) {
    // UNIQUE 制約違反 (= 競合で誰かが先に作った) → 改めて引き直し
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email)))
      .limit(1);
    if (row) return row.id;
    console.error("[ls webhook] stub creation failed", e);
    return null;
  }
}
