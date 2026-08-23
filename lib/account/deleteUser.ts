// 退会 / アカウント削除の中核ロジック。
// セルフ退会 (app/account/delete/actions.ts) と
// 管理画面からの削除 (app/admin/users/actions.ts) の両方から呼ぶ。
//
// FK の前提 (db/migrations/0004_productive_lyja.sql で整えた):
//   cascade で一緒に消える … sessions / password_reset_tokens / friend_codes(issued_to)
//                            campaign_subscriptions / email_send_log / email_unsubscribe_log
//   SET NULL になる       … download_audit.user_id / admin_actions.target_user_id
//   no action のまま       … admin_actions.admin_id / friend_codes.issued_by_admin_id
//                            releases.uploaded_by  → 管理者は削除できない (下で弾く)
//
// verification_tokens は FK ではなく email 文字列で紐づいているので明示的に消す。
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminActions, users, verificationTokens } from "@/db/schema";

export type DeleteUserResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_found" | "is_admin" | "subscription_active";
      message: string;
    };

/** 解約手続きを先に済ませてもらう必要がある契約状態。 */
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["trialing", "active"]);

export async function deleteUserAccount(args: {
  userId: number;
  /** 管理者による削除ならその管理者の ID。セルフ退会では undefined。 */
  byAdminId?: number;
}): Promise<DeleteUserResult> {
  const [target] = await db
    .select({
      id: users.id,
      email: users.email,
      tier: users.tier,
      isAdmin: users.isAdmin,
      proStatus: users.proStatus,
    })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  if (!target) {
    return { ok: false, reason: "not_found", message: "対象のアカウントが見つかりません。" };
  }

  // 管理者は削除できない。releases.uploaded_by などの FK が no action のままなので
  // DB が拒否する。先に弾いて分かりやすいメッセージを返す。
  if (target.isAdmin) {
    return {
      ok: false,
      reason: "is_admin",
      message:
        "管理者アカウントは削除できません。先に管理者権限を外してください。",
    };
  }

  // 契約中の削除を許すと、アカウントだけ消えて Stripe の課金が続く。
  // 利用規約 第 16 条 3 項が「退会とは別に解約手続が必要」と定めているので、
  // その順序を実装側で強制する。
  if (target.proStatus && ACTIVE_SUBSCRIPTION_STATUSES.has(target.proStatus)) {
    return {
      ok: false,
      reason: "subscription_active",
      message:
        "有料プランの契約中です。先に解約手続きを完了してから退会してください。",
    };
  }

  await db.transaction(async (tx) => {
    // 管理者による削除は監査に残す。target_user_id は SET NULL で消えるので、
    // 誰を消したのかは payload のスナップショットで辿る。
    //
    // セルフ退会では書かない。admin_id は NOT NULL かつ FK が no action なので、
    // 自分自身を admin_id に書くと、その行が自分の削除をブロックしてしまう。
    if (args.byAdminId !== undefined) {
      await tx.insert(adminActions).values({
        adminId: args.byAdminId,
        action: "delete_user",
        payload: {
          deletedUserId: target.id,
          email: target.email,
          tier: target.tier,
        },
      });
    }

    await tx
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, target.email));

    await tx.delete(users).where(eq(users.id, target.id));
  });

  return { ok: true };
}
