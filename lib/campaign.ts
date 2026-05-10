// friend_received キャンペーンの 5 段ステップ定義 (設計書 09 §2.2)。
//
// 起算点 = フレンドコード発行時 (`friend_codes.created_at`)
// T = `friend_codes.duration_days` (例: 30)
//
// step 0: 発行直後 — `tpl_friend_code_issued` を transactional 即時送信 (lib/friendCodes/issue.ts)。
//         このため cron は **step 0 をスキップ** して current_step=0 で挿入された行は
//         step 1 (T*0.7 後) を最初に送る位置から始まる。
//
// step 1: T*0.7 (= 30 日コードなら 21 日後) — Pro を考えてもらう
// step 2: T*0.9 (= 27 日後)               — 期限が近づいた告知
// step 3: T    (= 30 日後 = 期限到達)        — 期限切れ通知
// step 4: T+7d (= 37 日後)                 — Win-back
//
// step ごとの timing 計算は `computeNextSendAt` でここに集約。

export type FriendStep = {
  /** current_step に対応するインデックス (0..4)。0 は cron では未使用。 */
  index: number;
  /** Brevo Template ID を取得する env キー。未設定なら subject+text fallback。 */
  templateEnvKey: string;
  /** Sentry / Brevo タグ用 */
  tags: string[];
  /** メール送信のフォールバック文面 (テンプレ未設定時) */
  fallbackSubject: string;
  /** params 補完用の subject suffix (UI 表示) */
  description: string;
};

export const FRIEND_RECEIVED_STEPS: FriendStep[] = [
  {
    // step 0: 発行直後 — F-2 の tpl_friend_code_issued で代替 (cron では未送信)
    index: 0,
    templateEnvKey: "BREVO_TPL_FRIEND_CODE_ISSUED",
    tags: ["friend-received", "step-0"],
    fallbackSubject: "[OchaComet] フレンドコードを発行しました",
    description: "発行通知 (transactional で即時送信)",
  },
  {
    index: 1,
    templateEnvKey: "BREVO_TPL_FRIEND_PRO_CONSIDER",
    tags: ["friend-received", "step-1"],
    fallbackSubject: "[OchaComet] Pro 機能はいかがでしたか?",
    description: "T*70% — Pro 検討の促し",
  },
  {
    index: 2,
    templateEnvKey: "BREVO_TPL_FRIEND_EXPIRY_SOON",
    tags: ["friend-received", "step-2"],
    fallbackSubject: "[OchaComet] フレンドコードの有効期限が近づいています",
    description: "T*90% — 期限間近の通知",
  },
  {
    index: 3,
    templateEnvKey: "BREVO_TPL_FRIEND_EXPIRED",
    tags: ["friend-received", "step-3"],
    fallbackSubject: "[OchaComet] フレンドコードの有効期限が切れました",
    description: "T = 期限到達",
  },
  {
    index: 4,
    templateEnvKey: "BREVO_TPL_FRIEND_WINBACK",
    tags: ["friend-received", "step-4"],
    fallbackSubject: "[OchaComet] お試し期間後の感想をお聞かせください",
    description: "T+7d — Win-back",
  },
];

/** 5 段すべて送信完了したかどうか */
export function isFriendReceivedCompleted(currentStep: number): boolean {
  return currentStep >= FRIEND_RECEIVED_STEPS.length;
}

/**
 * 次に送るべき step の next_send_at を計算する。
 *
 * @param issuedAt フレンドコード発行日 (= `friend_codes.created_at`)
 * @param durationDays 有効期間 (例: 30)
 * @param nextStepIndex 次に処理する step (= cron が拾った時の current_step)
 * @returns 送信予定時刻。最終 step を超えたら null (= キャンペーン終了)。
 */
export function computeNextSendAt(
  issuedAt: Date,
  durationDays: number,
  nextStepIndex: number,
): Date | null {
  const T = durationDays * 24 * 60 * 60 * 1000;
  const base = issuedAt.getTime();
  switch (nextStepIndex) {
    case 0: // step 0 は transactional 即時送信 (発行時) なので now を返す
      return new Date(base);
    case 1: // T * 0.7
      return new Date(base + T * 0.7);
    case 2: // T * 0.9
      return new Date(base + T * 0.9);
    case 3: // T (= 期限到達)
      return new Date(base + T);
    case 4: // T + 7 days
      return new Date(base + T + 7 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}
