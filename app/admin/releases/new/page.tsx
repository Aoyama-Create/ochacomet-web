// /admin/releases/new — ZIP アップロード画面
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { UploadForm } from "./UploadForm";

export const metadata = { title: "新規リリース" };

export default async function NewReleasePage() {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/login?callbackUrl=/admin/releases/new");

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <Link
          href="/admin/releases"
          className="text-xs text-ink-soft hover:text-primary"
        >
          ← リリース管理に戻る
        </Link>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">
          新規リリース
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          拡張リポで{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-[12px]">
            scripts/build-release.sh X.Y.Z
          </code>{" "}
          を実行して生成した ZIP ファイルと、生成された SHA-256
          をアップロードしてください。
          ブラウザ側でも SHA-256 を再計算し、サーバ側と照合します。
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-8">
          <UploadForm />
        </div>
      </div>
    </main>
  );
}
