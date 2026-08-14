// GET /api/license/validate?key=XXX
// 拡張側 background.js から叩かれる公開エンドポイント (認証不要)。
//
// レスポンス契約:
//   有効: { valid: true, expires?: ISO8601 } / 200
//   無効: { valid: false, reason: "expired" | "inactive" | "not_found" } / 200
//
// 1st リリースではレート制限を入れない (拡張側で 7 日キャッシュ + 24h 再検証するので
// 攻撃 ROI が低い)。brute force 懸念が出たら IP/key ベースのレート制限を追加する。
import { NextResponse } from "next/server";
import { validateLicenseKey } from "@/lib/license/validate";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex",
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const result = await validateLicenseKey(key);
  return NextResponse.json(result, { status: 200, headers: NO_STORE_HEADERS });
}
