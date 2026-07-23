"use client";

// 管理者 2FA のコード入力フォーム。マウント時にコードを送信 (request)、
// 入力を verify に投げ、成功したら callbackUrl に遷移する。
import { useEffect, useRef, useState, useTransition } from "react";

export function Admin2faForm({ callbackUrl }: { callbackUrl: string }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sentOnce = useRef(false);

  async function requestCode() {
    setErr(null);
    setMsg(null);
    const res = await fetch("/api/admin/2fa/request", { method: "POST" });
    if (res.ok) {
      setMsg("確認コードをメールに送信しました。");
    } else {
      setErr("コードの送信に失敗しました。時間をおいて再度お試しください。");
    }
  }

  // 初回マウントで自動送信 (StrictMode の二重実行を ref で抑止)
  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    void requestCode();
  }, []);

  function verify() {
    setErr(null);
    start(async () => {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && body.ok) {
        window.location.href = callbackUrl;
        return;
      }
      setErr("コードが正しくないか、期限切れです。再送のうえお試しください。");
    });
  }

  return (
    <div className="mt-8 rounded-2xl border border-line bg-surface p-8">
      <label className="block text-sm font-bold text-ink" htmlFor="otp">
        確認コード (6桁)
      </label>
      <input
        id="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && code.length === 6) verify();
        }}
        className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-ink"
        placeholder="______"
      />
      <button
        type="button"
        onClick={verify}
        disabled={pending || code.length !== 6}
        className="mt-4 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "確認中..." : "認証する"}
      </button>

      <button
        type="button"
        onClick={requestCode}
        disabled={pending}
        className="mt-3 w-full text-xs text-ink-soft underline hover:text-primary"
      >
        コードを再送する
      </button>

      {msg ? <p className="mt-3 text-xs text-primary-deep">{msg}</p> : null}
      {err ? <p className="mt-3 text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
