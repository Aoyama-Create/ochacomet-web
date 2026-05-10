// 配信停止確認ページ。メールクライアントの先読みアクセス対策として、
// GET で来たブラウザは確認画面を表示し、明示的に「停止する」ボタンを押させる。
"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function UnsubscribeForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      try {
        const res = await fetch(
          `/api/email/unsubscribe?token=${encodeURIComponent(token)}`,
          { method: "POST" },
        );
        const body = (await res.json()) as { ok?: boolean; error?: string };
        if (body.ok) setDone(true);
        else setError(body.error ?? "unknown");
      } catch (e) {
        setError(String(e));
      }
    });
  }

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-zinc-900">
        マーケティング配信を停止
      </h1>
      <p className="mt-3 text-sm text-zinc-700 leading-relaxed">
        OchaComet のフレンドコード関連メールおよびその他のお知らせメールの配信を停止します。
        メール認証や購入確認などの transactional メールは引き続き送信されます。
      </p>

      {!token ? (
        <p className="mt-6 text-sm text-red-600">
          トークンが見つかりません。メール内のリンクを開き直してください。
        </p>
      ) : done ? (
        <div className="mt-6 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          配信を停止しました。ご利用ありがとうございました。
        </div>
      ) : (
        <>
          {error ? (
            <p className="mt-3 text-sm text-red-600">エラー: {error}</p>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "停止中..." : "配信を停止する"}
          </button>
        </>
      )}

      <p className="mt-6 text-xs text-zinc-500">
        <Link href="/" className="underline">
          ホームに戻る
        </Link>
      </p>
    </div>
  );
}

function Fallback() {
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-sm text-zinc-500">
      読み込み中...
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-8">
      <Suspense fallback={<Fallback />}>
        <UnsubscribeForm />
      </Suspense>
    </main>
  );
}
