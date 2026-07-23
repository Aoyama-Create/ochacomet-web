// 拡張から叩かれるライセンスキー検証ロジック。
// /api/license/validate?key=XXX のレスポンス整形のもと。
//
// レスポンス契約 (フレンドコード /api/codes/validate と同形):
//   有効: { valid: true, expires?: ISO8601 }
//   無効: { valid: false, reason: "expired" | "inactive" | "not_found" }
//
// Stripe Webhook が users.proStatus / proPeriodEndsAt を最新に保つので、
// ここは DB の状態をそのまま判定するだけでよい (解約・期限切れも検出できる)。
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { isLicenseKeyFormatValid, normalizeLicenseKey } from "./generate";

export type ValidateLicenseResult =
  | { valid: true; expires?: string }
  | { valid: false; reason: "expired" | "inactive" | "not_found" };

export async function validateLicenseKey(
  rawKey: string,
): Promise<ValidateLicenseResult> {
  const key = normalizeLicenseKey(rawKey);
  if (!isLicenseKeyFormatValid(key)) {
    return { valid: false, reason: "not_found" };
  }

  const [u] = await db
    .select({
      tier: users.tier,
      proStatus: users.proStatus,
      proPeriodEndsAt: users.proPeriodEndsAt,
    })
    .from(users)
    .where(eq(users.licenseKey, key))
    .limit(1);

  if (!u) {
    return { valid: false, reason: "not_found" };
  }
  // BAN は存在ごと隠す
  if (u.tier === "banned") {
    return { valid: false, reason: "not_found" };
  }

  const now = new Date();

  // 契約期間末を過ぎていれば期限切れ (webhook の取りこぼし対策に時刻でも判定)
  if (u.proPeriodEndsAt && u.proPeriodEndsAt <= now) {
    return { valid: false, reason: "expired" };
  }

  // trialing / active のみ Pro 有効。cancelled / past_due は無効。
  if (u.proStatus !== "trialing" && u.proStatus !== "active") {
    return { valid: false, reason: "inactive" };
  }

  return u.proPeriodEndsAt
    ? { valid: true, expires: u.proPeriodEndsAt.toISOString() }
    : { valid: true };
}
