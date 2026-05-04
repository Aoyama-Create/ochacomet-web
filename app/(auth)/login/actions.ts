"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginFormState = {
  ok: boolean;
  error?: string;
};

export async function loginAction(
  _prev: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");

  if (!email || !password) {
    return { ok: false, error: "メールアドレスとパスワードを入力してください。" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
    // signIn は redirect を投げるので通常ここに到達しない
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) {
      // CredentialsSignin / その他は同じメッセージで返す (列挙対策)
      return {
        ok: false,
        error: "メールアドレスまたはパスワードが正しくありません。",
      };
    }
    // signIn の redirect は NEXT_REDIRECT 例外なので再スロー
    throw e;
  }
}
