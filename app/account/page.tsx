// マイページ placeholder。1st リリースでは /account/download への動線と
// 現在の tier 表示・サインアウトだけ持たせる。本実装は plan §3 Track 2 で。
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export const metadata = { title: "マイページ" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const { email, tier, emailVerifiedAt } = session.user;
  const verified = !!emailVerifiedAt;

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">マイページ</h1>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">メール</dt>
            <dd className="text-zinc-900">{email}</dd>
          </div>
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">プラン</dt>
            <dd className="text-zinc-900">{tier}</dd>
          </div>
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">メール認証</dt>
            <dd className={verified ? "text-emerald-700" : "text-amber-700"}>
              {verified ? "完了" : "未完了"}
            </dd>
          </div>
        </dl>

        {!verified ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            メール認証が未完了です。登録時に届いた認証メールのリンクを開いてください。
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/account/download"
            className="block rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800"
          >
            拡張をダウンロード (準備中)
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              サインアウト
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
