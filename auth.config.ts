// Edge runtime (proxy.ts/旧 middleware.ts) からも import される設定。
// providers と DB アクセスは含めず、callbacks の token/session 整形だけ持つ。
// 完全版 (Credentials provider 付き) は auth.ts で定義する。
//
// Auth.js v5 Edge compatibility 推奨パターン:
//   https://authjs.dev/guides/edge-compatibility
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // auth.ts で Credentials を追加
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.tier = user.tier ?? "free";
        token.proStatus = user.proStatus ?? null;
        token.isAdmin = user.isAdmin ?? false;
        token.emailVerifiedAt = user.emailVerifiedAt ?? null;
      }
      if (trigger === "update" && session) {
        if (typeof session.tier !== "undefined") token.tier = session.tier;
        if (typeof session.emailVerifiedAt !== "undefined") {
          token.emailVerifiedAt = session.emailVerifiedAt;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id ?? "";
      session.user.tier = token.tier ?? "free";
      session.user.proStatus = token.proStatus ?? null;
      session.user.isAdmin = token.isAdmin ?? false;
      session.user.emailVerifiedAt = token.emailVerifiedAt ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
