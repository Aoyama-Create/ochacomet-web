// /account/subscription — サブスク管理ページ
//
// 認証必須 (middleware で /account/* ガード済、ここでは redirect で防御的にも対応)。
// users の tier / proStatus / proSource から現状を判断して 5 つの状態 UI を出し分ける。
//
// アップグレード / 解約 / カード変更は LS Customer Portal に委譲することで実装最小化。
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import {
  CustomerPortalButton,
  UpgradeButton,
} from "./SubscriptionActions";

export const metadata = { title: "サブスクリプション" };

type StateView = {
  status: "free" | "friend" | "trialing" | "active" | "past_due" | "cancelled";
  badgeText: string;
  badgeClass: string;
  bodyTitle: string;
  bodyDescription: string;
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/subscription");

  const userId = Number(session.user.id);
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      tier: users.tier,
      proStatus: users.proStatus,
      proSource: users.proSource,
      lsCustomerId: users.lsCustomerId,
      lsSubscriptionId: users.lsSubscriptionId,
      lsTrialEndsAt: users.lsTrialEndsAt,
      friendExpiresAt: users.friendExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) redirect("/login");

  const { checkout } = await searchParams;
  const showCheckoutSuccess = checkout === "success";

  const view = computeStateView({
    tier: u.tier,
    proStatus: u.proStatus,
    proSource: u.proSource,
    lsTrialEndsAt: u.lsTrialEndsAt,
    friendExpiresAt: u.friendExpiresAt,
  });

  const hasLsCustomer = !!u.lsCustomerId;

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/account"
          className="text-xs text-ink-soft hover:text-primary"
        >
          ← マイページに戻る
        </Link>
        <h1 className="mt-1 text-2xl font-black text-ink">
          サブスクリプション
        </h1>

        {showCheckoutSuccess ? (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary-soft px-5 py-4 text-sm text-primary-deep">
            ご購入ありがとうございます! Lemon Squeezy からの確定通知を反映中です。
            数分後に表示が更新されない場合は再読み込みしてください。
          </div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-line bg-surface p-8">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-lg font-extrabold text-ink">現在のプラン</h2>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold ${view.badgeClass}`}
            >
              {view.badgeText}
            </span>
          </div>

          <p className="mt-4 text-[15px] font-bold text-ink">
            {view.bodyTitle}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {view.bodyDescription}
          </p>

          <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Field label="メール">{u.email}</Field>
            <Field label="Tier">{u.tier}</Field>
            <Field label="Pro Status">{u.proStatus ?? "—"}</Field>
            <Field label="Pro Source">{u.proSource ?? "—"}</Field>
            <Field label="トライアル終了">
              {u.lsTrialEndsAt
                ? new Date(u.lsTrialEndsAt).toLocaleString()
                : "—"}
            </Field>
            <Field label="フレンド期限">
              {u.friendExpiresAt
                ? new Date(u.friendExpiresAt).toLocaleString()
                : "—"}
            </Field>
          </dl>
        </section>

        {/* アップグレード CTA: free / friend / past_due / cancelled で表示 */}
        {(view.status === "free" ||
          view.status === "friend" ||
          view.status === "past_due" ||
          view.status === "cancelled") && (
          <section className="mt-8 rounded-2xl border border-line bg-surface p-8">
            <h2 className="text-lg font-extrabold text-ink">
              {view.status === "past_due"
                ? "支払い方法を更新する"
                : "Pro プランへアップグレード"}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Pro プランでは、ギフト集計・ユーザーランキング・CSV エクスポートなど、
              配信の振り返りに役立つ機能が解放されます。14 日間の無料トライアル付き。
            </p>

            {view.status === "past_due" ? (
              <div className="mt-6">
                <CustomerPortalButton label="支払い方法を変更する" />
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <UpgradeButton
                  variant="monthly"
                  label="月額 ¥1,480 で始める"
                  highlighted
                  note="14 日無料トライアル付き。請求は 15 日目から。"
                />
                <UpgradeButton
                  variant="yearly"
                  label="年額 ¥14,800 で始める"
                  note="月額換算 ¥1,233 (2 ヶ月分お得)"
                />
              </div>
            )}
          </section>
        )}

        {/* Customer Portal リンク: LS と紐付いている全ステータス */}
        {hasLsCustomer && (
          <section className="mt-8 rounded-2xl border border-line bg-surface p-8">
            <h2 className="text-lg font-extrabold text-ink">
              プランの管理 (Customer Portal)
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              プラン変更 (月額 ↔ 年額)、支払い方法の変更、解約は Lemon Squeezy の
              Customer Portal から行えます。
            </p>
            <div className="mt-6">
              <CustomerPortalButton label="Customer Portal を開く" />
            </div>
          </section>
        )}

        {view.status === "friend" && (
          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-relaxed text-amber-900">
            <p>
              フレンドコードによる Pro 試用中です ({u.friendExpiresAt && new Date(u.friendExpiresAt).toLocaleDateString()} まで)。
              期限を過ぎると Free プランに戻ります。継続して Pro を使うには、有効期限内に
              Pro プランへアップグレードしてください。
            </p>
          </section>
        )}

        <section className="mt-12 text-xs text-ink-soft">
          <p>
            お支払いの詳細は{" "}
            <Link href="/pricing" className="underline hover:text-primary">
              料金ページ
            </Link>{" "}
            /{" "}
            <Link href="/refund" className="underline hover:text-primary">
              返金ポリシー
            </Link>{" "}
            /{" "}
            <Link href="/legal" className="underline hover:text-primary">
              特定商取引法に基づく表記
            </Link>{" "}
            をご確認ください。
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 py-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-mono text-xs text-ink">{children}</dd>
    </div>
  );
}

function computeStateView(args: {
  tier: string;
  proStatus: string | null;
  proSource: string | null;
  lsTrialEndsAt: Date | null;
  friendExpiresAt: Date | null;
}): StateView {
  const { tier, proStatus, lsTrialEndsAt } = args;

  if (tier === "banned") {
    return {
      status: "cancelled",
      badgeText: "停止中",
      badgeClass: "bg-red-100 text-red-800",
      bodyTitle: "アカウントが停止されています",
      bodyDescription:
        "ご利用の停止についてはお問い合わせください。",
    };
  }

  if (tier === "friend") {
    return {
      status: "friend",
      badgeText: "Friend (試用中)",
      badgeClass: "bg-amber-100 text-amber-800",
      bodyTitle: "フレンドコードで Pro 機能を試用中",
      bodyDescription:
        "正規購入ではなく招待による試用期間です。Pro 機能をお楽しみください。",
    };
  }

  if (proStatus === "trialing") {
    const daysRemaining = lsTrialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (lsTrialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
          ),
        )
      : null;
    return {
      status: "trialing",
      badgeText: "Pro (トライアル)",
      badgeClass: "bg-emerald-100 text-emerald-800",
      bodyTitle: `無料トライアル中${
        daysRemaining != null ? ` (残り ${daysRemaining} 日)` : ""
      }`,
      bodyDescription:
        "トライアル終了後に自動的に課金が始まります。いつでも解約できます。",
    };
  }
  if (proStatus === "active") {
    return {
      status: "active",
      badgeText: "Pro (加入中)",
      badgeClass: "bg-emerald-100 text-emerald-800",
      bodyTitle: "Pro プランに加入中",
      bodyDescription:
        "すべての Pro 機能をご利用いただけます。プラン変更・解約は下記の Customer Portal から。",
    };
  }
  if (proStatus === "past_due") {
    return {
      status: "past_due",
      badgeText: "支払い失敗",
      badgeClass: "bg-red-100 text-red-800",
      bodyTitle: "支払いが失敗しています",
      bodyDescription:
        "クレジットカードの有効期限切れ等で課金が失敗しました。Customer Portal で支払い方法を更新してください。",
    };
  }
  if (proStatus === "cancelled") {
    return {
      status: "cancelled",
      badgeText: "解約済み",
      badgeClass: "bg-zinc-200 text-zinc-700",
      bodyTitle: "解約済み (Free プランに移行)",
      bodyDescription:
        "Pro プランの契約が終了しました。再加入する場合は下のアップグレードからどうぞ。",
    };
  }

  return {
    status: "free",
    badgeText: "Free",
    badgeClass: "bg-zinc-200 text-zinc-700",
    bodyTitle: "Free プランをご利用中",
    bodyDescription:
      "基本機能 (自動コメント送信・テンプレート) は無料でお使いいただけます。Pro 機能を試したい方は 14 日間の無料トライアルから。",
  };
}
