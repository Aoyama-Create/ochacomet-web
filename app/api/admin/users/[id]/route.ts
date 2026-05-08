// GET /api/admin/users/[id]
// admin only. 指定ユーザーの詳細 + 過去の friend_codes 履歴を返す。
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { friendCodes, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

type Params = { id: string };

export async function GET(
  _req: Request,
  ctx: { params: Promise<Params> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: guard.status });
  }

  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      tier: users.tier,
      proStatus: users.proStatus,
      proSource: users.proSource,
      friendCode: users.friendCode,
      friendExpiresAt: users.friendExpiresAt,
      isAdmin: users.isAdmin,
      emailVerifiedAt: users.emailVerifiedAt,
      emailOptinMarketing: users.emailOptinMarketing,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const codes = await db
    .select({
      id: friendCodes.id,
      code: friendCodes.code,
      durationDays: friendCodes.durationDays,
      expiresAt: friendCodes.expiresAt,
      activatedAt: friendCodes.activatedAt,
      revokedAt: friendCodes.revokedAt,
      status: friendCodes.status,
      note: friendCodes.note,
      createdAt: friendCodes.createdAt,
    })
    .from(friendCodes)
    .where(eq(friendCodes.issuedToUserId, id))
    .orderBy(desc(friendCodes.createdAt))
    .limit(20);

  return NextResponse.json({ ok: true, user, friendCodes: codes });
}
