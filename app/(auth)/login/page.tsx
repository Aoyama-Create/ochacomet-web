"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { ok: true };

function LoginForm() {
  // useSearchParams は CSR bailout を引き起こすので Suspense 配下で呼ぶ。
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/account";
  const verified = params.get("verified") === "1";

  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-zinc-900">ログイン</h1>
      {verified ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          メール認証が完了しました。ログインしてください。
        </p>
      ) : null}

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          {isPending ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        アカウント未登録の方は{" "}
        <Link href="/signup" className="font-medium text-zinc-900 underline">
          会員登録
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  // Suspense fallback。SSR / hydration 中の最低限の見た目。
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-zinc-900">ログイン</h1>
      <p className="mt-6 text-sm text-zinc-500">読み込み中...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-8">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
