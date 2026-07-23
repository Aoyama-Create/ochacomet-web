// 拡張が検証する自前ライセンスキーの生成。`OCHA-PRO-XXXX-XXXX-XXXX-XXXX` 形式。
// フレンドコード (OCHA-XXXX-XXXX-XXXX) と接頭辞で区別する。
// 紛らわしい文字 (I, O, 0, 1) を除外した 32 文字アルファベット。
import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// 16 chars (5 bits/char) → 80 bits → 総当たり非現実的
export function generateLicenseKey(): string {
  const bytes = randomBytes(16);
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    chars.push(ALPHABET[bytes[i] % ALPHABET.length]);
  }
  return `OCHA-PRO-${chars.slice(0, 4).join("")}-${chars
    .slice(4, 8)
    .join("")}-${chars.slice(8, 12).join("")}-${chars.slice(12, 16).join("")}`;
}

const LICENSE_KEY_PATTERN =
  /^OCHA-PRO-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export function normalizeLicenseKey(input: string): string {
  return input.trim().toUpperCase();
}

export function isLicenseKeyFormatValid(key: string): boolean {
  return LICENSE_KEY_PATTERN.test(key);
}
