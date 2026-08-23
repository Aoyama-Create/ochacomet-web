// download_audit と admin_actions への書き込みヘルパ。
// 失敗してもアプリ側のレスポンスをブロックしないよう、呼び元では `.catch(...)` で握る。
//
// 保存期間の削除もここに置く (監査テーブルへのアクセスは全部このファイル、という設計)。
import { lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminActions, downloadAudit, emailSendLog } from "@/db/schema";

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

/* ---------- 保存期間 (プライバシーポリシー 第 9 条) ---------- */

// この数字はプライバシーポリシー 第 9 条 2 項にそのまま書いてある。
// 変えるときは app/privacy/page.tsx も一緒に直すこと。
//
// download_audit を短めにしてあるのは、ここにだけ IP アドレスと User-Agent が
// 入るため。不正ダウンロードの調査に必要な期間だけ持って、あとは捨てる。
export const RETENTION_DAYS = {
  /** ダウンロード履歴 (IP / User-Agent を含む) */
  downloadAudit: 180,
  /** 管理操作の記録 */
  adminActions: 365,
  /** メール配信ログ */
  emailSendLog: 365,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function cutoff(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

export type PurgeResult = {
  downloadAudit: number;
  adminActions: number;
  emailSendLog: number;
};

/**
 * 保持期間を過ぎた監査ログを削除する。日次 cron (/api/cron/purge-audit-logs) から呼ぶ。
 *
 * 時刻の基準は各テーブルの created_at 系 (NOT NULL のもの) を使う。
 * email_send_log は sent_at が nullable で、送信されなかった行が永久に残るため
 * created_at を基準にする。
 *
 * campaign_subscriptions は消さない。cron はこのテーブルの current_step /
 * next_send_at で駆動しているので、消すとステップメールの進行状態が失われる。
 * (email_send_log を消しても uniq_send_attempt が消えるだけで、再送は起きない。)
 */
export async function purgeAuditLogs(now: Date = new Date()): Promise<PurgeResult> {
  const removedDownloads = await db
    .delete(downloadAudit)
    .where(lt(downloadAudit.downloadedAt, cutoff(now, RETENTION_DAYS.downloadAudit)))
    .returning({ id: downloadAudit.id });

  const removedAdminActions = await db
    .delete(adminActions)
    .where(lt(adminActions.createdAt, cutoff(now, RETENTION_DAYS.adminActions)))
    .returning({ id: adminActions.id });

  const removedSendLogs = await db
    .delete(emailSendLog)
    .where(lt(emailSendLog.createdAt, cutoff(now, RETENTION_DAYS.emailSendLog)))
    .returning({ id: emailSendLog.id });

  return {
    downloadAudit: removedDownloads.length,
    adminActions: removedAdminActions.length,
    emailSendLog: removedSendLogs.length,
  };
}

/** Vercel の x-forwarded-for から最初の IP を取り出す。形式が壊れていれば null。*/
export function clientIpFromHeaders(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (!xff) return null;
  const first = xff.split(",")[0]?.trim();
  return first || null;
}
