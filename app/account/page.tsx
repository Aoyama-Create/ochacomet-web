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
import { ArrowRight, LogOut, UserMinus } from "lucide-react";
import { dangerLinkClass } from "@/components/ui/button";

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
      {/*
        横幅を max-w-5xl まで広げ、上下を py-10 に詰めてある。
        以前は max-w-3xl の縦積みで、フッター（約 280px）とヘッダー（57px）を
        足すとファーストビューに収まらなかった。横が余っていたので、
        基本情報の dl を 2 列に、Admin とサインアウトを 1 行にまとめている。
      */}
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
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
          <div className="mt-6 rounded-xl border border-warning-line bg-warning-soft px-4 py-3 text-sm text-warning-ink">
            <strong className="font-extrabold">メール認証が未完了です。</strong>{" "}
            登録時に届いた認証メールのリンクを開いて完了させてください。
            アプリのダウンロード等、一部の機能が制限されます。
          </div>
        ) : null}

        {/* 基本情報 */}
        <section className="mt-5 rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-extrabold text-ink">基本情報</h2>
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-primary transition-colors hover:text-primary-hover"
            >
              プロフィールを編集
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
            </Link>
          </div>
          {/* 2 列化で縦を約半分にする。app/account/subscription/page.tsx と同じ作法 */}
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Row
              label="お名前"
              value={
                displayName || <span className="text-warning-ink">未設定</span>
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
                  <span className="font-extrabold text-warning-ink">未完了</span>
                )
              }
            />
            {isAdmin ? (
              <Row
                label="権限"
                value={
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-extrabold text-accent-ink">
                    admin
                  </span>
                }
              />
            ) : null}
          </dl>
        </section>

        {/* アクション */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <ActionCard
            href="/account/profile"
            title="プロフィール編集"
            body="名前・電話番号・住所を編集します。"
            cta="編集する"
          />
          <ActionCard
            href="/account/download"
            title="アプリをダウンロード"
            body="macOS / Windows 版のアプリを取得します。"
            cta="ダウンロードへ"
          />
          <ActionCard
            href="/account/subscription"
            title="サブスクリプション"
            body="プラン状態・アップグレード・解約。"
            cta="プランを見る"
          />
        </section>

        {/*
          Admin とサインアウトを 1 行にまとめる。以前は別々のブロックで
          縦に約 90px 使っていた。Admin はカードの外枠と p-6 をやめ、
          violet はリンクの色と枠にだけ残して管理者向けの区別を保つ。
          Admin 非表示のときはサインアウトだけが右端に残り、従来と同じ見た目になる。
        */}
        <section className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {isAdmin ? (
              <>
                <span className="text-xs font-extrabold text-accent-ink">
                  Admin
                </span>
                <Link
                  href="/admin/users"
                  className="rounded-full border border-accent-line bg-surface px-4 py-1.5 font-extrabold text-accent-ink hover:bg-accent-soft"
                >
                  ユーザー管理
                </Link>
                <Link
                  href="/admin/releases"
                  className="rounded-full border border-accent-line bg-surface px-4 py-1.5 font-extrabold text-accent-ink hover:bg-accent-soft"
                >
                  リリース管理
                </Link>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            {/* 退会は取り消せない操作なので、赤で明示する。
                塗りつぶしにはしない（確定は /account/delete 側の赤ボタンで行う二段構え）。 */}
            <Link href="/account/delete" className={dangerLinkClass}>
              <UserMinus className="h-3.5 w-3.5" strokeWidth={2.4} />
              退会
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2 text-sm font-extrabold text-ink-soft transition-colors hover:border-primary hover:text-primary"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.2} />
                サインアウト
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="min-w-0 truncate font-mono text-xs text-ink">{value}</dd>
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
      className="group rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_6px_18px_rgba(72,135,91,0.12)]"
    >
      <h3 className="text-base font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{body}</p>
      <p className="mt-3 inline-flex items-center gap-1 text-[13px] font-extrabold text-primary group-hover:text-primary-hover">
        {cta}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.4}
        />
      </p>
    </Link>
  );
}
