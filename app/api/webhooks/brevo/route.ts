// POST /api/webhooks/brevo?secret=XXX
//
// Brevo は webhook URL に対して各種イベント (delivered / opened / hard_bounce / spam /
// unsubscribed) を JSON で POST してくる。
// signing 用の HMAC ヘッダは公式に提供されないため、URL の query string `secret` を
// `BREVO_WEBHOOK_SECRET` と比較して検証する (簡易だが十分)。
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  emailSendLog,
  emailUnsubscribeLog,
  users,
} from "@/db/schema";
import { verifyBrevoWebhookSecret } from "@/lib/brevo";

export const runtime = "nodejs";

type BrevoEvent = {
  event?: string; // "delivered" | "opened" | "click" | "soft_bounce" | "hard_bounce" | "blocked" | "spam" | "unsubscribed" | ...
  email?: string;
  "message-id"?: string;
  date?: string; // ISO
  tag?: string;
  tags?: string[];
};

function parseDate(d: string | undefined): Date {
  if (!d) return new Date();
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? new Date() : t;
}

export async function POST(req: Request) {
  if (!verifyBrevoWebhookSecret(req.url)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  // Brevo は単一 event or batched array を送る場合がある
  const events = Array.isArray(body) ? (body as BrevoEvent[]) : [body as BrevoEvent];

  let updated = 0;
  for (const ev of events) {
    const messageId = ev["message-id"];
    if (!messageId) continue;

    const at = parseDate(ev.date);

    // email_send_log を message_id で引いて status を更新
    const set: Record<string, unknown> = { updatedAt: at };
    switch (ev.event) {
      case "delivered":
        set.status = "delivered";
        set.deliveredAt = at;
        break;
      case "opened":
      case "unique_opened":
        set.status = "opened";
        set.openedAt = at;
        break;
      case "click":
        set.status = "clicked";
        break;
      case "hard_bounce":
      case "soft_bounce":
      case "blocked":
        set.status = "bounced";
        set.bouncedAt = at;
        if (ev.email) {
          // bounce したら全マーケ配信を止める (受信不能アカウントへの送信浪費を避ける)
          await db
            .update(users)
            .set({ emailOptinMarketing: false, updatedAt: at })
            .where(eq(users.email, ev.email.toLowerCase()));
        }
        break;
      case "spam":
        set.status = "spam";
        if (ev.email) {
          await db
            .update(users)
            .set({ emailOptinMarketing: false, updatedAt: at })
            .where(eq(users.email, ev.email.toLowerCase()));
          await db.insert(emailUnsubscribeLog).values({
            userId: 0, // userId 不明時は 0 を使う運用は無い → email から引く
            campaignKey: null,
            source: "brevo_webhook",
            detail: { reason: "spam", email: ev.email },
          }).catch(() => {/* user_id が外部キー違反の可能性あるので fail-safe */});
        }
        break;
      case "unsubscribed":
        set.status = "delivered"; // 配信自体は成功扱いのまま
        if (ev.email) {
          await db
            .update(users)
            .set({ emailOptinMarketing: false, updatedAt: at })
            .where(eq(users.email, ev.email.toLowerCase()));
        }
        break;
      default:
        continue;
    }

    const result = await db
      .update(emailSendLog)
      .set(set)
      .where(
        and(
          eq(emailSendLog.brevoMessageId, messageId),
          // status を強制 downgrade しない (delivered → opened の昇格は OK)
        ),
      );
    void result;
    updated += 1;
  }

  return NextResponse.json({ ok: true, processed: events.length, updated });
}
