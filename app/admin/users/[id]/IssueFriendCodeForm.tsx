"use client";

import { useActionState } from "react";
import { Ticket } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import {
  issueFriendCodeAction,
  type IssueFriendCodeFormState,
} from "./actions";

const initialState: IssueFriendCodeFormState = { ok: true };

export function IssueFriendCodeForm({ targetUserId }: { targetUserId: number }) {
  const action = issueFriendCodeAction.bind(null, targetUserId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <label
            htmlFor={`fc-duration-${targetUserId}`}
            className="block text-[12px] font-extrabold text-ink-soft"
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
            className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label
            htmlFor={`fc-note-${targetUserId}`}
            className="block text-[12px] font-extrabold text-ink-soft"
          >
            メモ (任意)
          </label>
          <input
            id={`fc-note-${targetUserId}`}
            name="note"
            type="text"
            maxLength={200}
            placeholder="例: テスター #1"
            className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={buttonClass()}
      >
        <Ticket className="h-4 w-4" strokeWidth={2.2} />
        {isPending ? "発行中..." : "フレンドコードを発行"}
      </button>

      {state && state.ok && state.code ? (
        <div className="rounded-xl border border-primary/30 bg-primary-soft p-4 text-sm text-primary-deep">
          <p className="font-extrabold">発行しました</p>
          <p className="mt-1 font-mono text-base text-ink">{state.code}</p>
          <p className="mt-1 text-xs">
            有効期限:{" "}
            {state.expiresAt
              ? new Date(state.expiresAt).toLocaleString()
              : "—"}
          </p>
        </div>
      ) : null}

      {state && !state.ok && state.message ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger-ink">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
