// マーケティングメールの同意 (users.email_optin_marketing) を切り替える。
// サインアップ (lib/auth/signup.ts) とプロフィール編集の両方から使う。
//
// 背景: cron は optin が false のとき campaign_subscriptions を
// status='unsubscribed' に「恒久マーク」する (app/api/cron/email-campaign/route.ts)。
// そのため、後から同意しても何も起きないという状態が続いていた。
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignSubscriptions, users } from "@/db/schema";

/**
 * 同意を ON にしたときに、止まっていたキャンペーンを再開する。
 *
 * 全部を戻すことはしない。next_send_at を過ぎている行を戻すと、
 * 期限切れのフレンドコードの催促がまとめて届いてしまうため、
 * **送信予定がまだ未来の行だけ** を pending に戻す。
 *
 * @returns 再開した購読の件数
 */
export async function resumeMarketingCampaigns(
  userId: number,
  now: Date = new Date(),
): Promise<number> {
  const resumed = await db
    .update(campaignSubscriptions)
    .set({ status: "pending", updatedAt: now })
    .where(
      and(
        eq(campaignSubscriptions.userId, userId),
        eq(campaignSubscriptions.status, "unsubscribed"),
        gt(campaignSubscriptions.nextSendAt, now),
      ),
    )
    .returning({ id: campaignSubscriptions.id });

  return resumed.length;
}

/**
 * 同意フラグを更新する。false → true のときだけキャンペーンを再開する。
 * 値が変わらない場合は何もしない。
 */
export async function setMarketingOptin(
  userId: number,
  optin: boolean,
  now: Date = new Date(),
): Promise<void> {
  const [current] = await db
    .select({ optin: users.emailOptinMarketing })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!current || current.optin === optin) return;

  await db
    .update(users)
    .set({ emailOptinMarketing: optin, updatedAt: now })
    .where(eq(users.id, userId));

  if (optin) {
    await resumeMarketingCampaigns(userId, now);
  }
}
