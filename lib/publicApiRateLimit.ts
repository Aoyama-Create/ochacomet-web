// 公開 API の IP 単位レート制限。契約は lib/publicApiRateLimit.contract.ts。
import { NextResponse } from "next/server";
import { clientIpFromHeaders } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  PUBLIC_RATE_LIMITS,
  UNKNOWN_IP_KEY,
  type BuildRateLimitedResponse,
  type EnforcePublicRateLimit,
  type OnRateLimitError,
  type PublicRateLimitKey,
} from "@/lib/publicApiRateLimit.contract";

export type { PublicApiRoute } from "@/lib/publicApiRateLimit.contract";

export const publicRateLimitKey: PublicRateLimitKey = (route, ip) =>
  `pub:${route}:${ip ?? UNKNOWN_IP_KEY}`;

export const buildRateLimitedResponse: BuildRateLimitedResponse = (route) => {
  const headers: Record<string, string> = {
    "Retry-After": String(PUBLIC_RATE_LIMITS[route].windowSec),
    "Cache-Control": "no-store, max-age=0",
  };
  if (route === "version") {
    headers["Access-Control-Allow-Origin"] = "*";
  }
  return NextResponse.json({ error: "rate_limit" }, { status: 429, headers });
};

export const onRateLimitError: OnRateLimitError = (route, err) => {
  console.error(
    `[publicApiRateLimit] ${route}: レート制限の確認に失敗したため通します`,
    err,
  );
  return null;
};

export const enforcePublicRateLimit: EnforcePublicRateLimit = async (
  req,
  route,
) => {
  const key = publicRateLimitKey(route, clientIpFromHeaders(req.headers));
  let allowed: boolean;
  try {
    allowed = await checkRateLimit(key, PUBLIC_RATE_LIMITS[route]);
  } catch (err) {
    return onRateLimitError(route, err);
  }
  return allowed ? null : buildRateLimitedResponse(route);
};
