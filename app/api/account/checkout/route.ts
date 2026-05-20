// POST /api/account/checkout
//
// 認証必須。`{ variant: 'monthly' | 'yearly' }` を受け取り、Lemon Squeezy の
// Checkouts API でユーザー固有の signed URL を発行 → クライアントはこの URL に遷移する。
//
// 200: { ok: true, url: <checkout_url> }
// 4xx: { ok: false, reason, message }
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCheckoutUrl, resolveVariantId } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

type Body = { variant?: unknown };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated", message: "ログインが必要です。" },
      { status: 401 },
    );
  }
  if (session.user.tier === "banned") {
    return NextResponse.json(
      { ok: false, reason: "banned", message: "アカウントが停止されています。" },
      { status: 403 },
    );
  }
  if (!session.user.emailVerifiedAt) {
    return NextResponse.json(
      {
        ok: false,
        reason: "email_not_verified",
        message: "メール認証が完了していません。",
      },
      { status: 403 },
    );
  }

  let body: Body = {};
  try {
    if (req.headers.get("content-length") !== "0") {
      body = (await req.json()) as Body;
    }
  } catch {
    /* empty body は許可 */
  }
  const variant =
    body.variant === "monthly" || body.variant === "yearly"
      ? body.variant
      : null;
  if (!variant) {
    return NextResponse.json(
      {
        ok: false,
        reason: "bad_variant",
        message: "variant は 'monthly' または 'yearly' を指定してください。",
      },
      { status: 400 },
    );
  }

  const variantId = resolveVariantId(variant);
  if (!variantId) {
    return NextResponse.json(
      {
        ok: false,
        reason: "variant_not_configured",
        message: `${variant} の Variant ID が未設定です (env LEMONSQUEEZY_VARIANT_ID_${variant.toUpperCase()})。`,
      },
      { status: 500 },
    );
  }

  try {
    const url = await createCheckoutUrl({
      variantId,
      email: session.user.email,
      userId: Number(session.user.id),
      variantTag: variant,
    });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[checkout] createCheckoutUrl failed", e);
    return NextResponse.json(
      {
        ok: false,
        reason: "ls_error",
        message: "チェックアウト URL の発行に失敗しました。",
      },
      { status: 502 },
    );
  }
}
