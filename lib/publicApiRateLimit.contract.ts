// 公開 API (認証不要の 3 本) の IP 単位レート制限の契約。
// 実装は lib/publicApiRateLimit.ts。ルートからは lib/publicApiRateLimit.ts を import する。
import type { NextResponse } from "next/server";

/** レート制限をかける公開 API の名前。キー接頭辞と上限表の添字に使う。 */
export type PublicApiRoute = "codes" | "license" | "version";

/** 1 ルートの上限。windowSec 秒あたり max 回まで (IP ごと)。 */
export type PublicRateLimit = {
  windowSec: number;
  max: number;
};

/**
 * ルートごとの上限表。
 * @invariant codes / license は 30 回 / 600 秒、version は 60 回 / 600 秒。
 */
export const PUBLIC_RATE_LIMITS = {
  codes: { windowSec: 600, max: 30 },
  license: { windowSec: 600, max: 30 },
  version: { windowSec: 600, max: 60 },
} as const satisfies Record<PublicApiRoute, PublicRateLimit>;

/** IP を取れないときに数える共通キー。 */
export const UNKNOWN_IP_KEY = "unknown";

/**
 * checkRateLimit に渡すキーを作る。
 * @post 戻り値は `pub:<route>:<ip>`。ip が null なら `pub:<route>:unknown`。
 * @invariant ルートが違えば必ず違うキーになる (ルート同士でカウンタを共有しない)。
 */
export type PublicRateLimitKey = (
  route: PublicApiRoute,
  ip: string | null,
) => string;

/**
 * 上限を超えたときの 429 応答を作る。
 * @post status 429・本文 `{ error: "rate_limit" }`。
 * @post ヘッダー: `Retry-After` = PUBLIC_RATE_LIMITS[route].windowSec (10 進の秒数の文字列)、
 *       `Cache-Control: no-store, max-age=0` (version の CDN キャッシュに 429 を載せない)。
 *       route が "version" のときだけ、既存の CORS に合わせて `Access-Control-Allow-Origin: *` も付ける。
 * @invariant 既存の NO_STORE_HEADERS / CACHE_HEADERS は使わない (429 は常に no-store)。
 */
export type BuildRateLimitedResponse = (route: PublicApiRoute) => NextResponse;

/**
 * レート制限部品 (checkRateLimit / KV) が例外を投げたときの扱い。fail-open。
 * @post console.error に route と例外を記録し、null (= 通す) を返す。
 * @throws 投げない。
 */
export type OnRateLimitError = (route: PublicApiRoute, err: unknown) => null;

/**
 * 公開 API のハンドラ先頭で呼ぶ IP 単位レート制限。
 * @pre route はそのハンドラ自身のルート名。
 * @post null = 通す (ハンドラは変更前と同じ応答を返す)。
 *       NextResponse = 上限超過。BuildRateLimitedResponse の 429 をそのまま返すこと。
 * @post IP は clientIpFromHeaders(req.headers)。取れなければ UNKNOWN_IP_KEY で数える。
 * @post checkRateLimit が例外を投げたら OnRateLimitError に任せる (fail-open、500 にしない)。
 * @throws 投げない。
 */
export type EnforcePublicRateLimit = (
  req: Request,
  route: PublicApiRoute,
) => Promise<NextResponse | null>;
