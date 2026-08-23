// 退会ページ。
//
// プライバシーポリシー 第 9 条 3 項と利用規約 第 16 条がここを指している。
// 有料プラン契約中はフォームを出さず、先に解約へ誘導する
// (アカウントだけ消えて Stripe の課金が続く事故を防ぐ。判定は
//  lib/account/deleteUser.ts 側でも行うので、ここは UI の親切さの層)。
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { DeleteAccountForm } from "./DeleteAccountForm";

export const metadata = { title: "退会" };

const ACTIVE_SUBSCRIPTION_STATUSES = ["trialing", "active"];

export default async function DeleteAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/delete");

  const [row] = await db
    .select({ proStatus: users.proStatus, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);

  const subscriptionActive =
    !!row?.proStatus && ACTIVE_SUBSCRIPTION_STATUSES.includes(row.proStatus);

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <Link
          href="/account"
          className="text-xs font-extrabold text-ink-soft hover:text-primary"
        >
          ← マイページ
        </Link>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-ink">
          退会
        </h1>

        <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-sm font-extrabold text-ink">
            退会すると、次のようになります
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
            <li>アカウント情報 (メールアドレス、お名前、連絡先) を削除します。</li>
            <li>ライセンスキーとフレンドコードが無効になり、アプリの Pro 機能を利用できなくなります。</li>
            <li>会員サイトにログインできなくなり、アプリを再ダウンロードできなくなります。</li>
            <li>メールの配信を停止します。</li>
            <li>
              ダウンロード履歴などの記録は、不正利用の防止と監査のため、
              アカウントとの紐付けを外したうえで一定期間残ります
              (詳細は <Link href="/privacy">プライバシーポリシー</Link> 第 9 条)。
            </li>
            <li>
              端末内に保存されたテンプレートやギフトの記録は、退会後もお使いの端末に残ります。
              必要に応じてご自身で削除してください。
            </li>
          </ul>
          <p className="mt-4 text-sm font-extrabold text-red-700">
            退会後にアカウントを元に戻すことはできません。
          </p>
        </section>

        {subscriptionActive ? (
          <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-sm font-extrabold text-amber-900">
              先に有料プランの解約が必要です
            </h2>
            <p className="mt-2 text-sm text-amber-900">
              有料プランを契約中のまま退会すると、解約されないまま請求が続いてしまいます。
              先にサブスクリプションを解約し、契約期間の満了後にこのページへお戻りください。
            </p>
            <Link
              href="/account/subscription"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white hover:bg-primary-hover"
            >
              サブスクリプションの管理へ →
            </Link>
          </section>
        ) : row?.isAdmin ? (
          <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-6 text-sm text-violet-900">
            管理者アカウントはこの画面からは退会できません。
            先に管理者権限を外す必要があります。
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-line bg-surface p-6">
            <DeleteAccountForm />
          </section>
        )}
      </div>
    </main>
  );
}
