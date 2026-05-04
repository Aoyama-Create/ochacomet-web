// Auth.js v5 のセッション・JWT・User 型を OchaComet 用に拡張する。
// 参照: app 内で `session.user.tier` 等にアクセスするため。
import "next-auth";
import "next-auth/jwt";

type UserTier = "free" | "pro" | "friend" | "banned";
type ProStatus = "trialing" | "active" | "past_due" | "cancelled" | null;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      tier: UserTier;
      proStatus: ProStatus;
      isAdmin: boolean;
      emailVerifiedAt: string | null;
    };
  }

  interface User {
    id?: string;
    email?: string | null;
    tier?: UserTier;
    proStatus?: ProStatus;
    isAdmin?: boolean;
    emailVerifiedAt?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    tier?: UserTier;
    proStatus?: ProStatus;
    isAdmin?: boolean;
    emailVerifiedAt?: string | null;
  }
}
