// 1-click unsubscribe 用の HMAC token。
// 受信メールに `?token=XXX` を貼り、token で userId + campaignKey を改ざん耐性ありで搬送する。
// `WATERMARK_SECRET` を流用 (用途は別だが、対称鍵として使い回せる)。
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = () => process.env.WATERMARK_SECRET ?? "";

function sign(body: string): string {
  const secret = SECRET();
  if (!secret) throw new Error("WATERMARK_SECRET is not set");
  return createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * userId + campaignKey から token を作る。
 * フォーマット: `<base64url(userId|campaignKey)>.<sig>`
 * - 期限なし (= 配信停止リンクは長期有効でいい想定)。後で期限を入れたければ
 *   body に exp を追加して sign し直す。
 */
export function makeUnsubscribeToken(
  userId: number,
  campaignKey: string,
): string {
  const body = `${userId}|${campaignKey}`;
  const payload = Buffer.from(body, "utf8").toString("base64url");
  const sig = sign(body);
  return `${payload}.${sig}`;
}

export type ParsedUnsubscribeToken = {
  userId: number;
  campaignKey: string;
};

export function parseUnsubscribeToken(
  token: string,
): ParsedUnsubscribeToken | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  let body: string;
  try {
    body = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(body);
  // 長さ違いだと timingSafeEqual が throw するので先にチェック
  if (sig.length !== expected.length) return null;
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  const [userIdRaw, campaignKey] = body.split("|");
  const userId = parseInt(userIdRaw, 10);
  if (!Number.isInteger(userId) || userId <= 0 || !campaignKey) return null;
  return { userId, campaignKey };
}

/** メール本文に貼る配信停止 URL を組み立てる */
export function buildUnsubscribeUrl(
  baseUrl: string,
  userId: number,
  campaignKey: string,
): string {
  const token = makeUnsubscribeToken(userId, campaignKey);
  return `${baseUrl}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
