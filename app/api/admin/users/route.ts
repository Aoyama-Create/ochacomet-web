// GET /api/admin/users?q=<email substring>&limit=50
// admin only. ユーザー一覧 (検索可)。
import { NextResponse } from "next/server";
import { ilike, desc, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.reason },
      { status: guard.status },
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "", 10) || DEFAULT_LIMIT,
    MAX_LIMIT,
  );

  const baseSelect = {
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    phone: users.phone,
    tier: users.tier,
    proStatus: users.proStatus,
    friendCode: users.friendCode,
    friendExpiresAt: users.friendExpiresAt,
    isAdmin: users.isAdmin,
    emailVerifiedAt: users.emailVerifiedAt,
    createdAt: users.createdAt,
  };

  const rows = q
    ? await db
        .select(baseSelect)
        .from(users)
        .where(
          or(
            ilike(users.email, `%${q}%`),
            ilike(users.displayName, `%${q}%`),
          ),
        )
        .orderBy(desc(users.createdAt))
        .limit(limit)
    : await db
        .select(baseSelect)
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit);

  return NextResponse.json({ ok: true, users: rows });
}
