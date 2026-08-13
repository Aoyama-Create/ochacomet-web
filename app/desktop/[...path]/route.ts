// GET|HEAD /desktop/<path>
//
// デスクトップ版（Electron）の配布物とフィードへのリダイレクト。認証なしの公開経路。
//
// なぜ Blob の URL を直接使わないか
// --------------------------------
// 更新フィードの URL は **ビルド時にアプリへ焼き込まれる**（OCHACOMET_FEED_URL）。
// 配布済みのアプリは以後ずっとその URL を見に行くため、Blob の生ホストを焼き込むと
// 後からストレージを移せなくなる。自社ドメインを 1 枚挟んでおけば、向き先を
// 変えるだけで移せる。
//
// 本体（100MB 級）は 302 先の Blob から直接落ちるので、この関数を通らない。
// 帯域も実行時間も食わない。
//
// 拡張の ZIP 配布（/api/download/[artifact]）とは別物。あちらは会員認証・透かし・
// 監査ログ付きで、こちらは公開。詳細は
// 17-auto-comment-sender/docs/design/10-electron-migration.md を参照。
import { NextResponse } from "next/server";
import { blobPublicBase } from "@/lib/desktop";

export const runtime = "nodejs";

function resolve(segments: string[]): string | null {
  // ディレクトリを抜けさせない。
  //
  // Next.js は %2F を復号してから 1 セグメントに入れてくるため、`s === ".."` だけでは
  // `..%2F..%2Fsecret` を素通しする。最終的には encodeURIComponent が無害化するが、
  // それに頼らず「区切り文字や .. を含むセグメントは受け付けない」で弾く。
  // 実際のファイル名（OchaComet-1.23.0-arm64.dmg / latest-mac.yml / 1.23.0）は
  // どれもこれに当たらない。
  const bad = (s: string) =>
    !s || s === "." || s.includes("..") || s.includes("/") || s.includes("\\");
  if (segments.some(bad)) return null;
  const base = blobPublicBase();
  if (!base) return null;
  return `${base}/desktop/${segments.map(encodeURIComponent).join("/")}`;
}

async function handle(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const target = resolve(path ?? []);
  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // 302（恒久ではない）。ストレージを移したときに古い宛先が残らないよう、
  // リダイレクト自体はキャッシュさせない。実ファイルのキャッシュは Blob 側に任せる。
  return NextResponse.redirect(target, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}

export const GET = handle;
export const HEAD = handle;
