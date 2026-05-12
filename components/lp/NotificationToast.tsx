// 実機の OS デスクトップ通知 (Brave / Chrome の Web Notification) を再現したモック。
// Hero で OchaCometPopup の上に重ねて、「通知 → 承認 → 送信」の手動フローを視覚化する。
// 実機キャプチャ参照: 暗背景 #1c1c1e、白文字、薄いセパレータ #3a3a3c。
// ブラウザ依存の Brave ロゴは出さず、OchaComet 自前アイコンに置換 (LP 上の独立性のため)。
import Image from "next/image";

export function NotificationToast() {
  return (
    <div
      className="w-[340px] max-w-full overflow-hidden rounded-[14px] bg-[#1c1c1e] text-white shadow-[0_24px_60px_rgba(0,0,0,0.35),0_8px_20px_rgba(0,0,0,0.25)] ring-1 ring-white/5"
      role="img"
      aria-label="デスクトップ通知のプレビュー: リスナー入室通知が届き、送信か無視を選べる状態"
    >
      {/* Header + body */}
      <div className="flex gap-3 px-3.5 py-3">
        <Image
          src="/ochacomet-icon.png"
          width={40}
          height={40}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded-[10px]"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-bold text-white">
              OchaComet
            </span>
            <span
              aria-hidden
              className="flex items-center gap-1 text-[12px] text-white/45"
            >
              <span>···</span>
              <ChevronDown />
            </span>
          </div>
          <p className="mt-0.5 text-[13px] leading-[1.45] text-white/90">
            【リスナー入室通知】
          </p>
          <p className="text-[13px] leading-[1.45] text-white/90">
            <span className="font-bold">baby</span> さんへ挨拶を送信しますか？
          </p>
          <p className="mt-0.5 text-[12px] leading-[1.45] text-white/65">
            候補: いらっしゃい〜🍵
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t border-white/[0.08]">
        <ActionRow primary>送信</ActionRow>
        <ActionRow>スキップ</ActionRow>
        {/* <ActionRow>Settings</ActionRow> */}
      </div>
    </div>
  );
}

function ActionRow({
  children,
  primary,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <div
      className={`block w-full border-t border-white/[0.08] py-3 text-center text-[14px] first:border-t-0 ${
        primary ? "font-bold text-[#7dd99c]" : "font-medium text-white/85"
      }`}
    >
      {children}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      aria-hidden
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
