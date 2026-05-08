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
    <main className="flex flex-1 flex-col bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/admin/releases"
          className="text-xs text-zinc-500 hover:underline"
        >
          ← リリース管理に戻る
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">新規リリース</h1>
        <p className="mt-2 text-sm text-zinc-600">
          拡張リポで <code>scripts/build-release.sh X.Y.Z</code> を実行して生成した
          ZIP ファイルと、生成された SHA-256 をアップロードしてください。
          ブラウザ側でも SHA-256 を再計算し、サーバ側と照合します。
        </p>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6">
          <UploadForm />
        </div>
      </div>
    </main>
  );
}
