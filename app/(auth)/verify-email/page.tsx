// /verify-email?token=XXX
// クエリのトークンを検証して users.email_verified_at を立てる。サーバーコンポーネント。
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { consumeVerificationToken } from "@/lib/auth/verifyEmail";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const outcome = token
    ? await consumeVerificationToken(token)
    : ({ ok: false, reason: "missing" } as const);

  if (outcome.ok) {
    return (
      <AuthCard
        title="メール認証が完了しました ☕"
        description={
          <>
            <span className="font-extrabold text-ink">{outcome.email}</span>{" "}
            を認証済としました。続いてログインしてください。
          </>
        }
      >
        <Link
          href="/login?verified=1"
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] hover:bg-primary-hover"
        >
          ログインに進む →
        </Link>
      </AuthCard>
    );
  }

  const message =
    outcome.reason === "missing"
      ? "認証トークンが見つかりません。メール内のリンクを開き直してください。"
      : outcome.reason === "user_missing"
        ? "このアカウントは存在しません。"
        : "認証リンクの有効期限が切れているか、無効です。再度サインアップしてください。";

  return (
    <AuthCard
      title="メール認証に失敗しました"
      description={
        <span className="text-red-700">{message}</span>
      }
    >
      <Link
        href="/signup"
        className="inline-flex w-full items-center justify-center rounded-full border border-line bg-canvas px-4 py-2.5 text-sm font-extrabold text-ink hover:border-primary hover:text-primary"
      >
        サインアップに戻る
      </Link>
    </AuthCard>
  );
}
