import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata = {
  title: "認証メールを送信しました",
};

export default function VerificationSentPage() {
  return (
    <AuthCard
      title="認証メールを送信しました"
      description="ご登録のメールアドレスに認証用のリンクを送信しました。24 時間以内にメール内のリンクを開いてアカウントを有効化してください。"
    >
      <p className="text-xs leading-relaxed text-ink-soft">
        メールが届かない場合は迷惑メールフォルダもご確認ください。
        数分待っても届かない場合は、メールアドレスが正しく入力されているか確認してから再度サインアップしてください。
      </p>
      <div className="mt-6 flex flex-col gap-2 text-center text-sm">
        <Link
          href="/login"
          className="font-extrabold text-primary hover:text-primary-hover"
        >
          ログインに進む
        </Link>
        <Link
          href="/signup"
          className="text-ink-soft hover:text-primary"
        >
          サインアップに戻る
        </Link>
      </div>
    </AuthCard>
  );
}
