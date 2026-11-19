// GET /api/license/validate?key=XXX
// 拡張側 background.js から叩かれる公開エンドポイント (認証不要)。
//
// レスポンス契約:
//   有効: { valid: true, expires?: ISO8601 } / 200
//   無効: { valid: false, reason: "expired" | "inactive" | "not_found" } / 200
//
// レート制限: IP ごとに 30 回 / 10 分 (lib/publicApiRateLimit)。超過時は 429 { error: "rate_limit" }。
import { NextResponse } from "next/server";
import { validateLicenseKey } from "@/lib/license/validate";
import { enforcePublicRateLimit } from "@/lib/publicApiRateLimit";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex",
} as const;

export async function GET(req: Request) {
  const limited = await enforcePublicRateLimit(req, "license");
  if (limited) return limited;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const result = await validateLicenseKey(key);
  return NextResponse.json(result, { status: 200, headers: NO_STORE_HEADERS });
}
