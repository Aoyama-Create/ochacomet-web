// admin 専用 API / Server Component で session を確認する共通ヘルパ。
// Auth.js v5 のセッションは JWT に `isAdmin` を持たせている (auth.config.ts callbacks 参照)。
import { auth } from "@/auth";

export type AdminContext = {
  userId: number;
  email: string;
  isAdmin: true;
};

export type RequireAdminResult =
  | { ok: true; admin: AdminContext }
  | { ok: false; status: 401 | 403; reason: "unauthenticated" | "forbidden" };

export async function requireAdmin(): Promise<RequireAdminResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, reason: "unauthenticated" };
  }
  if (!session.user.isAdmin) {
    return { ok: false, status: 403, reason: "forbidden" };
  }
  return {
    ok: true,
    admin: {
      userId: Number(session.user.id),
      email: session.user.email ?? "",
      isAdmin: true,
    },
  };
}
