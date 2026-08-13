// デスクトップ版（Electron）の配布情報。
//
// 拡張の ZIP 配布（releases テーブル + /api/download）とは別系統。
// デスクトップ版は electron-builder が吐くフィード（latest-mac.yml / latest.yml）が
// 唯一の真実で、DB は持たない。公開バケットに置いてあり認証も不要。
//
// 経緯と設計は 17-auto-comment-sender/docs/design/10-electron-migration.md を参照。

/** Blob の公開ホスト。明示指定が無ければトークンから導出する。 */
export function blobPublicBase(): string | null {
  const explicit = process.env.BLOB_PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  // vercel_blob_rw_<storeId>_<secret> の storeId が公開ホストになる。
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  if (!storeId) return null;
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com`;
}

export type DesktopInstaller = {
  /** 表示用のプラットフォーム名 */
  platform: "macOS" | "Windows";
  /** ダウンロード URL（自社ドメイン経由。Blob へ 302 する） */
  url: string;
  sizeBytes: number;
};

export type DesktopRelease = {
  version: string;
  installers: DesktopInstaller[];
};

/**
 * フィード（YAML）から version と files[] を取り出す。
 *
 * 正規表現で 1 発で取ろうとしないこと。以前 `(?=...|\Z)` を終端の意図で書いていたが、
 * **JavaScript の正規表現に `\Z` は無く、ただの文字 `Z` として扱われる**。
 * sha512 の base64 に `Z` が含まれるフィードで解析が途中で打ち切られ、
 * size が 0 になった（1.23.0 は偶然 `Z` を含まず、1.23.1 で発覚）。
 * 行単位で読むほうが短く、壊れにくい。
 */
function parseFeed(
  text: string,
): { version: string; files: { url: string; size: number }[] } | null {
  const version = text.match(/^version:\s*(\S+)/m)?.[1];
  if (!version) return null;

  const files: { url: string; size: number }[] = [];
  let current: { url: string; size: number } | null = null;
  for (const line of text.split(/\r?\n/)) {
    const url = line.match(/^\s*-\s*url:\s*(\S+)\s*$/);
    if (url) {
      current = { url: url[1], size: 0 };
      files.push(current);
      continue;
    }
    const size = line.match(/^\s*size:\s*(\d+)\s*$/);
    if (size && current) current.size = Number(size[1]);
    // インデントの無い行が来たら files ブロックは終わり
    if (/^\S/.test(line)) current = null;
  }
  return { version, files };
}

/**
 * 公開中のデスクトップ版を取得する。
 *
 * `.dmg` / `.exe` だけを拾う。`.zip` は electron-updater が差分更新に使う内部ファイルで、
 * 人がダウンロードするものではない。
 */
export async function getLatestDesktop(): Promise<DesktopRelease | null> {
  const base = blobPublicBase();
  if (!base) return null;

  const feeds: {
    file: string;
    platform: DesktopInstaller["platform"];
    ext: string;
  }[] = [
    { file: "latest-mac.yml", platform: "macOS", ext: ".dmg" },
    { file: "latest.yml", platform: "Windows", ext: ".exe" },
  ];

  let version = "";
  const installers: DesktopInstaller[] = [];

  for (const f of feeds) {
    try {
      const res = await fetch(`${base}/desktop/${f.file}`, {
        // no-store にすると毎回ネットワーク待ちになり、ページ表示が体感で遅くなる。
        // 版数の鮮度は 1 分あれば十分なので短い revalidate にする。
        next: { revalidate: 60 },
      });
      if (!res.ok) continue; // その OS 向けは未ビルド
      const parsed = parseFeed(await res.text());
      if (!parsed) continue;
      version ||= parsed.version;
      for (const file of parsed.files) {
        if (!file.url.endsWith(f.ext)) continue;
        installers.push({
          platform: f.platform,
          // Blob を直接指さない。自社ドメイン経由にしておけば後で移せる。
          url: `/desktop/${file.url}`,
          sizeBytes: file.size,
        });
      }
    } catch {
      // ネットワーク不調等。その OS 分を出さないだけで、ページ自体は出す。
    }
  }

  if (!version || installers.length === 0) return null;
  return { version, installers };
}
