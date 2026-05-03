import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

declare global {
  // dev ではホットリロード時に複数 Pool が作られるのを防ぐ
  var __ochacomet_pg_pool: Pool | undefined;
}

const pool =
  globalThis.__ochacomet_pg_pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__ochacomet_pg_pool = pool;
}

export const db = drizzle(pool, { schema });
export type Db = typeof db;
