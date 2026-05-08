"use client";

import { useActionState } from "react";
import {
  issueFriendCodeAction,
  type IssueFriendCodeFormState,
} from "./actions";

const initialState: IssueFriendCodeFormState = { ok: true };

export function IssueFriendCodeForm({ targetUserId }: { targetUserId: number }) {
  const action = issueFriendCodeAction.bind(null, targetUserId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label
          htmlFor={`fc-duration-${targetUserId}`}
          className="block text-xs font-medium text-zinc-700"
        >
          有効期間 (日)
        </label>
        <input
          id={`fc-duration-${targetUserId}`}
          name="durationDays"
          type="number"
          min={1}
          max={365}
          defaultValue={30}
          className="mt-1 w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor={`fc-note-${targetUserId}`}
          className="block text-xs font-medium text-zinc-700"
        >
          メモ (任意)
        </label>
        <input
          id={`fc-note-${targetUserId}`}
          name="note"
          type="text"
          maxLength={200}
          placeholder="例: テスター #1"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending ? "発行中..." : "フレンドコードを発行"}
      </button>

      {state && state.ok && state.code ? (
        <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          <p className="font-medium">発行しました</p>
          <p className="mt-1 font-mono text-base">{state.code}</p>
          <p className="mt-1 text-xs">
            有効期限:{" "}
            {state.expiresAt
              ? new Date(state.expiresAt).toLocaleString()
              : "—"}
          </p>
        </div>
      ) : null}

      {state && !state.ok && state.message ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
    </form>
  );
}
