import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // ホームディレクトリの古い package-lock.json を root として推論されるのを防ぐ。
  turbopack: {
    root: projectRoot,
  },
  // unzipper / archiver は Node のみで動く CJS パッケージで、内部で optional dep
  // (@aws-sdk/client-s3 など) を require しているため、bundle せず Node 側で require する。
  serverExternalPackages: ["unzipper", "archiver", "@node-rs/argon2"],
};

export default nextConfig;
