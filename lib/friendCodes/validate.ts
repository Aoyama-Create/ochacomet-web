// 拡張から叩かれるフレンドコード検証ロジック。
// /api/codes/validate?code=XXX のレスポンス整形のもと。
//
// レスポンス契約 (設計書 01 §4.1):
//   有効: { valid: true, expires: ISO8601 }
//   無効: { valid: false, reason: "expired" | "not_found" }
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { friendCodes, users } from "@/db/schema";
import { isFriendCodeFormatValid, normalizeFriendCode } from "./generate";

export type ValidateFriendCodeResult =
  | { valid: true; expires: string }
  | { valid: false; reason: "expired" | "not_found" };

export async function validateFriendCode(
  rawCode: string,
): Promise<ValidateFriendCodeResult> {
  const code = normalizeFriendCode(rawCode);
  if (!isFriendCodeFormatValid(code)) {
    return { valid: false, reason: "not_found" };
  }

  const [row] = await db
    .select({
      id: friendCodes.id,
      issuedToUserId: friendCodes.issuedToUserId,
      expiresAt: friendCodes.expiresAt,
      activatedAt: friendCodes.activatedAt,
      status: friendCodes.status,
    })
    .from(friendCodes)
    .where(
      and(
        eq(friendCodes.code, code),
        // revoked は弾く。expired は status 列が遅れて立つ可能性があるので時刻で判定
        eq(friendCodes.status, "active"),
      ),
    )
    .limit(1);

  if (!row) {
    return { valid: false, reason: "not_found" };
  }

  const now = new Date();
  if (row.expiresAt <= now) {
    // 状態を expired に格上げしておく (副作用)
    await db
      .update(friendCodes)
      .set({ status: "expired" })
      .where(eq(friendCodes.id, row.id));
    return { valid: false, reason: "expired" };
  }

  // 初回適用なら activatedAt をセット (UI で「適用済」表示する用、列挙には影響なし)
  if (!row.activatedAt) {
    await db
      .update(friendCodes)
      .set({ activatedAt: now })
      .where(eq(friendCodes.id, row.id));
  }

  // ユーザーが BAN されていたら無効として返す (信号噛み合わせ)
  const [target] = await db
    .select({ tier: users.tier })
    .from(users)
    .where(eq(users.id, row.issuedToUserId))
    .limit(1);
  if (!target || target.tier === "banned") {
    return { valid: false, reason: "not_found" };
  }

  return { valid: true, expires: row.expiresAt.toISOString() };
}
