// /account/profile — プロフィール編集ページ。
// 名前 / 電話 / 住所をマイページから後追加・編集できる。
// メールアドレスは認証 + 決済 + Brevo に紐付くため表示のみで編集不可。
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { ProfileForm } from "./ProfileForm";
import { BackLink } from "@/components/ui/BackLink";

export const metadata = { title: "プロフィール" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/profile");

  const [u] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      phone: users.phone,
      postalCode: users.postalCode,
      addressRegion: users.addressRegion,
      addressCity: users.addressCity,
      addressLine1: users.addressLine1,
      addressLine2: users.addressLine2,
      emailOptinMarketing: users.emailOptinMarketing,
    })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);

  if (!u) redirect("/login");

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <BackLink href="/account">マイページに戻る</BackLink>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">
          プロフィール
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          領収書の宛名や、Pro プランの請求情報に使用します。
          いつでも変更できます。
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-8">
          <ProfileForm
            initial={{
              displayName: u.displayName ?? "",
              phone: u.phone ?? "",
              postalCode: u.postalCode ?? "",
              addressRegion: u.addressRegion ?? "",
              addressCity: u.addressCity ?? "",
              addressLine1: u.addressLine1 ?? "",
              addressLine2: u.addressLine2 ?? "",
              email: u.email,
              emailOptinMarketing: u.emailOptinMarketing,
            }}
          />
        </div>
      </div>
    </main>
  );
}
