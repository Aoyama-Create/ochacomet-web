// GET /api/version/latest
// 拡張 background.js が 1 日 1 回ポーリングする公開エンドポイント (認証不要)。
//
// 設計書 05 §2 準拠。ただしデータ源は Vercel KV ではなく releases テーブル
// (アップロードフローに一本化)。releases の semver 最大を「最新版」とする。
//
// レスポンス (200):
//   { latestVersion, downloadPageUrl, releaseNotesUrl, publishedAt, minVersion }
// releases が空 (未公開): 503 { error }
//
// force-lock は今回スコープ外。minVersion は env MIN_SUPPORTED_VERSION を
// そのまま返すのみで、拡張側では情報表示にとどめる。
//
// レート制限: IP ごとに 60 回 / 10 分 (lib/publicApiRateLimit)。超過時は 429 { error: "rate_limit" }
// (429 は Cache-Control: no-store で返し、CDN キャッシュに載せない)。
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { releases } from "@/db/schema";
import { compareSemver, maxSemver } from "@/lib/semver";
import { enforcePublicRateLimit } from "@/lib/publicApiRateLimit";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300",
  "Access-Control-Allow-Origin": "*",
} as const;

export async function GET(req: Request) {
  const limited = await enforcePublicRateLimit(req, "version");
  if (limited) return limited;

  const rows = await db
    .select({
      version: releases.version,
      releaseNotesUrl: releases.releaseNotesUrl,
      uploadedAt: releases.uploadedAt,
    })
    .from(releases);

  const latestVersion = maxSemver(rows.map((r) => r.version));
  if (!latestVersion) {
    return NextResponse.json(
      { error: "no_release_published" },
      { status: 503, headers: CACHE_HEADERS },
    );
  }

  // 最大 semver の行を取り出す (同一 version が複数あれば最後の 1 行)
  const latest = rows
    .filter((r) => compareSemver(r.version, latestVersion) === 0)
    .at(-1)!;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ochacomet.aoyamacreate.com";

  return NextResponse.json(
    {
      latestVersion,
      downloadPageUrl: `${appUrl}/account/download`,
      releaseNotesUrl: latest.releaseNotesUrl ?? null,
      publishedAt: latest.uploadedAt?.toISOString() ?? null,
      minVersion: process.env.MIN_SUPPORTED_VERSION ?? null,
    },
    { status: 200, headers: CACHE_HEADERS },
  );
}
