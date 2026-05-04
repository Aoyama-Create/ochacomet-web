// Argon2id ラッパ。設計書 07 §2.4 に準拠 (OWASP 2024 推奨)。
// パラメータは @node-rs/argon2 のデフォルトより少し強め: m=64MB, t=3, p=4。
import { hash, verify } from "@node-rs/argon2";

// @node-rs/argon2 のデフォルトアルゴリズムは Argon2id。
// const enum Algorithm は isolatedModules では import できないので明示指定しない。
const ARGON2_OPTIONS = {
  memoryCost: 65_536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(plaintext: string): Promise<string> {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("password must be a non-empty string");
  }
  return hash(plaintext, ARGON2_OPTIONS);
}

export async function verifyPassword(
  plaintext: string,
  hashed: string,
): Promise<boolean> {
  if (!plaintext || !hashed) return false;
  try {
    return await verify(hashed, plaintext);
  } catch {
    return false;
  }
}
