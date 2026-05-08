// フレンドコード文字列の生成。`OCHA-XXXX-XXXX-XXXX` 形式。
// 視認性を上げるため、紛らわしい文字 (I, O, 0, 1) を除外した 32 文字アルファベット。
import { randomBytes } from "node:crypto";

// 32 chars (5 bits/char) → 60 bits/code → 衝突確率は実用上ゼロ
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateFriendCode(): string {
  const bytes = randomBytes(12);
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    chars.push(ALPHABET[bytes[i] % ALPHABET.length]);
  }
  return `OCHA-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

const FRIEND_CODE_PATTERN = /^OCHA-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export function normalizeFriendCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isFriendCodeFormatValid(code: string): boolean {
  return FRIEND_CODE_PATTERN.test(code);
}
