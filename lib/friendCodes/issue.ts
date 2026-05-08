// 管理者がフレンドコードを発行する一連の処理。
// 設計書 07 §10 + 09 §3.4 に準拠。
//
// 1 トランザクションで:
//   - friend_codes 台帳に 1 行 INSERT (UNIQUE 衝突時は最大 5 回リトライ)
//   - users.tier='friend' / friend_code / friend_expires_at を更新
//   - admin_actions に監査ログ
//   - campaign_subscriptions に friend_received を upsert (current_step=0, next_send_at=NOW)

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adminActions,
  campaignSubscriptions,
  friendCodes,
  users,
} from "@/db/schema";
import { generateFriendCode } from "./generate";

const DEFAULT_DURATION_DAYS = 30;
const MAX_INSERT_RETRY = 5;

export type IssueFriendCodeArgs = {
  adminId: number;
  targetUserId: number;
  durationDays?: number;
  note?: string;
};

export type IssueFriendCodeResult =
  | {
      ok: true;
      code: string;
      expiresAt: Date;
      friendCodeId: number;
    }
  | {
      ok: false;
      reason: "user_not_found" | "user_banned" | "internal_error";
      message: string;
    };

export async function issueFriendCode(
  args: IssueFriendCodeArgs,
): Promise<IssueFriendCodeResult> {
  const durationDays = args.durationDays ?? DEFAULT_DURATION_DAYS;
  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );

  // 対象ユーザー存在チェック (banned は弾く)
  const [target] = await db
    .select({ id: users.id, tier: users.tier, email: users.email })
    .from(users)
    .where(eq(users.id, args.targetUserId))
    .limit(1);
  if (!target) {
    return {
      ok: false,
      reason: "user_not_found",
      message: "対象ユーザーが存在しません。",
    };
  }
  if (target.tier === "banned") {
    return {
      ok: false,
      reason: "user_banned",
      message: "対象ユーザーは BAN されています。",
    };
  }

  // friend_codes 台帳に挿入 (UNIQUE 衝突時はコード再生成)
  let attempt = 0;
  let code = "";
  let friendCodeId = 0;
  while (attempt < MAX_INSERT_RETRY) {
    code = generateFriendCode();
    try {
      const [row] = await db
        .insert(friendCodes)
        .values({
          code,
          issuedToUserId: args.targetUserId,
          issuedByAdminId: args.adminId,
          durationDays,
          expiresAt,
          status: "active",
          note: args.note ?? null,
        })
        .returning({ id: friendCodes.id });
      friendCodeId = row.id;
      break;
    } catch (e) {
      attempt += 1;
      if (attempt >= MAX_INSERT_RETRY) {
        console.error("[issueFriendCode] insert retries exhausted", e);
        return {
          ok: false,
          reason: "internal_error",
          message: "フレンドコードの発行に失敗しました。",
        };
      }
    }
  }

  // users 更新
  await db
    .update(users)
    .set({
      tier: "friend",
      proSource: "friend_code",
      friendCode: code,
      friendExpiresAt: expiresAt,
      updatedAt: issuedAt,
    })
    .where(eq(users.id, args.targetUserId));

  // admin_actions
  await db.insert(adminActions).values({
    adminId: args.adminId,
    targetUserId: args.targetUserId,
    action: "issue_friend_code",
    note: args.note ?? null,
    payload: {
      friendCodeId,
      code,
      durationDays,
      expiresAt: expiresAt.toISOString(),
    },
  });

  // campaign_subscriptions に friend_received を upsert (1st では send 自動化はないが、
  // 後段の Phase 5 cron がそのまま使えるよう row だけ作っておく)
  await db
    .insert(campaignSubscriptions)
    .values({
      userId: args.targetUserId,
      campaignKey: "friend_received",
      currentStep: 0,
      nextSendAt: issuedAt,
      status: "pending",
      referenceId: String(friendCodeId),
    })
    .onConflictDoUpdate({
      target: [campaignSubscriptions.userId, campaignSubscriptions.campaignKey],
      set: {
        currentStep: 0,
        nextSendAt: issuedAt,
        status: "pending",
        referenceId: String(friendCodeId),
        updatedAt: issuedAt,
      },
    });

  return { ok: true, code, expiresAt, friendCodeId };
}
