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
      wide
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
        {/*
          2 列 2 行に組む。1 列だと項目数の差でログインページと高さが揃わないため。
          狭い画面では 1 列に落とす。
        */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* hint はラベル横に並ぶので、カラム幅 (約 214px) に収まる長さに保つ */}
          <Field label="お名前" htmlFor="displayName" hint="領収書の宛名に使用">
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              maxLength={80}
              autoComplete="name"
              placeholder="例: 青山 あるは"
              className={inputClass}
            />
          </Field>

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
        </div>

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
