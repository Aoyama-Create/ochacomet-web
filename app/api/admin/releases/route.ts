// POST /api/admin/releases (admin only, multipart)
//   form fields:
//     version       (required) "1.20.1" のような semver 文字列
//     sha256        (required) ローカル `build-release.sh` 生成の SHA-256 (改ざん検知)
//     releaseNotes  (optional) URL
//     file          (required) ZIP ファイル
//
// 200: { ok: true, version, blobPath, sha256, sizeBytes }
// 4xx: { ok: false, reason, message }
//
// GET /api/admin/releases (admin only): 全リリース一覧 (新しい順)
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { releases } from "@/db/schema";
import { putRelease, releaseBlobPath } from "@/lib/blob";
import { logAdminAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

const VERSION_RE = /^\d+\.\d+\.\d+$/;
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB (拡張は数 MB なのでこれで十分)

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: guard.status });
  }
  const rows = await db
    .select({
      version: releases.version,
      blobPath: releases.blobPath,
      sha256: releases.sha256,
      sizeBytes: releases.sizeBytes,
      releaseNotesUrl: releases.releaseNotesUrl,
      uploadedAt: releases.uploadedAt,
      uploadedBy: releases.uploadedBy,
    })
    .from(releases)
    .orderBy(desc(releases.uploadedAt))
    .limit(50);
  return NextResponse.json({ ok: true, releases: rows });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: guard.status });
  }

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.startsWith("multipart/form-data")) {
    return NextResponse.json(
      { ok: false, reason: "bad_content_type", message: "multipart/form-data が必要です。" },
      { status: 400 },
    );
  }

  const form = await req.formData();
  const version = String(form.get("version") ?? "").trim();
  const claimedSha = String(form.get("sha256") ?? "").trim().toLowerCase();
  const releaseNotesUrl = String(form.get("releaseNotes") ?? "").trim() || null;
  const file = form.get("file");

  if (!VERSION_RE.test(version)) {
    return NextResponse.json(
      { ok: false, reason: "bad_version", message: "version は 'X.Y.Z' 形式で指定してください。" },
      { status: 400 },
    );
  }
  if (!/^[0-9a-f]{64}$/.test(claimedSha)) {
    return NextResponse.json(
      { ok: false, reason: "bad_sha", message: "sha256 (64 hex) は必須です。" },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, reason: "no_file", message: "file フィールドが必要です。" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, reason: "too_large", message: `ファイルサイズは ${MAX_BYTES} 以下にしてください。` },
      { status: 413 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const actualSha = createHash("sha256").update(buf).digest("hex");
  if (actualSha !== claimedSha) {
    return NextResponse.json(
      {
        ok: false,
        reason: "sha_mismatch",
        message: "SHA-256 が一致しません。アップロードを中止しました。",
        actualSha,
      },
      { status: 400 },
    );
  }

  // 既存バージョンへの再アップロードは弾く (Blob 側も allowOverwrite:false にしている)
  const blobPath = releaseBlobPath(version);
  let putResult;
  try {
    putResult = await putRelease(blobPath, buf);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        reason: "put_failed",
        message: `Blob put に失敗しました: ${String(e)}`,
      },
      { status: 500 },
    );
  }

  await db.insert(releases).values({
    version,
    blobPath: putResult.pathname,
    sha256: actualSha,
    sizeBytes: putResult.size,
    releaseNotesUrl,
    uploadedBy: guard.admin.userId,
  });

  await logAdminAction({
    adminId: guard.admin.userId,
    action: "upload_release",
    payload: {
      version,
      blobPath: putResult.pathname,
      sha256: actualSha,
      sizeBytes: putResult.size,
    },
  }).catch((e) => console.error("[upload_release] audit failed", e));

  return NextResponse.json({
    ok: true,
    version,
    blobPath: putResult.pathname,
    sha256: actualSha,
    sizeBytes: putResult.size,
  });
}
