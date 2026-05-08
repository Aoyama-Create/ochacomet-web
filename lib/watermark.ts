// ZIP に WATERMARK.txt を追加する stream 変換器。
// 設計書 06 §5 に準拠。
//
// 流れ:
//   入力 ZIP → unzipper.Parse() で entry を取り出し
//          → archiver で entry を再 append (level 0 = 無圧縮、CPU 節約)
//          → 末尾に WATERMARK.txt (HMAC 署名) を追加
//          → 出力 ZIP
//
// HMAC 署名は流出した ZIP が「サーバ発行の正規 watermark」であることを後から
// 検証可能にするため。`WATERMARK_SECRET` で署名している限り改ざん耐性がある。
//
// runtime: 'nodejs' 必須。Edge runtime では unzipper / archiver が動かない。
import { createHmac } from "node:crypto";
import { PassThrough, Readable } from "node:stream";
import archiver from "archiver";
import unzipper from "unzipper";

export type WatermarkInfo = {
  userId: string;
  email: string;
  version: string;
  downloadedAt: string; // ISO 8601
};

function buildWatermarkBody(info: WatermarkInfo): string {
  const secret = process.env.WATERMARK_SECRET;
  if (!secret) {
    throw new Error("WATERMARK_SECRET is not set");
  }
  const sig = createHmac("sha256", secret)
    .update(
      `${info.userId}|${info.email}|${info.version}|${info.downloadedAt}`,
    )
    .digest("hex");

  return [
    "# OchaComet License Marker",
    "# この拡張は以下の方にダウンロードされたものです。流出や再配布は禁止されています。",
    "",
    `userId: ${info.userId}`,
    `email: ${info.email}`,
    `version: ${info.version}`,
    `downloadedAt: ${info.downloadedAt}`,
    `signature: ${sig}`,
    "",
  ].join("\n");
}

export async function injectWatermark(
  source: ReadableStream<Uint8Array>,
  info: WatermarkInfo,
): Promise<ReadableStream<Uint8Array>> {
  const body = buildWatermarkBody(info);

  const out = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 0 } });
  archive.on("error", (e) => out.destroy(e));
  archive.pipe(out);

  // unzip 入力 (Web ReadableStream → Node Readable)
  const inputNode = Readable.fromWeb(source as unknown as import("stream/web").ReadableStream<Uint8Array>);
  const parser = inputNode.pipe(unzipper.Parse({ forceStream: true }));

  // entry をひとつずつ buffer 化して archiver に append (順序保持)。
  // ZIP は entries が独立した圧縮ブロックなので、これで安全に再構築できる。
  (async () => {
    try {
      for await (const entry of parser) {
        const e = entry as unknown as {
          type: string;
          path: string;
          buffer: () => Promise<Buffer>;
          autodrain: () => void;
        };
        if (e.type === "File") {
          const buf = await e.buffer();
          archive.append(buf, { name: e.path });
        } else {
          e.autodrain();
        }
      }
      archive.append(body, { name: "WATERMARK.txt" });
      await archive.finalize();
    } catch (err) {
      out.destroy(err as Error);
    }
  })();

  return Readable.toWeb(out) as unknown as ReadableStream<Uint8Array>;
}
