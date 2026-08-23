// /api/cron/purge-audit-logs
//
// 保持期間を過ぎた監査ログを削除する日次ジョブ。
// 保持日数は lib/audit.ts の RETENTION_DAYS が単一の情報源で、
// プライバシーポリシー 第 9 条 2 項に同じ数字が書いてある。
//
// なぜ要るか: 以前はこのジョブが存在しないのに、プライバシーポリシーが
// 「監査ログは原則 1 年間保持し、それ以降は自動削除されます」と書いていた。
// download_audit には IP アドレスと User-Agent が入るので、無期限に貯まり続けていた。
//
// 認証: Authorization: Bearer <CRON_SECRET>
// レスポンス例: { "ok": true, "deleted": { "downloadAudit": 12, "adminActions": 0, "emailSendLog": 3 } }
import { NextResponse } from "next/server";
import { purgeAuditLogs, RETENTION_DAYS } from "@/lib/audit";

// 溜まった分をまとめて消す初回は時間がかかりうるので伸ばしておく。
export const maxDuration = 60;

function checkAuthorization(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false; // secret 未設定なら常に拒否 (fail-closed)
  const got = req.headers.get("authorization") ?? "";
  return got === `Bearer ${expected}`;
}

async function purge(): Promise<Response> {
  try {
    const deleted = await purgeAuditLogs(new Date());
    return NextResponse.json({ ok: true, deleted, retentionDays: RETENTION_DAYS });
  } catch (e) {
    console.error("[cron] purge-audit-logs failed", e);
    return NextResponse.json({ error: "purge_failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!checkAuthorization(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return purge();
}

// Vercel Cron の挙動依存で GET 呼び出しもサポート (Authorization は同じ)。
export async function GET(req: Request) {
  if (!checkAuthorization(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return purge();
}
