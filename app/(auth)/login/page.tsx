"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AuthCard,
  Field,
  inputClass,
  primaryButtonClass,
} from "@/components/auth/AuthCard";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { ok: true };

function LoginForm() {
  // useSearchParams は CSR bailout を引き起こすので Suspense 配下で呼ぶ。
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/account";
  const verified = params.get("verified") === "1";

  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <>
      {verified ? (
        <div className="mb-5 rounded-xl bg-primary-soft px-3.5 py-2.5 text-sm text-primary-deep">
          メール認証が完了しました。ログインしてください。
        </div>
      ) : null}

      <form action={action} className="space-y-5">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <Field label="メールアドレス" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </Field>

        <Field label="パスワード" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>

        {state && !state.ok && state.error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className={primaryButtonClass}
        >
          {isPending ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </>
  );
}

function LoginFallback() {
  return (
    <p className="text-sm text-ink-soft">読み込み中...</p>
  );
}

export default function LoginPage() {
  return (
    <AuthCard
      title="ログイン"
      footer={
        <>
          アカウント未登録の方は{" "}
          <Link
            href="/signup"
            className="font-extrabold text-primary hover:text-primary-hover"
          >
            会員登録
          </Link>
        </>
      }
    >
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
