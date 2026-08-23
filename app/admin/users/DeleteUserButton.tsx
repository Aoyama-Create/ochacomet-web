// 一覧の各行に置く削除ボタン。
//
// 一覧には最大 50 行が並ぶので、1 クリックで消える UI にはしない。
// 「削除」→ 対象のメールアドレスを出した確認行 → 「削除する」の 2 段階にする。
"use client";

import { useActionState, useState } from "react";
import { deleteUserAction, type DeleteUserFormState } from "./actions";

const initialState: DeleteUserFormState = { ok: true };

export function DeleteUserButton({
  userId,
  email,
}: {
  userId: number;
  email: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, isPending] = useActionState(
    deleteUserAction.bind(null, userId),
    initialState,
  );

  if (state && !state.ok && state.message) {
    return (
      <div className="text-[11px] text-red-700">
        {state.message}
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="ml-2 underline hover:text-ink"
        >
          閉じる
        </button>
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full border border-line px-3 py-1 text-[11px] font-extrabold text-ink-soft hover:border-red-300 hover:text-red-700"
      >
        削除
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="confirm" value="delete" />
      <span className="text-[11px] text-ink-soft">
        <span className="font-mono">{email}</span> を削除しますか？
      </span>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "削除中..." : "削除する"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-line px-3 py-1 text-[11px] font-extrabold text-ink-soft hover:text-ink"
        >
          やめる
        </button>
      </div>
    </form>
  );
}
