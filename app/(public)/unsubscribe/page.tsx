// 配信停止確認ページ。メールクライアントの先読みアクセス対策として、
// GET で来たブラウザは確認画面を表示し、明示的に「停止する」ボタンを押させる。
"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard, primaryButtonClass } from "@/components/auth/AuthCard";

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

  if (!token) {
    return (
      <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
        トークンが見つかりません。メール内のリンクを開き直してください。
      </p>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm text-primary-deep">
        配信を停止しました。ご利用ありがとうございました。
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          エラー: {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className={primaryButtonClass}
      >
        {pending ? "停止中..." : "配信を停止する"}
      </button>
    </>
  );
}

function Fallback() {
  return <p className="text-sm text-ink-soft">読み込み中...</p>;
}

export default function UnsubscribePage() {
  return (
    <AuthCard
      title="マーケティング配信を停止"
      description="OchaComet のフレンドコード関連メールおよびその他のお知らせメールの配信を停止します。メール認証や購入確認などの transactional メールは引き続き送信されます。"
      footer={
        <Link href="/" className="text-ink-soft hover:text-primary">
          ホームに戻る
        </Link>
      }
    >
      <Suspense fallback={<Fallback />}>
        <UnsubscribeForm />
      </Suspense>
    </AuthCard>
  );
}
