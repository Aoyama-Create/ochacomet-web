// マイページ。LP と同じ緑単色基調 (canvas / surface / ink / primary)。
// 主な動線:
//   - プロフィール編集 (/account/profile)
//   - アプリのダウンロード (/account/download)
//   - サブスク状態 (/account/subscription)
//   - サインアウト (Server Action)
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

export const metadata = { title: "マイページ" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const { email, tier, proStatus, emailVerifiedAt, isAdmin } = session.user;
  const verified = !!emailVerifiedAt;

  const [profile] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);
  const displayName = profile?.displayName ?? "";

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-black tracking-tight text-ink">
          マイページ
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {displayName ? (
            <>
              <span className="font-extrabold text-ink">{displayName}</span>{" "}
              さん、こんにちは。
            </>
          ) : (
            "ご登録情報の確認と、アプリのダウンロードはこちらから。"
          )}
        </p>

        {!verified ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong className="font-extrabold">メール認証が未完了です。</strong>{" "}
            登録時に届いた認証メールのリンクを開いて完了させてください。
            アプリのダウンロード等、一部の機能が制限されます。
          </div>
        ) : null}

        {/* 基本情報 */}
        <section className="mt-8 rounded-2xl border border-line bg-surface p-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-extrabold text-ink">基本情報</h2>
            <Link
              href="/account/profile"
              className="text-xs font-extrabold text-primary hover:text-primary-hover"
            >
              プロフィールを編集 →
            </Link>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <Row
              label="お名前"
              value={
                displayName || <span className="text-amber-700">未設定</span>
              }
            />
            <Row label="メール" value={email} />
            <Row label="プラン" value={tier ?? "—"} />
            <Row
              label="Pro ステータス"
              value={proStatus ?? <span className="text-ink-soft">—</span>}
            />
            <Row
              label="メール認証"
              value={
                verified ? (
                  <span className="font-extrabold text-primary">完了</span>
                ) : (
                  <span className="font-extrabold text-amber-700">未完了</span>
                )
              }
            />
            {isAdmin ? (
              <Row
                label="権限"
                value={
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-extrabold text-violet-700">
                    admin
                  </span>
                }
              />
            ) : null}
          </dl>
        </section>

        {/* アクション */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <ActionCard
            href="/account/profile"
            title="プロフィール編集"
            body="名前・電話番号・住所を編集します。"
            cta="編集する →"
          />
          <ActionCard
            href="/account/download"
            title="アプリをダウンロード"
            body="macOS / Windows 版のアプリを取得します。"
            cta="ダウンロードへ →"
          />
          <ActionCard
            href="/account/subscription"
            title="サブスクリプション"
            body="プラン状態・アップグレード・解約。"
            cta="プランを見る →"
          />
        </section>

        {/* admin 専用 */}
        {isAdmin ? (
          <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-6">
            <h2 className="text-sm font-extrabold text-violet-900">Admin</h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href="/admin/users"
                className="rounded-full border border-violet-300 bg-white px-4 py-1.5 font-extrabold text-violet-700 hover:bg-violet-100"
              >
                ユーザー管理
              </Link>
              <Link
                href="/admin/releases"
                className="rounded-full border border-violet-300 bg-white px-4 py-1.5 font-extrabold text-violet-700 hover:bg-violet-100"
              >
                リリース管理
              </Link>
            </div>
          </section>
        ) : null}

        {/* サインアウト */}
        <section className="mt-10 flex justify-end">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-extrabold text-ink-soft hover:border-primary hover:text-primary"
            >
              サインアウト
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 py-2.5">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-mono text-xs text-ink">{value}</dd>
    </div>
  );
}

function ActionCard({
  href,
  title,
  body,
  cta,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_6px_18px_rgba(72,135,91,0.12)]"
    >
      <h3 className="text-base font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{body}</p>
      <p className="mt-4 text-[13px] font-extrabold text-primary group-hover:text-primary-hover">
        {cta}
      </p>
    </Link>
  );
}
