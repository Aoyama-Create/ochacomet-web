import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

declare global {
  // dev ではホットリロード時に複数 Pool が作られるのを防ぐ
  var __ochacomet_pg_pool: Pool | undefined;
}

// Vercel Postgres / Neon を attach すると `POSTGRES_URL` が自動配布される。
// ローカル開発では `.env.local` の `DATABASE_URL` を優先。
const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error(
    "Database connection string is not set. Define DATABASE_URL (local) or attach Vercel Postgres / Neon (POSTGRES_URL).",
  );
}

const pool =
  globalThis.__ochacomet_pg_pool ??
  new Pool({
    connectionString,
    // Serverless では同時接続が爆発しやすいので少なめ。
    // 本番で性能不足なら Vercel Postgres pooled URL や @vercel/postgres-edge への移行を検討。
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__ochacomet_pg_pool = pool;
}

export const db = drizzle(pool, { schema });
export type Db = typeof db;
