// Lemon Squeezy REST API ラッパ + Webhook 署名検証。
//
// API ref: https://docs.lemonsqueezy.com/api
// Webhook: x-signature ヘッダで HMAC-SHA256 を検証 (timingSafeEqual で副チャネル対策)。
//
// 1st リリーススコープ:
//   - createCheckoutUrl: ユーザーがアップグレードボタンを押した時のチェックアウト URL 発行
//   - getCustomerPortalUrl: 解約・カード変更を LS 側に委譲
//   - getSubscription: webhook で受け取った subscription_id の詳細取り直し (raw payload を信用しすぎない)
//   - verifyWebhookSignature: HMAC 検証
//
// 拡張側の license 検証 (validate / activate / deactivate) はここでは扱わず、
// 拡張の background.js から直接 api.lemonsqueezy.com を叩く設計 (設計書 01 §3)。

import { createHmac, timingSafeEqual } from "node:crypto";

const LS_BASE = "https://api.lemonsqueezy.com/v1";

function apiKey(): string {
  const k = process.env.LEMONSQUEEZY_API_KEY;
  if (!k) throw new Error("LEMONSQUEEZY_API_KEY is not set");
  return k;
}

function storeId(): string {
  const s = process.env.LEMONSQUEEZY_STORE_ID;
  if (!s) throw new Error("LEMONSQUEEZY_STORE_ID is not set");
  return s;
}

async function lsFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${LS_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey()}`,
      ...(init.headers ?? {}),
    },
  });
}

/* ---------- 型 (LS の data.attributes から必要部分のみ) ---------- */

export type LsSubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

/** LS のサブスク状態 → 内部 enum (proStatus) にマップ */
export function mapSubscriptionStatus(
  s: LsSubscriptionStatus | string,
): "trialing" | "active" | "past_due" | "cancelled" {
  switch (s) {
    case "on_trial":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "cancelled":
    case "expired":
      return "cancelled";
    default:
      return "cancelled";
  }
}

export type LsSubscription = {
  id: string;
  attributes: {
    store_id: number;
    customer_id: number;
    order_id: number;
    order_item_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    user_name: string | null;
    user_email: string;
    status: LsSubscriptionStatus;
    status_formatted: string;
    pause: unknown;
    cancelled: boolean;
    trial_ends_at: string | null;
    billing_anchor: number | null;
    first_subscription_item: {
      id: number;
      subscription_id: number;
      price_id: number;
      quantity: number;
      is_usage_based: boolean;
    } | null;
    urls: { update_payment_method?: string; customer_portal?: string };
    renews_at: string | null;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
    test_mode: boolean;
  };
};

export type LsOrder = {
  id: string;
  attributes: {
    store_id: number;
    customer_id: number;
    user_email: string;
    user_name: string | null;
    status: string;
    refunded: boolean;
    test_mode: boolean;
    first_order_item?: {
      product_id: number;
      variant_id: number;
      product_name: string;
      variant_name: string;
    };
  };
};

export type LsLicenseKey = {
  id: string;
  attributes: {
    store_id: number;
    customer_id: number;
    order_id: number;
    product_id: number;
    user_name: string | null;
    user_email: string;
    key: string;
    key_short: string;
    activation_limit: number;
    instances_count: number;
    disabled: boolean;
    status: "inactive" | "active" | "expiring" | "expired" | "disabled";
    expires_at: string | null;
    created_at: string;
    updated_at: string;
  };
};

/* ---------- Webhook 署名検証 ---------- */

/**
 * LS Webhook の HMAC-SHA256 検証。Webhook の Signing secret (LS Dashboard で設定) を
 * 共有鍵として、リクエスト raw body の HMAC を `x-signature` ヘッダと比較する。
 *
 * @param rawBody Webhook が送ってきた raw リクエストボディ文字列 (パース前)
 * @param signature `x-signature` ヘッダの値
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/* ---------- API: Checkout ---------- */

export type CreateCheckoutArgs = {
  variantId: number;
  email: string;
  /** ユーザー識別子。webhook の `meta.custom_data.user_id` で受け取って紐付ける */
  userId: number;
  /** 月額/年額の人間向けタグ。LS ダッシュボードでの集計に使う (任意) */
  variantTag?: "monthly" | "yearly";
};

/**
 * LS Checkouts API で 1 回限りの signed URL を発行する。
 * 返り値 URL をブラウザに渡してリダイレクトすると LS のチェックアウトが開く。
 *
 * 参考: https://docs.lemonsqueezy.com/api/checkouts
 */
export async function createCheckoutUrl(args: CreateCheckoutArgs): Promise<string> {
  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: args.email,
          custom: {
            user_id: String(args.userId),
            variant_tag: args.variantTag ?? "",
          },
        },
        // 14 日トライアルは LS の商品設定側 (Variant 単位) で有効化済の前提。
        // ここでは何も上書きしない。
        product_options: {
          // 購入完了後の戻り先
          redirect_url:
            (process.env.NEXT_PUBLIC_APP_URL ??
              "https://ochacomet.aoyamacreate.com") +
            "/account/subscription?checkout=success",
          receipt_button_text: "マイページに戻る",
          receipt_thank_you_note: "OchaComet をご購入いただきありがとうございます!",
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId() } },
        variant: { data: { type: "variants", id: String(args.variantId) } },
      },
    },
  };

  const res = await lsFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LS createCheckoutUrl failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as {
    data: { attributes: { url: string } };
  };
  return json.data.attributes.url;
}

/* ---------- API: Customer Portal ---------- */

/**
 * 指定した customer の Customer Portal URL を取得。
 * 解約 / プラン変更 / カード変更を LS 側に丸投げ。
 *
 * 参考: https://docs.lemonsqueezy.com/api/customers#retrieve-a-customer
 */
export async function getCustomerPortalUrl(
  customerId: string,
): Promise<string | null> {
  const res = await lsFetch(`/customers/${customerId}`, { method: "GET" });
  if (!res.ok) {
    if (res.status === 404) return null;
    const text = await res.text().catch(() => "");
    throw new Error(
      `LS getCustomerPortalUrl failed (${res.status}): ${text}`,
    );
  }
  const json = (await res.json()) as {
    data: { attributes: { urls: { customer_portal: string } } };
  };
  return json.data.attributes.urls.customer_portal ?? null;
}

/* ---------- API: Subscription Retrieve ---------- */

/** Webhook で受け取った subscription_id の最新詳細を LS から取り直す */
export async function getSubscription(
  subscriptionId: string,
): Promise<LsSubscription | null> {
  const res = await lsFetch(`/subscriptions/${subscriptionId}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    const text = await res.text().catch(() => "");
    throw new Error(`LS getSubscription failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { data: LsSubscription };
  return json.data;
}

/* ---------- Variant ID マッピング ---------- */

/** リクエストの variant パラメータから env 経由で LS の variant_id を解決 */
export function resolveVariantId(
  variant: "monthly" | "yearly",
): number | null {
  const raw =
    variant === "monthly"
      ? process.env.LEMONSQUEEZY_VARIANT_ID_MONTHLY
      : process.env.LEMONSQUEEZY_VARIANT_ID_YEARLY;
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}
