// アプリ内のメール送信を1ヶ所に集約するエントリポイント。
// 各 send* は Brevo のテンプレート ID + パラメータに変換して `sendTransactional` を呼ぶ。
// dev (BREVO_API_KEY 未設定) では console fallback で URL/内容が確認できる。
import { sendTransactional, type SendTransactionalResult } from "@/lib/brevo";
import { FRIEND_RECEIVED_STEPS } from "@/lib/campaign";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.AUTH_URL ??
  "http://localhost:3000";

type Recipient = { email: string; name?: string };

function templateId(envKey: string): number | undefined {
  const raw = process.env[envKey];
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function sendVerificationEmail(
  to: Recipient,
  token: string,
): Promise<SendTransactionalResult> {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const tpl = templateId("BREVO_TPL_VERIFICATION");
  if (tpl) {
    return sendTransactional({
      to: [to],
      templateId: tpl,
      params: { verifyUrl },
      tags: ["verification"],
    });
  }
  // テンプレ未登録時のフォールバック (dev or 設定途中)
  return sendTransactional({
    to: [to],
    subject: "[OchaComet] メールアドレスの確認",
    textContent: `OchaComet にご登録ありがとうございます。\n\n下記の URL を 24 時間以内に開いてメールアドレスを確認してください。\n${verifyUrl}\n\n心当たりがない場合はこのメールは破棄してください。`,
    tags: ["verification"],
  });
}

export async function sendPasswordResetEmail(
  to: Recipient,
  token: string,
): Promise<SendTransactionalResult> {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const tpl = templateId("BREVO_TPL_PASSWORD_RESET");
  if (tpl) {
    return sendTransactional({
      to: [to],
      templateId: tpl,
      params: { resetUrl },
      tags: ["password-reset"],
    });
  }
  return sendTransactional({
    to: [to],
    subject: "[OchaComet] パスワード再設定",
    textContent: `下記の URL を 1 時間以内に開いてパスワードを再設定してください。\n${resetUrl}`,
    tags: ["password-reset"],
  });
}

/** 管理者ログインの二段階認証コード (チェックリスト §1b)。10 分有効。 */
export async function sendAdminOtpEmail(
  to: Recipient,
  code: string,
): Promise<SendTransactionalResult> {
  const tpl = templateId("BREVO_TPL_ADMIN_OTP");
  if (tpl) {
    return sendTransactional({
      to: [to],
      templateId: tpl,
      params: { code },
      tags: ["admin-otp"],
    });
  }
  return sendTransactional({
    to: [to],
    subject: "[OchaComet] 管理画面ログインの確認コード",
    textContent: `管理画面ログインの確認コードです。\n\n確認コード: ${code}\n\n10 分以内に入力してください。心当たりがない場合はこのメールを破棄し、パスワードの変更をご検討ください。`,
    tags: ["admin-otp"],
  });
}

export async function sendWelcomeEmail(
  to: Recipient,
): Promise<SendTransactionalResult> {
  const tpl = templateId("BREVO_TPL_WELCOME");
  if (tpl) {
    return sendTransactional({
      to: [to],
      templateId: tpl,
      tags: ["welcome"],
    });
  }
  return sendTransactional({
    to: [to],
    subject: "[OchaComet] ご登録ありがとうございます",
    textContent: `OchaComet にご登録いただきありがとうございます。\n\nマイページから拡張をダウンロードできます: ${APP_URL}/account/download`,
    tags: ["welcome"],
  });
}

/**
 * ISO 文字列ではなく日本語表記 ("2026年6月9日 16:30") に整形した日付。
 * Brevo Template の {{ params.expiresAt }} に貼っても自然に読めるよう、
 * Asia/Tokyo タイムゾーンに変換してから出す。
 */
function formatExpiresJa(d: Date): string {
  return d.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * `friend_received` キャンペーンの cron から呼ばれる step 送信。
 * stepIndex は 1..4 (step 0 は発行時 transactional で送信済)。
 *
 * params:
 *   - code            : フレンドコード文字列
 *   - expiresAtJa     : 日本語整形済の期限文字列
 *   - daysRemaining   : 期限までの日数 (負ならすでに切れている)
 *   - friendsUrl      : ガイドページ URL
 *   - unsubscribeUrl  : 1-click 配信停止 URL (Brevo の List-Unsubscribe ヘッダ用)
 */
export async function sendFriendStepEmail(
  to: Recipient,
  stepIndex: number,
  args: {
    code: string;
    expiresAt: Date;
    daysRemaining: number;
    friendsUrl?: string;
    unsubscribeUrl: string;
  },
): Promise<SendTransactionalResult> {
  const step = FRIEND_RECEIVED_STEPS[stepIndex];
  if (!step) {
    return { ok: false, error: `unknown step index ${stepIndex}` };
  }

  const friendsUrl = args.friendsUrl ?? `${APP_URL}/friends`;
  const expiresAtJa = formatExpiresJa(args.expiresAt);

  const params = {
    code: args.code,
    expiresAt: expiresAtJa,
    daysRemaining: args.daysRemaining,
    friendsUrl,
    unsubscribeUrl: args.unsubscribeUrl,
  };

  const headers = {
    // RFC 8058 1-click unsubscribe
    "List-Unsubscribe": `<${args.unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  const tpl = templateId(step.templateEnvKey);
  if (tpl) {
    return sendTransactional({
      to: [to],
      templateId: tpl,
      params,
      tags: step.tags,
      headers,
    });
  }
  // Template 未設定時のフォールバック: シンプルな text 本文。
  return sendTransactional({
    to: [to],
    subject: step.fallbackSubject,
    textContent: [
      step.fallbackSubject,
      "",
      `フレンドコード: ${args.code}`,
      `有効期限: ${expiresAtJa} (残り ${args.daysRemaining} 日)`,
      "",
      `${step.description}`,
      "",
      `ガイド: ${friendsUrl}`,
      "",
      `配信停止: ${args.unsubscribeUrl}`,
    ].join("\n"),
    tags: step.tags,
    headers,
  });
}

export async function sendFriendCodeIssuedEmail(
  to: Recipient,
  args: { code: string; expiresAt: Date; friendsUrl?: string },
): Promise<SendTransactionalResult> {
  const friendsUrl = args.friendsUrl ?? `${APP_URL}/friends`;
  const expiresAtJa = formatExpiresJa(args.expiresAt);
  const tpl = templateId("BREVO_TPL_FRIEND_CODE_ISSUED");
  if (tpl) {
    return sendTransactional({
      to: [to],
      templateId: tpl,
      params: {
        code: args.code,
        expiresAt: expiresAtJa,
        friendsUrl,
      },
      tags: ["friend-code-issued"],
    });
  }
  return sendTransactional({
    to: [to],
    subject: "[OchaComet] フレンドコードを発行しました",
    textContent: [
      "OchaComet のフレンドコードを発行しました。",
      "",
      `コード: ${args.code}`,
      `有効期限: ${expiresAtJa}`,
      "",
      `使い方ガイド: ${friendsUrl}`,
      "",
      "「分析」タブにこのコードを入力すると、Pro 機能を期間限定で試せます。",
    ].join("\n"),
    tags: ["friend-code-issued"],
  });
}
