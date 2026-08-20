// 拡張本体 popup の忠実再現コンポーネント。
//
// **現在 LP からは未使用。** ヒーローはデスクトップ版のウィンドウ (OchaCometDesktop) に
// 差し替えた。拡張版は現役なので、拡張の説明で再び使う可能性があり残してある。
//
// ★重要な制約: LP に 17LIVE の配信画面を具体的に描かない（商標模倣リスク回避）。
//   company-os の 70_products/ochacomet/overview.md にも記載している。
// 17-auto-comment-sender/popup.css と popup.html のクラス・余白・カラーをそのまま転写。
// LP では「配信画面」を一切描かず、popup 単体を主役に据える (D 案 / 商標模倣リスク回避)。
//
// popup.css の値:
//   --primary: #48875b / --primary-soft: #eff3e8 / --primary-hover: #3a6e48
//   --bg: #ffffff / --card: #f7f5ee / --text: #1d2939 / --text-light: #5c6b57
//   --border: #e5e3d8 / --radius: 12px
// 拡張本体は body width: 380px、.app-container padding: 16px。
import Image from "next/image";

const CARD =
  "rounded-[12px] border border-[#e5e3d8] bg-[#f7f5ee] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]";
const SECTION_LABEL = "block px-0.5 text-[12px] font-bold text-[#5c6b57]";
const FIELD_LABEL = "mb-1 block text-[11px] font-semibold text-[#5c6b57]";
const FIELD_INPUT =
  "w-full rounded-[8px] border border-[#e5e3d8] bg-white px-2.5 py-2 text-[14px] text-[#1d2939]";

export function OchaCometPopup() {
  return (
    <div
      className="oc-tilt mx-auto w-[380px] max-w-full overflow-hidden rounded-[14px] border border-[#e5e3d8] bg-white text-[#1d2939] shadow-[0_20px_48px_rgba(15,23,42,0.12),0_6px_16px_rgba(15,23,42,0.06)]"
      role="img"
      aria-label="OchaComet のサイドバー UI プレビュー"
    >
      <div className="p-4">
        {/* Header */}
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 実物の popup も透過のマークなので、モックもそちらに合わせる */}
            <Image
              src="/ochacomet-mark.svg"
              width={28}
              height={28}
              alt=""
              aria-hidden
              className="h-7 w-7"
              unoptimized
            />
            <h2 className="m-0 text-[19px] font-black leading-none text-[#1d2939]">
              OchaComet
            </h2>
          </div>
          <MainToggle on />
        </header>

        {/* Tabs */}
        <div className="mb-4 flex gap-0.5 rounded-[10px] bg-[#e5e3d8] p-1">
          <TabBtn active>オート機能</TabBtn>
          <TabBtn>テンプレート</TabBtn>
          <TabBtn>詳細設定</TabBtn>
          <TabBtn>Pro</TabBtn>
        </div>

        {/* 動作モード */}
        <section className="mb-[18px]">
          <label className={`${SECTION_LABEL} mb-1.5`}>動作モード</label>
          <div className={CARD}>
            <div className="flex h-6 items-center gap-5">
              <RadioItem label="手動" checked />
              <RadioItem label="自動" />
            </div>
          </div>
        </section>

        {/* ギフト反応 */}
        <section className="mb-[18px]">
          <div className="mb-1.5 flex items-end justify-between">
            <label className={SECTION_LABEL}>🎁 ギフト反応</label>
            <SmallToggle on />
          </div>
          <div className={CARD}>
            <div className="mb-2.5">
              <label className={FIELD_LABEL}>最小コイン数</label>
              <input
                readOnly
                value="100"
                className={FIELD_INPUT}
                aria-readonly
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>返信メッセージ</label>
              <input
                readOnly
                value="ありがとう💚"
                className={FIELD_INPUT}
                aria-readonly
              />
            </div>
          </div>
        </section>

        {/* リスナー入室通知 */}
        <section className="mb-[18px]">
          <div className="mb-1.5 flex items-end justify-between">
            <label className={SECTION_LABEL}>🎉 リスナー入室通知</label>
            <SmallToggle on />
          </div>
          <div className={CARD}>
            <div className="mt-2 rounded-[12px] border border-[#e5e3d8] bg-white p-2.5">
              <div className="mb-1.5 text-[12px] font-bold text-[#5c6b57]">
                新規ユーザー（ニックネーム未登録）
              </div>
              <label className="mb-2 flex cursor-pointer items-center gap-2 text-[12px] text-[#1d2939]">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[#48875b]"
                  defaultChecked={false}
                />
                <span>自動でメンション送信する（オフ=通知のみ）</span>
              </label>
              <div className="grid grid-cols-2 gap-2 border-t border-[#e5e3d8] pt-2">
                <TemplateChip>＋ ライバー名</TemplateChip>
                <TemplateChip>＋ リスナー名</TemplateChip>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-5 flex items-center justify-between border-t border-[#e5e3d8] pt-2.5">
          <select
            disabled
            className="cursor-not-allowed rounded-md border border-[#e5e3d8] bg-white px-2 py-1 text-[12px] text-[#1d2939]"
            aria-label="表示言語"
          >
            <option>日本語</option>
          </select>
          <span className="text-[11px] text-[#5c6b57]">v1.21.0</span>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   Internal helpers — popup.css 各クラスの忠実再現
   ============================================================ */

function MainToggle({ on }: { on?: boolean }) {
  return (
    <span
      className={`relative inline-block h-6 w-[50px] rounded-[24px] ${on ? "bg-[#48875b]" : "bg-[#d1cfc4]"}`}
      aria-hidden
    >
      <span
        className={`absolute top-[3px] grid h-[18px] w-[18px] place-items-center rounded-full bg-white transition-all ${on ? "left-[29px]" : "left-[3px]"}`}
      />
    </span>
  );
}

function SmallToggle({ on }: { on?: boolean }) {
  return (
    <span
      className={`relative inline-block h-6 w-[50px] rounded-[24px] ${on ? "bg-[#48875b]" : "bg-[#d1cfc4]"}`}
      aria-hidden
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white ${on ? "left-[29px]" : "left-[3px]"}`}
      />
      <span
        className={`absolute top-[5px] text-[9px] font-black leading-none ${on ? "left-[8px] text-white" : "right-[7px] text-[#5c6b57]"}`}
      >
        {on ? "ON" : "OFF"}
      </span>
    </span>
  );
}

function TabBtn({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className={`flex-1 rounded-[7px] border-0 px-1 py-1.5 text-[11px] font-bold ${
        active
          ? "bg-white text-[#1d2939] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
          : "bg-transparent text-[#5c6b57]"
      }`}
    >
      {children}
    </button>
  );
}

function RadioItem({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[#1d2939]">
      <span
        className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
          checked ? "border-[#48875b]" : "border-[#c8c5b5]"
        }`}
        aria-hidden
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-[#48875b]" />}
      </span>
      <span>{label}</span>
    </label>
  );
}

function TemplateChip({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="w-full rounded-[8px] border border-dashed border-[#48875b] bg-[#eff3e8] px-1.5 py-2 text-[11px] font-bold leading-[1.25] text-[#48875b]"
    >
      {children}
    </button>
  );
}
