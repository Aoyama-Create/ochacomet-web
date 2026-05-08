// POST /api/admin/users/[id]/friend-code
// admin only. フレンドコードを発行する。
//
// Body (任意):
//   { durationDays?: number, note?: string }
//
// 200: { ok: true, code, expiresAt, friendCodeId }
// 4xx: { ok: false, reason, message }
import { NextResponse } from "next/server";
import { issueFriendCode } from "@/lib/friendCodes/issue";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

type Params = { id: string };
type Body = { durationDays?: unknown; note?: unknown };

const MIN_DURATION = 1;
const MAX_DURATION = 365;

export async function POST(
  req: Request,
  ctx: { params: Promise<Params> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: guard.status });
  }

  const { id: idRaw } = await ctx.params;
  const targetUserId = Number(idRaw);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  let body: Body = {};
  try {
    if (req.headers.get("content-length") !== "0") {
      body = (await req.json()) as Body;
    }
  } catch {
    /* empty body OK */
  }

  let durationDays: number | undefined;
  if (typeof body.durationDays === "number" && Number.isFinite(body.durationDays)) {
    durationDays = Math.floor(body.durationDays);
    if (durationDays < MIN_DURATION || durationDays > MAX_DURATION) {
      return NextResponse.json(
        {
          ok: false,
          reason: "bad_duration",
          message: `durationDays は ${MIN_DURATION}〜${MAX_DURATION} の範囲で指定してください。`,
        },
        { status: 400 },
      );
    }
  }
  const note = typeof body.note === "string" ? body.note : undefined;

  const result = await issueFriendCode({
    adminId: guard.admin.userId,
    targetUserId,
    durationDays,
    note,
  });

  if (!result.ok) {
    const status = result.reason === "user_not_found" ? 404 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    expiresAt: result.expiresAt.toISOString(),
    friendCodeId: result.friendCodeId,
  });
}
