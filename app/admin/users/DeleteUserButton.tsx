// 一覧の各行に置く削除ボタン。
//
// 確認はモーダル (<dialog>) で出す。以前はセルの中に確認行を展開していたが、
// 行の高さが変わってテーブルのレイアウトが崩れた。セルに残すのはボタンだけにして、
// 確認とエラー表示はモーダルの中に閉じ込める。
//
// 一覧には最大 50 行が並ぶので、1 クリックで消える UI にはしない。
// サーバー側 (actions.ts) でも hidden の confirm フィールドを検証している。
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteUserAction, type DeleteUserFormState } from "./actions";

const initialState: DeleteUserFormState = { ok: true };

// m-auto は必須。ブラウザの UA スタイルは dialog:modal を `inset: 0` +
// `margin: auto` で中央に置くが、Tailwind の preflight が
// `*,:after,:before,::backdrop { margin: 0 }` を当てて打ち消してしまう。
// 付けないとダイアログが画面の左上に貼り付く。
const dialogClass =
  "m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/40";

export function DeleteUserButton({
  userId,
  email,
  displayName,
}: {
  userId: number;
  email: string;
  displayName?: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(
    deleteUserAction.bind(null, userId),
    initialState,
  );

  // showModal() は DOM API なので、open state と実際の表示を同期させる。
  // (<dialog open> 属性だけでは背景の非活性化とフォーカストラップが効かない)
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-line px-3 py-1 text-[11px] font-extrabold text-ink-soft whitespace-nowrap hover:border-red-300 hover:text-red-700"
      >
        削除
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className={dialogClass}
      >
        <div className="p-6">
          <h2 className="text-base font-extrabold text-ink">
            このユーザーを削除しますか？
          </h2>

          <dl className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs text-ink-soft">ID</dt>
              <dd className="font-mono text-xs">{userId}</dd>
            </div>
            {displayName?.trim() ? (
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-xs text-ink-soft">お名前</dt>
                <dd className="min-w-0 truncate font-extrabold">{displayName}</dd>
              </div>
            ) : null}
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-xs text-ink-soft">メール</dt>
              <dd className="min-w-0 truncate font-mono text-xs">{email}</dd>
            </div>
          </dl>

          <p className="mt-4 text-sm text-ink-soft">
            アカウント情報・取引情報・決済情報を削除します。ダウンロード履歴と管理操作の記録は、
            アカウントとの紐付けを外したうえで保存期間まで残ります。
            <strong className="mt-1 block font-extrabold text-red-700">
              この操作は取り消せません。
            </strong>
          </p>

          {state && !state.ok && state.message ? (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line bg-canvas px-5 py-2 text-sm font-extrabold text-ink-soft hover:text-ink"
            >
              やめる
            </button>
            <form action={action}>
              <input type="hidden" name="confirm" value="delete" />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-extrabold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "削除中..." : "削除する"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
