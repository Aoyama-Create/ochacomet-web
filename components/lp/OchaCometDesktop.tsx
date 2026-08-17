// Hero ビジュアル: デスクトップアプリのウィンドウ再現コンポーネント。
//
// 実アプリと同じ構成（タイトルバー / 配信エリア / 設定サイドバー / ステータスバー）を
// 描くが、**左の配信エリアは抽象的なプレースホルダにとどめる**。
//
// ★重要な制約: LP に 17LIVE の配信画面を具体的に描かない（商標模倣リスク回避）。
//   実アプリの左半分は 17LIVE の配信画面だが、その UI・ロゴ・レイアウト・特定ライバーの
//   映像を想起させるものは一切描かないこと。実アプリのスクリーンショットも使わない。
//   この制約は company-os の 70_products/ochacomet/overview.md にも記載している。
//
// サイドバーは実物の比率（1600 中 400 = 25%）より広く取っている。比率どおりだと
// ヒーローの幅では文字が読めず、「何ができるか」が伝わらなくなるため。
//
// ★「動作モード（手動/自動）」は意図的に描いていない。自動モードに切り替えられることを
//   LP で明示しない、という訴求上の判断。実アプリには存在する機能なので、
//   「実物にあるから」という理由で描き戻さないこと。
//
// 配色は popup.css 由来（OchaCometPopup.tsx と同じ値）:
//   --primary: #48875b / --card: #f7f5ee / --text: #1d2939 / --border: #e5e3d8

const CARD = "rounded-[6px] border border-[#e5e3d8] bg-[#f7f5ee] p-1.5";
const LABEL = "mb-1 text-[7px] font-bold text-[#5c6b57]";

/** サイドバーの ON/OFF トグル */
function Toggle({ small }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex items-center rounded-full bg-[#48875b] px-0.5 ${
        small ? "h-2.5 w-5" : "h-3 w-6"
      }`}
    >
      <i
        className={`ml-auto block rounded-full bg-white ${
          small ? "h-2 w-2" : "h-2.5 w-2.5"
        }`}
      />
    </span>
  );
}

export function OchaCometDesktop() {
  return (
    <div
      className="oc-tilt w-full overflow-hidden rounded-[12px] border border-[#e5e3d8] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.14),0_6px_16px_rgba(15,23,42,0.07)]"
      role="img"
      aria-label="OchaComet デスクトップアプリの画面プレビュー"
    >
      {/* タイトルバー */}
      <div className="flex items-center gap-2 border-b border-[#e5e3d8] bg-[#f7f5ee] px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <i className="block h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="text-[11px] font-bold text-[#5c6b57]">OchaComet</span>
      </div>

      <div className="flex">
        {/*
          配信エリア: 抽象プレースホルダ。17LIVE を想起させるものは描かない。

          色は**通知トースト (#1c1c1e) より明確に明るく**すること。
          どちらも暗いと、トーストを重ねたときに境界が分からなくなる。
        */}
        <div className="relative aspect-[4/3] flex-1 bg-gradient-to-br from-[#4a6180] to-[#33455e]">
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-bold text-white">
            <i
              aria-hidden
              className="oc-pulse block h-1.5 w-1.5 rounded-full bg-[#ff5f57]"
            />
            LIVE
          </span>
          {/* 画面があることだけを示す、意味を持たない面 */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.14)_0%,transparent_58%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-6 bottom-5 space-y-1.5 opacity-35"
          >
            <span className="block h-1.5 w-3/5 rounded-full bg-white" />
            <span className="block h-1.5 w-2/5 rounded-full bg-white" />
          </div>
        </div>

        {/* 設定サイドバー（実アプリでは popup.html がそのまま入る） */}
        <div className="w-[42%] shrink-0 space-y-1.5 border-l border-[#e5e3d8] bg-white p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#1d2939]">
              OchaComet
            </span>
            <Toggle />
          </div>

          {/* タブ */}
          <div
            aria-hidden
            className="flex gap-px rounded-[5px] bg-[#e5e3d8] p-0.5"
          >
            <span className="flex-1 rounded-[4px] bg-white py-0.5 text-center text-[6px] font-bold text-[#48875b]">
              オート
            </span>
            <span className="flex-1 py-0.5 text-center text-[6px] text-[#5c6b57]">
              テンプレ
            </span>
            <span className="flex-1 py-0.5 text-center text-[6px] text-[#5c6b57]">
              設定
            </span>
            <span className="flex-1 py-0.5 text-center text-[6px] text-[#5c6b57]">
              分析
            </span>
          </div>

          {/* クイック送信 */}
          <div className={CARD}>
            <p className={LABEL}>クイック送信</p>
            <div className="mb-1 rounded-[4px] border border-[#e5e3d8] bg-white px-1 py-1">
              <span className="block text-[6px] text-[#1d2939]">
                いらっしゃい〜🍵
              </span>
            </div>
            <div className="mb-1 flex items-center gap-1">
              <span className="text-[6px] text-[#5c6b57]">送信先</span>
              <span className="flex-1 truncate rounded-[3px] border border-[#e5e3d8] bg-white px-1 text-[6px] text-[#1d2939]">
                配信ページ ▾
              </span>
            </div>
            <div className="rounded-full bg-[#48875b] py-0.5 text-center text-[7px] font-black text-white">
              送信
            </div>
          </div>

          {/* ギフト反応 */}
          <div className={CARD}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[7px] font-bold text-[#5c6b57]">
                🎁 ギフト反応
              </span>
              <Toggle small />
            </div>
            <div className="flex items-center justify-between rounded-[3px] border border-[#e5e3d8] bg-white px-1 py-0.5">
              <span className="text-[6px] text-[#5c6b57]">最小コイン</span>
              <span className="text-[6px] font-bold text-[#1d2939]">100</span>
            </div>
          </div>

          {/* 入室通知履歴 */}
          <div className={CARD}>
            <p className={LABEL}>入室通知履歴</p>
            <ul aria-hidden className="space-y-0.5">
              {[
                ["baby", "21:04"],
                ["みかん", "21:02"],
                ["ゆう", "20:58"],
              ].map(([name, time]) => (
                <li
                  key={name}
                  className="flex items-center justify-between border-b border-[#e5e3d8] pb-0.5 last:border-0"
                >
                  <span className="truncate text-[6px] text-[#1d2939]">
                    {name}
                  </span>
                  <span className="text-[6px] text-[#5c6b57]">{time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ステータスバー */}
      <div className="flex items-center gap-2 border-t border-[#e5e3d8] bg-[#f7f5ee] px-3 py-1.5">
        <span className="rounded-[4px] border border-[#e5e3d8] bg-white px-1.5 py-0.5 text-[8px] font-bold text-[#5c6b57]">
          ⌘B サイドバー
        </span>
        <span className="ml-auto truncate text-[8px] text-[#5c6b57] opacity-70">
          配信ページを開いています
        </span>
      </div>
    </div>
  );
}
