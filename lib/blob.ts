// Vercel Blob ラッパ。本番では @vercel/blob を、ローカル dev では `tmp/blob/` 配下の
// ファイルシステムにフォールバックして同じ API を提供する (BLOB_READ_WRITE_TOKEN 未設定時)。
//
// 1st リリーススコープ: 配布用 ZIP の put / get / list / delete のみ。
//   put       → アップロード
//   getStream → DL エンドポイントから stream 取得
//   list      → /admin/releases の一覧
//   del       → ロールバック時に物理削除 (基本やらない)

import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

const HAS_VERCEL_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_BLOB_DIR = path.join(process.cwd(), "tmp", "blob");

/** Vercel Blob は private アクセスが access:'public' でも token なしでは見えない仕様。
 *  1st では access:'public' で put し、配信プロキシ (/api/download/*) でだけ URL を解決する。
 *  → 流出防止は URL を渡さないことで担保 (Brevo メール内に URL を入れないこと)。
 */
type PutResult = { url: string; pathname: string; size: number };

export async function putRelease(
  pathname: string,
  body: Buffer,
): Promise<PutResult> {
  if (HAS_VERCEL_BLOB) {
    const { put } = await import("@vercel/blob");
    const res = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return { url: res.url, pathname: res.pathname, size: body.byteLength };
  }
  // local fallback
  const abs = path.join(LOCAL_BLOB_DIR, pathname);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, body);
  return {
    url: `file://${abs}`,
    pathname,
    size: body.byteLength,
  };
}

export async function getReleaseStream(
  pathname: string,
): Promise<ReadableStream<Uint8Array>> {
  if (HAS_VERCEL_BLOB) {
    const { head } = await import("@vercel/blob");
    const meta = await head(pathname);
    const res = await fetch(meta.url);
    if (!res.ok || !res.body) {
      throw new Error(`Failed to fetch blob ${pathname}: ${res.status}`);
    }
    return res.body;
  }
  // local fallback: filesystem stream → Web ReadableStream
  const abs = path.join(LOCAL_BLOB_DIR, pathname);
  const node = (await import("node:fs")).createReadStream(abs);
  return Readable.toWeb(node) as unknown as ReadableStream<Uint8Array>;
}

export async function deleteRelease(pathname: string): Promise<void> {
  if (HAS_VERCEL_BLOB) {
    const { del } = await import("@vercel/blob");
    await del(pathname);
    return;
  }
  const abs = path.join(LOCAL_BLOB_DIR, pathname);
  await fs.rm(abs, { force: true });
}

/** リリース ZIP の Blob パスは規約で固定: `releases/ochacomet-v1.20.1.zip`。 */
export function releaseBlobPath(version: string): string {
  return `releases/ochacomet-v${version}.zip`;
}
