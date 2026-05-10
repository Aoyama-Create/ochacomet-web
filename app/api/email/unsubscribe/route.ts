// 1-click unsubscribe (RFC 8058) 対応エンドポイント。
//
// GET ?token=XXX  → 確認 UI なしで直接停止 (一部メールクライアントが推奨)
// POST           → メールクライアントの "List-Unsubscribe-Post: List-Unsubscribe=One-Click"
//                  からの自動 POST。body はあっても無くても処理は同じ。
//
// 200 OK + JSON or HTML を返す。
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  campaignSubscriptions,
  emailUnsubscribeLog,
  users,
} from "@/db/schema";
import { parseUnsubscribeToken } from "@/lib/unsubscribeToken";

export const runtime = "nodejs";

async function handle(token: string | null): Promise<Response> {
  const parsed = token ? parseUnsubscribeToken(token) : null;
  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 400 },
    );
  }
  const { userId, campaignKey } = parsed;
  const now = new Date();

  // users.email_optin_marketing = false (= 全マーケティング配信から離脱)
  // 設計意図: 個別 campaign の unsubscribe より、ユーザー単位で一括停止する方が安全。
  // 後で個別 ON/OFF が要求されたら campaign_subscriptions だけ status='unsubscribed' にする方針に切り替え。
  await db
    .update(users)
    .set({ emailOptinMarketing: false, updatedAt: now })
    .where(eq(users.id, userId));

  // 当該キャンペーンも止める
  await db
    .update(campaignSubscriptions)
    .set({ status: "unsubscribed", updatedAt: now })
    .where(eq(campaignSubscriptions.userId, userId));

  // 監査ログ
  await db.insert(emailUnsubscribeLog).values({
    userId,
    campaignKey,
    source: "one_click",
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  // ブラウザから直接アクセスした場合は確認ページにリダイレクト
  // (メールクライアントが先読みで GET を叩く問題を避ける)
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    const target = new URL(`/unsubscribe`, url);
    if (token) target.searchParams.set("token", token);
    return NextResponse.redirect(target);
  }
  return handle(token);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  return handle(token);
}
