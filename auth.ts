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

        const ok = await verifyPassword(password, row.passwordHash);
        if (!ok) return null;

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
