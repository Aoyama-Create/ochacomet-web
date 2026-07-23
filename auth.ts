// Auth.js v5 完全設定 (Node runtime)。auth.config.ts に Credentials provider を追加。
// 設計書 07 §4 準拠。banned ユーザーは authorize 時点で弾く。
//
// このファイルは middleware (Edge) からは import しない。
// Edge では auth.config.ts のみ使う (lib/db / lib/password が Node 専用のため)。
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "./auth.config";

// ログイン失敗ロックのしきい値 (チェックリスト §1c: 10 回以下で施錠)
const LOGIN_LOCK_THRESHOLD = 10;
const LOGIN_LOCK_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!row || !row.passwordHash) return null;
        if (row.tier === "banned") return null;

        // ログイン失敗ロック (チェックリスト §1c / §6)。ロック理由は明示しない。
        const now = new Date();
        if (row.lockoutUntil && row.lockoutUntil > now) return null;

        const ok = await verifyPassword(password, row.passwordHash);
        if (!ok) {
          const nextCount = (row.failedLoginCount ?? 0) + 1;
          // 10 回目の失敗でロック (15 分)
          const lockoutUntil =
            nextCount >= LOGIN_LOCK_THRESHOLD
              ? new Date(now.getTime() + LOGIN_LOCK_MINUTES * 60 * 1000)
              : null;
          await db
            .update(users)
            .set({ failedLoginCount: nextCount, lockoutUntil })
            .where(eq(users.id, row.id));
          return null;
        }

        // 成功: 失敗カウントとロックをリセット
        if (row.failedLoginCount !== 0 || row.lockoutUntil) {
          await db
            .update(users)
            .set({ failedLoginCount: 0, lockoutUntil: null })
            .where(eq(users.id, row.id));
        }

        return {
          id: String(row.id),
          email: row.email,
          tier: row.tier,
          proStatus: row.proStatus ?? null,
          isAdmin: row.isAdmin,
          emailVerifiedAt: row.emailVerifiedAt
            ? row.emailVerifiedAt.toISOString()
            : null,
        };
      },
    }),
  ],
});
