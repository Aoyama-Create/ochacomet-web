// POST /api/account/profile
//
// 認証必須。名前 / 電話 / 住所を更新する。メールアドレスは編集不可なので受け付けない。
// 名前のみ必須、それ以外は空文字も許容 (= 未入力にできる)。
//
// 200: { ok: true }
// 4xx: { ok: false, reason, message }
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

const MAX_NAME = 80;
const MAX_PHONE = 32;
const MAX_POSTAL = 16;
const MAX_REGION = 64;
const MAX_CITY = 64;
const MAX_LINE = 128;

type Body = {
  displayName?: unknown;
  phone?: unknown;
  postalCode?: unknown;
  addressRegion?: unknown;
  addressCity?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
};

function pickString(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.slice(0, max);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
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

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad_json", message: "JSON ボディが必要です。" },
      { status: 400 },
    );
  }

  const displayName = pickString(body.displayName, MAX_NAME);
  if (!displayName) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing_name",
        message: "お名前を入力してください。",
      },
      { status: 400 },
    );
  }

  const phone = pickString(body.phone, MAX_PHONE) ?? "";
  const postalCode = pickString(body.postalCode, MAX_POSTAL) ?? "";
  const addressRegion = pickString(body.addressRegion, MAX_REGION) ?? "";
  const addressCity = pickString(body.addressCity, MAX_CITY) ?? "";
  const addressLine1 = pickString(body.addressLine1, MAX_LINE) ?? "";
  const addressLine2 = pickString(body.addressLine2, MAX_LINE) ?? "";

  // 空文字は null として保存する (DB 上は未設定として扱う)
  const orNull = (s: string): string | null => (s.length > 0 ? s : null);

  await db
    .update(users)
    .set({
      displayName,
      phone: orNull(phone),
      postalCode: orNull(postalCode),
      addressRegion: orNull(addressRegion),
      addressCity: orNull(addressCity),
      addressLine1: orNull(addressLine1),
      addressLine2: orNull(addressLine2),
      updatedAt: new Date(),
    })
    .where(eq(users.id, Number(session.user.id)));

  return NextResponse.json({ ok: true });
}
