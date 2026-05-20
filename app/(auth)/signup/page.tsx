"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  AuthCard,
  Field,
  inputClass,
  primaryButtonClass,
} from "@/components/auth/AuthCard";
import { signupAction, type SignupFormState } from "./actions";

const initialState: SignupFormState = { ok: true };

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signupAction, initialState);

  return (
    <AuthCard
      title="会員登録"
      description="メールアドレスとパスワードでアカウントを作成します。登録後、認証メールを送信します。"
      footer={
        <>
          既にアカウントをお持ちですか?{" "}
          <Link
            href="/login"
            className="font-extrabold text-primary hover:text-primary-hover"
          >
            ログイン
          </Link>
        </>
      }
    >
      <form action={action} className="space-y-5">
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

        <Field label="パスワード" htmlFor="password" hint="8 文字以上">
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        <Field label="パスワード (確認)" htmlFor="passwordConfirm">
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
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
          {isPending ? "登録中..." : "登録する"}
        </button>

        <p className="text-center text-xs leading-relaxed text-ink-soft">
          登録すると{" "}
          <Link href="/terms" className="underline hover:text-primary">
            利用規約
          </Link>
          {" / "}
          <Link href="/privacy" className="underline hover:text-primary">
            プライバシーポリシー
          </Link>{" "}
          に同意したものとみなされます。
        </p>
      </form>
    </AuthCard>
  );
}
