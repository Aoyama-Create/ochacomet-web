// Brevo API ラッパ。1st リリースでは sendTransactional のみ使用。
// (upsertContact / verifyWebhookSignature は Phase 5 で追加予定。)
//
// 本番では実際の Brevo API を叩く。dev では BREVO_API_KEY が無いとき console fallback。
//
// ★ fail-open を塞いである (2026-08-23)。以前はこうなっていた:
//    - BREVO_API_KEY / BREVO_SENDER_EMAIL が無いと NODE_ENV を見ずに fallback へ落ち、
//      args を丸ごと console.log していた。args には宛先メールに加えて params が入る
//      = 認証 URL・パスワード再設定 URL・管理者 OTP・フレンドコードが平文でログに出る。
//    - しかも { ok: true } を返すので、呼び元は「送れた」と誤解する。本番で env が
//      欠けると、認証メールが届かないことに誰も気づけない (signup は成功扱い、
//      管理者 2FA は 200 を返して永久に来ない OTP を待つ)。
//   → 本番では fallback せず ok:false を返す。dev の出力からも宛先と params を落とす。

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
  /** 受信者側に渡すカスタムヘッダ。
   *  例: List-Unsubscribe / List-Unsubscribe-Post (RFC 8058 1-click 用)。 */
  headers?: Record<string, string>;
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
    // 本番は fail-closed。設定漏れを「送れたこと」にしない。
    if (process.env.NODE_ENV === "production") {
      console.error("[brevo] not configured (BREVO_API_KEY / BREVO_SENDER_EMAIL)");
      return { ok: false, error: "brevo_not_configured" };
    }

    // dev fallback: メール送信せずに console に出力。
    // 既定では宛先 (to) と params を出さない。params には認証 URL・OTP・
    // フレンドコードが入るため。ローカルでそれらを見たいときだけ
    // BREVO_DEV_LOG_PARAMS=1 で明示的にオプトインする。
    const detail = process.env.BREVO_DEV_LOG_PARAMS === "1"
      ? { ...args }
      : {
          to: `${args.to.length} recipient(s)`,
          templateId: args.templateId,
          subject: args.subject,
          tags: args.tags,
          _redacted: "to / params は既定で伏せています (BREVO_DEV_LOG_PARAMS=1 で表示)",
        };
    console.log(
      "[brevo:dev-fallback]",
      JSON.stringify({ ...detail, _note: "BREVO_API_KEY 未設定のため送信をスキップしました" }, null, 2),
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
    headers: args.headers,
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
    // Brevo のエラー body は宛先アドレスをエコーすることがある。この文字列は
    // ログにも email_send_log.error_message にも入るので、長さを切って持ち回る。
    const text = (await res.text().catch(() => "")).slice(0, 200);
    return { ok: false, error: `http ${res.status}: ${text}` };
  }

  const json = (await res.json().catch(() => ({}))) as { messageId?: string };
  return { ok: true, messageId: json.messageId ?? "" };
}

/**
 * Brevo の Webhook URL に `?secret=XXX` を付けてアプリ側で検証するための簡易チェック。
 * Brevo は HMAC 署名ヘッダを公式に提供していないので、URL の query string で
 * `BREVO_WEBHOOK_SECRET` と一致するかだけ確認する形にする。
 *
 * @returns true = 認可済 / false = 不正
 */
export function verifyBrevoWebhookSecret(url: string): boolean {
  const expected = process.env.BREVO_WEBHOOK_SECRET;
  if (!expected) return false;
  try {
    const parsed = new URL(url);
    const got = parsed.searchParams.get("secret") ?? "";
    return got === expected;
  } catch {
    return false;
  }
}
