// admin_2fa クッキー (署名済み JWT) の発行・検証。チェックリスト §1b。
//
// jose のみに依存し node:crypto を使わないため、Edge(proxy.ts) からも
// Node(API route) からも import できる。OTP のハッシュ等 (node:crypto) は
// lib/adminOtp.ts 側に分離している。
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_2FA_COOKIE = "admin_2fa";
export const ADMIN_2FA_COOKIE_MAX_AGE = 60 * 60 * 12; // 12h

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

/** userId を subject に持つ署名済み JWT を返す (12h 有効) */
export async function signAdmin2faToken(userId: number): Promise<string> {
  return new SignJWT({ purpose: "admin2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_2FA_COOKIE_MAX_AGE}s`)
    .sign(secretKey());
}

/** クッキーの署名・purpose・subject(userId) を検証する。Edge 互換。 */
export async function verifyAdmin2faToken(
  token: string | undefined,
  userId: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.purpose === "admin2fa" && payload.sub === String(userId);
  } catch {
    return false;
  }
}
