// /admin/verify — 管理者ログインの二段階認証 (メール OTP) 入力ページ。
// proxy.ts により、ここは基本認証 + ログイン済み admin であることは保証済み
// (admin_2fa クッキーだけが未成立の状態で誘導される)。
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Admin2faForm } from "./Admin2faForm";

export const metadata = { title: "管理者認証" };

export default async function AdminVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (!session.user.isAdmin) redirect("/account");

  const { callbackUrl } = await searchParams;
  // オープンリダイレクト防止: 同一サイトの /admin 配下のみ許可
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/admin";

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-md px-6 py-16">
        <h1 className="text-2xl font-black text-ink">管理者ログイン認証</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          セキュリティのため、ご登録メールアドレスに送信した確認コードを入力してください。
        </p>
        <Admin2faForm callbackUrl={safeCallback} />
      </div>
    </main>
  );
}
