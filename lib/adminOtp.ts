// 管理者ログインの二段階認証 (メール OTP) の 6桁コード生成・ハッシュ・検証。
// チェックリスト §1b。node:crypto を使うため Node runtime 専用
// (Edge から使うクッキー検証は lib/admin2faCookie.ts に分離)。
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10min
export const OTP_MAX_ATTEMPTS = 5;

/** 6桁 (000000-999999) のゼロ埋めコード */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** 定数時間比較で照合 */
export function verifyOtpHash(code: string, hash: string | null): boolean {
  if (!hash) return false;
  const a = Buffer.from(hashOtp(code), "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function otpExpiryFromNow(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}
