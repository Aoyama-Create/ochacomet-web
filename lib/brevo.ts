// Brevo API ラッパ。1st リリースでは sendTransactional のみ使用。
// (upsertContact / verifyWebhookSignature は Phase 5 で追加予定。)
//
// 本番では実際の Brevo API を叩く。dev では BREVO_API_KEY が無いとき console fallback。

const BREVO_BASE_URL = "https://api.brevo.com/v3";

type SendTransactionalArgs = {
  to: { email: string; name?: string }[];
  templateId?: number;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  params?: Record<string, unknown>;
  /** Brevo 側のキャンペーン分類 (KPI 集計用) */
  tags?: string[];
};

export type SendTransactionalResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendTransactional(
  args: SendTransactionalArgs,
): Promise<SendTransactionalResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "OchaComet";

  if (!apiKey || !senderEmail) {
    // dev fallback: メール送信せずに console に出力。
    console.log(
      "[brevo:dev-fallback]",
      JSON.stringify({ ...args, _note: "BREVO_API_KEY 未設定のため送信をスキップしました" }, null, 2),
    );
    return { ok: true, messageId: `dev-${Date.now()}` };
  }

  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: args.to,
    templateId: args.templateId,
    subject: args.subject,
    htmlContent: args.htmlContent,
    textContent: args.textContent,
    params: args.params,
    tags: args.tags,
  };

  let res: Response;
  try {
    res = await fetch(`${BREVO_BASE_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return { ok: false, error: `network: ${String(e)}` };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `http ${res.status}: ${text}` };
  }

  const json = (await res.json().catch(() => ({}))) as { messageId?: string };
  return { ok: true, messageId: json.messageId ?? "" };
}
