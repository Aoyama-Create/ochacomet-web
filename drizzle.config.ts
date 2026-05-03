import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 開発中は drop 文も生成して、スキーマ整合性を厳密に保つ
  strict: true,
  verbose: true,
});
