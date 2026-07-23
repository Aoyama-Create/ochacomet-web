// 最小限の semver (MAJOR.MINOR.PATCH) 比較。拡張側 lib/version.js と同ロジック。
// プレリリース/ビルドメタデータは扱わない (Manifest V3 の version は数値3桁のみ)。

/** a<b→-1, a==b→0, a>b→1 */
export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

/** 配列から semver 最大を返す (空なら null) */
export function maxSemver(versions: string[]): string | null {
  if (versions.length === 0) return null;
  return versions.reduce((max, v) => (compareSemver(v, max) > 0 ? v : max));
}
