"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type SignupFormState } from "./actions";

const initialState: SignupFormState = { ok: true };

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signupAction, initialState);

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">会員登録</h1>
        <p className="mt-2 text-sm text-zinc-600">
          メールアドレスとパスワードでアカウントを作成します。登録後、認証メールを送信します。
        </p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-800">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-800">
              パスワード (8 文字以上)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-zinc-800">
              パスワード (確認)
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </div>

          {state && !state.ok && state.error ? (
            <p className="text-sm text-red-600">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {isPending ? "登録中..." : "登録する"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600">
          既にアカウントをお持ちですか?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
