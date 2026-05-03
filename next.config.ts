import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // ホームディレクトリの古い package-lock.json を root として推論されるのを防ぐ。
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
