// 退会フォーム。signup と同じ useActionState + Server Action の作法。
"use client";

import { useActionState } from "react";
import { inputClass } from "@/components/auth/AuthCard";
import { deleteAccountAction, type DeleteAccountFormState } from "./actions";

const initialState: DeleteAccountFormState = { ok: true };

export function DeleteAccountForm() {
  const [state, action, isPending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6 grid gap-4">
      <div>
        <label
          htmlFor="password"
          className="block text-[13px] font-extrabold text-ink"
        >
          パスワード
        </label>
        <p className="mt-1.5 text-xs text-ink-soft">
          ご本人確認のため、現在のパスワードを入力してください。
        </p>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={`${inputClass} mt-1.5`}
        />
      </div>

      {state && !state.ok && state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "退会処理中..." : "退会する"}
      </button>
    </form>
  );
}
