"use server";

import { revalidatePath } from "next/cache";
import { issueFriendCode } from "@/lib/friendCodes/issue";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export type IssueFriendCodeFormState = {
  ok: boolean;
  message?: string;
  code?: string;
  expiresAt?: string;
};

export async function issueFriendCodeAction(
  targetUserId: number,
  _prev: IssueFriendCodeFormState | undefined,
  formData: FormData,
): Promise<IssueFriendCodeFormState> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { ok: false, message: "権限がありません。" };
  }

  const durationRaw = formData.get("durationDays");
  const durationDays =
    typeof durationRaw === "string" && durationRaw.length > 0
      ? Number(durationRaw)
      : undefined;
  const note = String(formData.get("note") ?? "").trim() || undefined;

  const result = await issueFriendCode({
    adminId: guard.admin.userId,
    targetUserId,
    durationDays,
    note,
  });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath(`/admin/users/${targetUserId}`);
  revalidatePath("/admin/users");
  return {
    ok: true,
    code: result.code,
    expiresAt: result.expiresAt.toISOString(),
  };
}
