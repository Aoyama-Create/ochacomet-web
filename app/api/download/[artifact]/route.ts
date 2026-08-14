// GET /api/download/[artifact]
//
// artifact:
//   "ochacomet-latest"        → releases テーブルの最新行 (uploaded_at DESC)
//   "ochacomet-vX.Y.Z"        → 指定バージョン
//
// 認証 + メール認証 + BAN チェック + レート制限 (10/24h) + watermark 注入 + 監査ログ。
// 設計書 06 §4 に準拠。
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases } from "@/db/schema";
import { getReleaseStream, releaseBlobPath } from "@/lib/blob";
import { injectWatermark } from "@/lib/watermark";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIpFromHeaders, logDownload } from "@/lib/audit";

const VERSION_RE = /^ochacomet-v(\d+\.\d+\.\d+)$/;

type Params = { artifact: string };

async function resolveVersion(artifact: string): Promise<string | null> {
  if (artifact === "ochacomet-latest") {
    const [latest] = await db
      .select({ version: releases.version })
      .from(releases)
      .orderBy(desc(releases.uploadedAt))
      .limit(1);
    return latest?.version ?? null;
  }
  const m = artifact.match(VERSION_RE);
  if (!m) return null;
  const [exists] = await db
    .select({ version: releases.version })
    .from(releases)
    .where(eq(releases.version, m[1]))
    .limit(1);
  return exists?.version ?? null;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<Params> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    const callback = encodeURIComponent(new URL(req.url).pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callback}`, req.url),
    );
  }
  if (session.user.tier === "banned") {
    return NextResponse.json({ error: "account_banned" }, { status: 403 });
  }
  if (!session.user.emailVerifiedAt) {
    return NextResponse.redirect(new URL("/verify-email/sent", req.url));
  }

  // レート制限 (ユーザー単位)
  const allowed = await checkRateLimit(`dl:${session.user.id}`, {
    windowSec: 24 * 60 * 60,
    max: 10,
  });
  if (!allowed) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  const { artifact } = await ctx.params;
  const version = await resolveVersion(artifact);
  if (!version) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let sourceStream: ReadableStream<Uint8Array>;
  try {
    sourceStream = await getReleaseStream(releaseBlobPath(version));
  } catch (e) {
    console.error("[download] blob fetch failed", { version, error: String(e) });
    return NextResponse.json({ error: "blob_unavailable" }, { status: 502 });
  }

  let outStream: ReadableStream<Uint8Array>;
  try {
    outStream = await injectWatermark(sourceStream, {
      userId: String(session.user.id),
      email: session.user.email,
      version,
      downloadedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[download] watermark failed", { version, error: String(e) });
    return NextResponse.json({ error: "watermark_failed" }, { status: 500 });
  }

  // 監査ログは fire-and-forget
  logDownload({
    userId: Number(session.user.id),
    version,
    ip: clientIpFromHeaders(req.headers),
    userAgent: req.headers.get("user-agent"),
  }).catch((e) => console.error("[download] audit failed", e));

  return new Response(outStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ochacomet-v${version}.zip"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
