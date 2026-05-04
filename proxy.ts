// Next.js 16 proxy (旧 middleware.ts)。Edge runtime で動くため、auth.ts ではなく
// auth.config.ts (Edge 互換、providers なし) を直接 NextAuth に渡して `auth()` を取り出す。
//
// JWT に DB から書き込んだ tier/isAdmin が乗っている前提で、ここでは DB アクセスしない。
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/account", "/admin"];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const requiresAuth = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  if (!requiresAuth) return NextResponse.next();

  if (!req.auth?.user?.id) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/admin") && !req.auth.user.isAdmin) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp)$).*)",
  ],
};
