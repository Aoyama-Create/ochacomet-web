// GET /api/codes/validate?code=XXX
// 拡張側 background.js から叩かれる公開エンドポイント (認証不要)。
//
// 設計書 01 §4 のレスポンス契約:
//   有効: { valid: true, expires: ISO8601 } / 200
//   無効: { valid: false, reason: "expired" | "not_found" } / 200
//
// レート制限: IP ごとに 30 回 / 10 分 (lib/publicApiRateLimit)。超過時は 429 { error: "rate_limit" }。
import { NextResponse } from "next/server";
import { validateFriendCode } from "@/lib/friendCodes/validate";
import { enforcePublicRateLimit } from "@/lib/publicApiRateLimit";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  // 拡張からの呼び出しは host_permissions で許可済みだが、念のため
  "X-Robots-Tag": "noindex",
} as const;

export async function GET(req: Request) {
  const limited = await enforcePublicRateLimit(req, "codes");
  if (limited) return limited;
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const result = await validateFriendCode(code);
  return NextResponse.json(result, { status: 200, headers: NO_STORE_HEADERS });
}
