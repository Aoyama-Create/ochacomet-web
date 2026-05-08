// POST /api/auth/signup
// Body: { email, password, passwordConfirm? }
// 200: { ok: true, status: 'created' | 'already_verified' | 'resent' }
// 400: { ok: false, error: <code>, message: <ja message> }
//
// REST 化の動機: Bruno / curl から UI なしで動作確認するため。
// /signup ページの Server Action と同じ lib/auth/signup を呼ぶので挙動は一致。
import { NextResponse } from "next/server";
import { signup } from "@/lib/auth/signup";

export const runtime = "nodejs";

type Body = {
  email?: unknown;
  password?: unknown;
  passwordConfirm?: unknown;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "JSON ボディが必要です。" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const passwordConfirm =
    typeof body.passwordConfirm === "string" ? body.passwordConfirm : undefined;

  const result = await signup({ email, password, passwordConfirm });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result, { status: 200 });
}
