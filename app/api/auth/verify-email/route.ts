// /api/auth/verify-email
//
// GET ?token=XXX → ブラウザのリンク互換 (本来のメールリンクは /verify-email を使うが、
//                  Bruno / curl からのテスト用にも提供)。
// POST { token }  → JSON 経由でも消費可能。
//
// 200: { ok: true, email }
// 4xx: { ok: false, reason: 'missing' | 'invalid_or_expired' | 'user_missing' }
import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/auth/verifyEmail";

async function handle(token: string | null) {
  const result = await consumeVerificationToken(token ?? "");
  return NextResponse.json(result, {
    status: result.ok
      ? 200
      : result.reason === "user_missing"
        ? 404
        : 400,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return handle(url.searchParams.get("token"));
}

export async function POST(req: Request) {
  let body: { token?: unknown } = {};
  try {
    body = (await req.json()) as { token?: unknown };
  } catch {
    /* empty body も許容 (handle で missing 判定) */
  }
  const token = typeof body.token === "string" ? body.token : null;
  return handle(token);
}
