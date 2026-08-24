// 退会フォーム。signup と同じ useActionState + Server Action の作法。
"use client";

import { useActionState } from "react";
import { inputClass } from "@/components/auth/AuthCard";
import { deleteAccountAction, type DeleteAccountFormState } from "./actions";
import { UserMinus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

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
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={buttonClass({ variant: "danger", width: "full" })}
      >
        <UserMinus className="h-4 w-4" strokeWidth={2.2} />
        {isPending ? "退会処理中..." : "退会する"}
      </button>
    </form>
  );
}
