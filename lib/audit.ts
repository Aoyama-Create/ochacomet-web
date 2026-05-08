// download_audit と admin_actions への書き込みヘルパ。
// 失敗してもアプリ側のレスポンスをブロックしないよう、呼び元では `.catch(...)` で握る。
import { db } from "@/lib/db";
import { adminActions, downloadAudit } from "@/db/schema";

export async function logDownload(entry: {
  userId: number;
  version: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<void> {
  await db.insert(downloadAudit).values({
    userId: entry.userId,
    version: entry.version,
    ip: entry.ip ?? null,
    userAgent: entry.userAgent ?? null,
  });
}

export async function logAdminAction(entry: {
  adminId: number;
  targetUserId?: number;
  action: string;
  note?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(adminActions).values({
    adminId: entry.adminId,
    targetUserId: entry.targetUserId ?? null,
    action: entry.action,
    note: entry.note ?? null,
    payload: entry.payload ?? null,
  });
}

/** Vercel の x-forwarded-for から最初の IP を取り出す。形式が壊れていれば null。*/
export function clientIpFromHeaders(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (!xff) return null;
  const first = xff.split(",")[0]?.trim();
  return first || null;
}
