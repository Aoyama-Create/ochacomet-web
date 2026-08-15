// Next.js 16 proxy (旧 middleware.ts)。Edge runtime で動くため、auth.ts ではなく
// auth.config.ts (Edge 互換、providers なし) を直接 NextAuth に渡して `auth()` を取り出す。
//
// アクセス制御 (セキュリティ・チェックリスト §1):
//   §1a ベーシック認証: /admin・/api/admin へのアクセスを env の資格情報で制限
//   §1b 二段階認証     : /admin・/api/admin は admin_2fa クッキー必須
//                        (/admin/verify と /api/admin/2fa は除外＝クッキー取得経路)
//   既存               : /account・/admin はログイン必須、/admin は isAdmin 必須
//
// JWT に DB から書き込んだ isAdmin が乗っている前提で、ここでは DB アクセスしない。
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { ADMIN_2FA_COOKIE, verifyAdmin2faToken } from "@/lib/admin2faCookie";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/account", "/admin"];

// ログイン済みなら見せる意味が無いページ。
// **/verify-email* は入れない。** メール未認証のログイン中ユーザーが認証リンクを
// 踏む経路であり、ここを塞ぐと認証を完了できなくなる。
const AUTH_ONLY_PAGES = ["/login", "/signup"];

/**
 * ログイン済みユーザーを /login /signup から追い出すときの行き先。
 *
 * callbackUrl があればそれを尊重する（/account/download を開こうとして /login に
 * 飛ばされた人を /account に流すと、行きたかった場所を捨ててしまうため）。
 *
 * ただし **callbackUrl をそのまま使うとオープンリダイレクトになる**。
 * `?callbackUrl=https://evil.example` を踏ませると外部サイトへ飛ばせてしまうので、
 * 自サイト内の相対パス（`/` 始まり、かつ `//` で始まらない）だけを許可する。
 */
function safeCallbackUrl(raw: string | null): string {
  if (!raw) return "/account";
  if (!raw.startsWith("/")) return "/account"; // 絶対 URL・スキーム付きを弾く
  if (raw.startsWith("//")) return "/account"; // プロトコル相対 (//evil.example) を弾く
  return raw;
}

function isAdminArea(path: string): boolean {
  return (
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/api/admin")
  );
}

// クッキー取得のために 2FA 不要でアクセスさせる経路
function is2faExempt(path: string): boolean {
  return path.startsWith("/admin/verify") || path.startsWith("/api/admin/2fa");
}

// §1a: ベーシック認証。env 未設定 (dev) はスキップ。
function passesBasicAuth(header: string | null): boolean {
  const user = process.env.ADMIN_BASIC_USER;
  const pass = process.env.ADMIN_BASIC_PASS;
  if (!user || !pass) return true;
  if (!header || !header.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const idx = decoded.indexOf(":");
  if (idx < 0) return false;
  return decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass;
}

export default auth(async (req) => {
  const path = req.nextUrl.pathname;
  const adminApi = path.startsWith("/api/admin");

  // §1a ベーシック認証 (最前段)
  if (isAdminArea(path) && !passesBasicAuth(req.headers.get("authorization"))) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="OchaComet Admin"' },
    });
  }

  // ログイン済みなら登録フローは見せない (紛らわしいため)
  if (AUTH_ONLY_PAGES.includes(path) && req.auth?.user?.id) {
    const to = safeCallbackUrl(req.nextUrl.searchParams.get("callbackUrl"));
    return NextResponse.redirect(new URL(to, req.url));
  }

  const requiresAuth = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  if (!requiresAuth && !adminApi) return NextResponse.next();

  // ログイン必須
  if (!req.auth?.user?.id) {
    if (adminApi) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // 管理者のみ
  if ((path.startsWith("/admin") || adminApi) && !req.auth.user.isAdmin) {
    if (adminApi) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // §1b 二段階認証 (admin_2fa クッキー)
  if (isAdminArea(path) && !is2faExempt(path)) {
    const token = req.cookies.get(ADMIN_2FA_COOKIE)?.value;
    const ok = await verifyAdmin2faToken(token, req.auth.user.id);
    if (!ok) {
      if (adminApi) {
        return NextResponse.json({ error: "2fa_required" }, { status: 401 });
      }
      const url = new URL("/admin/verify", req.url);
      url.searchParams.set("callbackUrl", path + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

// 認証が必要な経路だけで動かす。
//
// 以前は「静的アセット以外の全パス」にマッチしていたため、トップページや規約ページでも
// Edge で JWT 復号が走っていた。公開ページには不要なので外す。
//
// なお matcher は「どのパスでこの関数を動かすか」であって認可判定そのものではない。
// 判定側の PROTECTED_PREFIXES / isAdminArea は**そのまま残す**（二重に持つ）。
export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    // ログイン済みを追い出すためだけに通す。未ログイン時は next() で素通りするので
    // キャッシュ済みシェルの配信は維持される。
    "/login",
    "/signup",
  ],
};
