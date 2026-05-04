import Link from "next/link";

export const metadata = {
  title: "認証メールを送信しました",
};

export default function VerificationSentPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-bold text-zinc-900">認証メールを送信しました</h1>
        <p className="mt-4 text-sm text-zinc-700 leading-relaxed">
          ご登録のメールアドレスに認証用のリンクを送信しました。
          24 時間以内にメール内のリンクを開いてアカウントを有効化してください。
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          メールが届かない場合は迷惑メールフォルダもご確認ください。
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-zinc-900 underline"
        >
          ログインに戻る
        </Link>
      </div>
    </main>
  );
}
