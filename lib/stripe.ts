// Stripe ラッパ。Checkout Session / Billing Portal / Webhook 署名検証をまとめる。
//
// Lemon Squeezy からの移行版 (審査が速い Stripe に切替)。
// API ref: https://stripe.com/docs/api
//
// スコープ:
//   - createCheckoutSession: アップグレードボタン → サブスク Checkout の signed URL 発行
//   - createBillingPortalSession: 解約・カード変更・領収書を Stripe Billing Portal に委譲
//   - getSubscription: webhook で受け取った subscription_id の最新状態を取り直す
//   - constructWebhookEvent: stripe-signature ヘッダの署名検証 (SDK 組み込み)
//
// 拡張側の Pro 判定は Stripe を直接叩かず、決済成功時に当サイトが発行する
// 独自ライセンスキー (users.licenseKey) を /api/license/validate で検証する。

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // apiVersion は省略し、SDK 同梱のデフォルト (= アカウント設定のバージョン) を使う。
  _stripe = new Stripe(key);
  return _stripe;
}

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ochacomet.aoyamacreate.com"
  );
}

/* ---------- proStatus マッピング ---------- */

/** Stripe の subscription.status → 内部 enum (proStatus) にマップ */
export function mapStripeStatus(
  s: Stripe.Subscription.Status | string,
): "trialing" | "active" | "past_due" | "cancelled" {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    default:
      return "cancelled";
  }
}

/** サブスクの現契約期間末 (= ライセンス有効期限) を Date で返す。
 *  Stripe API 2025-04+ では current_period_end は subscription item 側に移動した。 */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ends = (sub.items?.data ?? [])
    .map((it) => it.current_period_end)
    .filter((n): n is number => typeof n === "number");
  if (ends.length === 0) return null;
  // 複数アイテムがあれば最も遅い期間末を採用 (最低 1 アイテムを Pro として扱う)
  return new Date(Math.max(...ends) * 1000);
}

/* ---------- Price ID 解決 ---------- */

export function resolvePriceId(variant: "monthly" | "yearly"): string | null {
  const raw =
    variant === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;
  return raw && raw.trim() ? raw.trim() : null;
}

/* ---------- Checkout ---------- */

export type CreateCheckoutArgs = {
  priceId: string;
  email: string;
  /** 内部 users.id。webhook で client_reference_id / metadata.user_id として受け取る */
  userId: number;
  variantTag: "monthly" | "yearly";
  /** 既存の Stripe 顧客がいれば再利用 (重複顧客を防ぐ) */
  stripeCustomerId?: string | null;
};

/**
 * サブスク用 Checkout Session を作成し、リダイレクト先 URL を返す。
 * 14 日トライアルは subscription_data.trial_period_days で付与。
 */
export async function createCheckoutSession(
  args: CreateCheckoutArgs,
): Promise<string> {
  const stripe = getStripe();
  const base = appUrl();

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: args.priceId, quantity: 1 }],
    client_reference_id: String(args.userId),
    subscription_data: {
      trial_period_days: 14,
      metadata: { user_id: String(args.userId), variant_tag: args.variantTag },
    },
    allow_promotion_codes: true,
    success_url: `${base}/account/subscription?checkout=success`,
    cancel_url: `${base}/account/subscription?checkout=cancel`,
  };

  // 既存顧客がいれば customer を指定、いなければ customer_email で新規作成させる
  // (両方同時には指定できない)。
  // 注: subscription モードでは顧客は常に自動作成されるため customer_creation は
  //     指定できない (payment モード専用パラメータ)。
  if (args.stripeCustomerId) {
    params.customer = args.stripeCustomerId;
  } else {
    params.customer_email = args.email;
  }

  const session = await stripe.checkout.sessions.create(params);
  if (!session.url) {
    throw new Error("Stripe Checkout Session に url がありません");
  }
  return session.url;
}

/* ---------- Billing Portal ---------- */

/** 解約・プラン変更・カード変更・領収書を委譲する Billing Portal の URL を返す */
export async function createBillingPortalSession(
  customerId: string,
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/account/subscription`,
  });
  return session.url;
}

/* ---------- Subscription 取得 ---------- */

/** Webhook で受け取った subscription_id の最新状態を取り直す (raw payload を信用しすぎない) */
export async function getSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (e) {
    const err = e as { statusCode?: number };
    if (err.statusCode === 404) return null;
    throw e;
  }
}

/* ---------- Webhook 署名検証 ---------- */

/**
 * stripe-signature ヘッダを検証して Stripe.Event を返す。
 * 署名不一致や secret 未設定時は例外を投げる (呼び出し側で 400)。
 */
export function constructWebhookEvent(
  rawBody: string,
  signature: string | null,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  if (!signature) throw new Error("missing stripe-signature header");
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}
