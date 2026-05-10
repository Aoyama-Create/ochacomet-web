// POST /api/cron/email-campaign
//
// Vercel Cron が日次 (vercel.json で 09:00 JST = 00:00 UTC に登録) で叩く。
// `friend_received` キャンペーンの `next_send_at <= NOW()` を抽出して送信し、
// step を 1 進める。設計書 09 §5 準拠。
//
// 認証:
//   Authorization: Bearer <CRON_SECRET>
//   (Vercel Cron は自動で `Authorization: Bearer $CRON_SECRET` を付与する)
//
// レスポンス:
//   { ok: true, processed: <件数>, sent: <成功>, failed: <失敗>, skipped: <件数> }
import { NextResponse } from "next/server";
import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  campaignSubscriptions,
  emailSendLog,
  friendCodes,
  users,
} from "@/db/schema";
import {
  FRIEND_RECEIVED_STEPS,
  computeNextSendAt,
  isFriendReceivedCompleted,
} from "@/lib/campaign";
import { sendFriendStepEmail } from "@/lib/email";
import { buildUnsubscribeUrl } from "@/lib/unsubscribeToken";

export const runtime = "nodejs";
// 1 回の cron で大きなバッチを処理する可能性があるので timeout を伸ばす
export const maxDuration = 60;

const CAMPAIGN_KEY = "friend_received";
const BATCH_SIZE = 100;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.AUTH_URL ??
  "https://ochacomet.aoyamacreate.com";

