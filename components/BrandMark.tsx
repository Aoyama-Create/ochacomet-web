// ブランドマーク（お茶の湯気＝3 本の光線 + spark）をインライン SVG で描く。
//
// なぜ public/ochacomet-mark.svg を <Image> で読まないのか:
// あの SVG は「このサイトはライト固定なので、明るい地の上で成立する配色に固定してある」
// という前提で色をハードコードしており、ダーク背景では spark (#8a8474) と
// ray2 (#278958) が沈む。さらに 17-auto-comment-sender からの自動生成物で
// 「手で編集しないこと」と明記されているため、web 側から色を直せない。
//
// そこで形だけを写し取り、色はテーマ変数 (--mark-*) から取る。
// 形を変えたくなったら原本 (17-auto-comment-sender/assets/icon.svg) を直し、
// このファイルの座標も合わせて更新すること。
//
// 注意: public/ochacomet-mark.svg 自体は favicon 生成の系統でまだ使われうるので消さない。
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      shapeRendering="geometricPrecision"
      aria-hidden
      focusable="false"
      className={className}
    >
      <g strokeLinecap="round" fill="none">
        <line
          x1="43.6"
          y1="85.8"
          x2="115.0"
          y2="13.8"
          strokeWidth="6.7"
          stroke="var(--mark-ray1)"
        />
        <line
          x1="47.1"
          y1="59.5"
          x2="77.9"
          y2="28.5"
          strokeWidth="5.2"
          stroke="var(--mark-ray2)"
        />
        <line
          x1="66.4"
          y1="86.9"
          x2="94.9"
          y2="57.4"
          strokeWidth="5.0"
          stroke="var(--mark-ray3)"
        />
      </g>
      <path
        transform="translate(26.7 99.3) scale(22)"
        fill="var(--mark-spark)"
        d="M 0,-1 C 0.08,-0.34 0.34,-0.08 1,0 C 0.34,0.08 0.08,0.34 0,1 C -0.08,0.34 -0.34,0.08 -1,0 C -0.34,-0.08 -0.08,-0.34 0,-1 Z"
      />
    </svg>
  );
}
