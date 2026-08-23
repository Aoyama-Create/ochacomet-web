// セルフ退会の Server Action。
//
// REST API ではなく Server Action にしてあるのは、退会がセッション破棄まで含めて
// 初めて完了するため。signOut は @/auth の export で、app/account/page.tsx が
// 既に Server Action として使っている。
"use server";

import { eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { deleteUserAccount } from "@/lib/account/deleteUser";

export type DeleteAccountFormState = { ok: boolean; error?: string };

export async function deleteAccountAction(
  _prev: DeleteAccountFormState | undefined,
  formData: FormData,
): Promise<DeleteAccountFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "ログインが必要です。" };
  }
  const userId = Number(session.user.id);

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { ok: false, error: "パスワードを入力してください。" };
  }

  // 本人確認。セッションだけで消せると、放置された端末から退会させられてしまう。
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row?.passwordHash || !(await verifyPassword(password, row.passwordHash))) {
    return { ok: false, error: "パスワードが正しくありません。" };
  }

  const result = await deleteUserAccount({ userId });
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  // 監査行は書かない (lib/account/deleteUser.ts のコメント参照)。
  console.log("[account] self-deleted", { userId });

  // signOut は内部で redirect を投げるので、この行より後には到達しない。
  await signOut({ redirectTo: "/?deleted=1" });
  return { ok: true };
}
