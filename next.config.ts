import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Cache Components (Next 16 の PPR)。静的シェルを CDN から返し、動的な部分だけ
  // Suspense でストリーミングする。これを入れる前は Header が root layout で
  // auth() を呼んでいたせいで**全ページが動的**になり、規約ページのような静的な
  // 文書まで毎回サーバー生成されていた（/terms の TTFB 400ms、コールド 1.8 秒）。
  //
  // 有効にすると「Suspense の外での動的アクセス」がビルドエラーになる。
  // 問題が出たらこの 1 行を外せば従来の挙動に戻る。
  //
  // なお有効化に伴い、各 route handler の `export const runtime = "nodejs"` は
  // すべて削除した。cacheComponents は Node ランタイム前提で、runtime の明示自体が
  // 非互換になるため（Edge は元々未使用）。意味は変わらない。
  cacheComponents: true,
  // ホームディレクトリの古い package-lock.json を root として推論されるのを防ぐ。
  turbopack: {
    root: projectRoot,
  },
  // unzipper / archiver は Node のみで動く CJS パッケージで、内部で optional dep
  // (@aws-sdk/client-s3 など) を require しているため、bundle せず Node 側で require する。
  serverExternalPackages: ["unzipper", "archiver", "@node-rs/argon2"],
};

export default nextConfig;
