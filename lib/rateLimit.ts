// レート制限。Vercel Marketplace の Upstash Redis (= @vercel/kv) を使う想定。
// `KV_REST_API_URL` + `KV_REST_API_TOKEN` が無い環境 (ローカル dev など) では
// プロセスメモリ上のカウンタにフォールバック (再起動でリセット、本番動作には不向き)。

import { kv } from "@vercel/kv";

type Options = {
  windowSec: number;
  max: number;
};

const memCounters = new Map<string, { count: number; expiresAt: number }>();
const HAS_KV =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

/**
 * @returns true = 許可 / false = 制限超過
 */
export async function checkRateLimit(
  key: string,
  opts: Options,
): Promise<boolean> {
  if (HAS_KV) return checkKv(key, opts);
  return checkMem(key, opts);
}

async function checkKv(key: string, opts: Options): Promise<boolean> {
  const kvKey = `ratelimit:${key}`;
  const count = await kv.incr(kvKey);
  if (count === 1) {
    await kv.expire(kvKey, opts.windowSec);
  }
  return count <= opts.max;
}

function checkMem(key: string, opts: Options): boolean {
  const now = Date.now();
  const cur = memCounters.get(key);
  if (!cur || cur.expiresAt <= now) {
    memCounters.set(key, {
      count: 1,
      expiresAt: now + opts.windowSec * 1000,
    });
    return true;
  }
  cur.count += 1;
  return cur.count <= opts.max;
}
