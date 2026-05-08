"use server";

import { redirect } from "next/navigation";
import { signup } from "@/lib/auth/signup";

export type SignupFormState = {
  ok: boolean;
  error?: string;
};

export async function signupAction(
  _prev: SignupFormState | undefined,
  formData: FormData,
): Promise<SignupFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  const result = await signup({ email, password, passwordConfirm });
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  redirect("/verify-email/sent");
}
