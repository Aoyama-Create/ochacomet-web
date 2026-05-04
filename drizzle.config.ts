import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// dotenv は `.env` をデフォルトで読むが、Next.js の慣習に合わせて `.env.local` を優先する。
// (Next.js dev server は `.env.local` を自動読込するが drizzle-kit は読まないため)
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