function checkAuthorization(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization") ?? "";
  return got === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!checkAuthorization(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return processCampaign();
}

// Vercel Cron の挙動依存で GET 呼び出しもサポート (Authorization は同じ)。
export async function GET(req: Request) {
  if (!checkAuthorization(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return processCampaign();
}

async function processCampaign(): Promise<Response> {
  const now = new Date();

  // 抽出: pending かつ送信時刻が来たもの
  const due = await db
    .select({
      subId: campaignSubscriptions.id,
      userId: campaignSubscriptions.userId,
      currentStep: campaignSubscriptions.currentStep,
      referenceId: campaignSubscriptions.referenceId,
      email: users.email,
      tier: users.tier,
      optin: users.emailOptinMarketing,
    })
    .from(campaignSubscriptions)
    .innerJoin(users, eq(users.id, campaignSubscriptions.userId))
    .where(
      and(
        eq(campaignSubscriptions.campaignKey, CAMPAIGN_KEY),
        eq(campaignSubscriptions.status, "pending"),
        isNotNull(campaignSubscriptions.nextSendAt),
        lte(campaignSubscriptions.nextSendAt, now),
      ),
    )
    .limit(BATCH_SIZE);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of due) {
    const stepIndex = row.currentStep;
    const step = FRIEND_RECEIVED_STEPS[stepIndex];
    if (!step) {
      // step out of range → completed としてマーク
      await db
        .update(campaignSubscriptions)
        .set({ status: "completed", updatedAt: now })
        .where(eq(campaignSubscriptions.id, row.subId));
      skipped += 1;
      continue;
    }

    // step 0 は発行時 transactional で送信済なので cron は次の step (1) から進める
    if (stepIndex === 0) {
      await advanceToNextStep(row.subId, row.referenceId, 1, now);
      skipped += 1;
      continue;
    }

    if (row.tier === "banned" || !row.optin) {
      // BAN または marketing optin が外れている → unsubscribed として終了
      await db
        .update(campaignSubscriptions)
        .set({ status: "unsubscribed", updatedAt: now })
        .where(eq(campaignSubscriptions.id, row.subId));
      skipped += 1;
      continue;
    }

    // referenceId は friend_codes.id (string)。code/expiresAt を取りに行く
    const friendCodeId = parseInt(row.referenceId ?? "", 10);
    if (!Number.isInteger(friendCodeId)) {
      console.error("[cron] invalid referenceId", row);
      skipped += 1;
      continue;
    }
    const [fc] = await db
      .select({
        code: friendCodes.code,
        expiresAt: friendCodes.expiresAt,
        durationDays: friendCodes.durationDays,
        createdAt: friendCodes.createdAt,
        status: friendCodes.status,
      })
      .from(friendCodes)
      .where(eq(friendCodes.id, friendCodeId))
      .limit(1);
    if (!fc || fc.status === "revoked") {
      // revoke 済 → 送信停止
      await db
        .update(campaignSubscriptions)
        .set({ status: "completed", updatedAt: now })
        .where(eq(campaignSubscriptions.id, row.subId));
      skipped += 1;
      continue;
    }

    const daysRemaining = Math.ceil(
      (fc.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );

    // email_send_log を冪等性のため UNIQUE で先に立てる (uniq_send_attempt)
    let logId: number | null = null;
    try {
      const [logRow] = await db
        .insert(emailSendLog)
        .values({
          userId: row.userId,
          campaignKey: CAMPAIGN_KEY,
          step: stepIndex,
          status: "queued",
        })
        .returning({ id: emailSendLog.id });
      logId = logRow.id;
    } catch {
      // すでに同じ step の log がある = 過去に送信試行済 → 二重送信防止
      skipped += 1;
      continue;
    }

    const unsubscribeUrl = buildUnsubscribeUrl(
      APP_URL,
      row.userId,
      CAMPAIGN_KEY,
    );

    let sendResult;
    try {
      sendResult = await sendFriendStepEmail(
        { email: row.email },
        stepIndex,
        {
          code: fc.code,
          expiresAt: fc.expiresAt,
          daysRemaining,
          unsubscribeUrl,
        },
      );
    } catch (e) {
      sendResult = { ok: false as const, error: String(e) };
    }

    if (sendResult.ok) {
      await db
        .update(emailSendLog)
        .set({
          status: "sent",
          brevoMessageId: sendResult.messageId || null,
          sentAt: now,
          updatedAt: now,
        })
        .where(eq(emailSendLog.id, logId));
      await advanceToNextStep(
        row.subId,
        row.referenceId,
        stepIndex + 1,
        now,
        fc.createdAt,
        fc.durationDays,
      );
      sent += 1;
    } else {
      await db
        .update(emailSendLog)
        .set({
          status: "failed",
          errorMessage: sendResult.error,
          updatedAt: now,
        })
        .where(eq(emailSendLog.id, logId));
      // 失敗時は next_send_at を 30 分後にリトライ
      await db
        .update(campaignSubscriptions)
        .set({
          nextSendAt: new Date(now.getTime() + 30 * 60 * 1000),
          updatedAt: now,
        })
        .where(eq(campaignSubscriptions.id, row.subId));
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: due.length,
    sent,
    failed,
    skipped,
  });
}

/**
 * subscription を nextStepIndex に進める。
 * 次の step が無ければ completed に。
 */
async function advanceToNextStep(
  subId: number,
  referenceId: string | null,
  nextStepIndex: number,
  now: Date,
  issuedAt?: Date,
  durationDays?: number,
): Promise<void> {
  if (isFriendReceivedCompleted(nextStepIndex)) {
    await db
      .update(campaignSubscriptions)
      .set({ status: "completed", currentStep: nextStepIndex, updatedAt: now })
      .where(eq(campaignSubscriptions.id, subId));
    return;
  }

  // issuedAt と durationDays が渡ってない場合は friend_codes から取り直す
  let baseAt = issuedAt;
  let dur = durationDays;
  if (!baseAt || !dur) {
    const fcId = parseInt(referenceId ?? "", 10);
    if (Number.isInteger(fcId)) {
      const [fc] = await db
        .select({
          createdAt: friendCodes.createdAt,
          durationDays: friendCodes.durationDays,
        })
        .from(friendCodes)
        .where(eq(friendCodes.id, fcId))
        .limit(1);
      if (fc) {
        baseAt = fc.createdAt;
        dur = fc.durationDays;
      }
    }
  }
  if (!baseAt || !dur) {
    // referenceId が壊れている → 送信不可、completed にする
    await db
      .update(campaignSubscriptions)
      .set({ status: "completed", currentStep: nextStepIndex, updatedAt: now })
      .where(eq(campaignSubscriptions.id, subId));
    return;
  }

  const next = computeNextSendAt(baseAt, dur, nextStepIndex);
  await db
    .update(campaignSubscriptions)
    .set({
      currentStep: nextStepIndex,
      nextSendAt: next,
      updatedAt: now,
    })
    .where(eq(campaignSubscriptions.id, subId));
}

// 未使用 import 警告対策 (sql は将来 raw query に使う可能性あり、ひとまず明示参照)
void sql;
