// /admin/users の Server Action。
// app/admin/users/[id]/actions.ts と同じ型: 薄いラッパで、実処理は lib/ のドメイン関数。
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { deleteUserAccount } from "@/lib/account/deleteUser";

export type DeleteUserFormState = { ok: boolean; message?: string };

export async function deleteUserAction(
  targetUserId: number,
  _prev: DeleteUserFormState | undefined,
  formData: FormData,
): Promise<DeleteUserFormState> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, message: "権限がありません。" };

  // 確認ステップを踏まずに POST が飛んできたら受け付けない。
  if (formData.get("confirm") !== "delete") {
    return { ok: false, message: "確認が必要です。" };
  }

  if (targetUserId === guard.admin.userId) {
    return { ok: false, message: "自分自身は削除できません。" };
  }

  const result = await deleteUserAccount({
    userId: targetUserId,
    byAdminId: guard.admin.userId,
  });
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true, message: "削除しました。" };
}
