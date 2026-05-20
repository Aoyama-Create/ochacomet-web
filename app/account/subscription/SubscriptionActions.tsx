"use client";

// Client Component: 「アップグレード」「Customer Portal を開く」ボタンを担当。
// fetch して返ってきた URL に window.location.href で遷移する。

import { useState, useTransition } from "react";

type UpgradeButtonProps = {
  variant: "monthly" | "yearly";
  label: string;
  highlighted?: boolean;
  note?: string;
};

export function UpgradeButton({
  variant,
  label,
  highlighted,
  note,
}: UpgradeButtonProps) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/account/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variant }),
        });
        const body = (await res.json()) as
          | { ok: true; url: string }
          | { ok: false; message: string };
        if (!body.ok) {
          setError(body.message);
          return;
        }
        window.location.href = body.url;
      } catch (e) {
        setError(String(e));
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className={
          highlighted
            ? "w-full rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] hover:bg-primary-hover disabled:opacity-50"
            : "w-full rounded-full border border-line bg-canvas px-4 py-2.5 text-sm font-extrabold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
        }
      >
        {pending ? "リダイレクト中..." : label}
      </button>
      {note ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">{note}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

export function CustomerPortalButton({ label }: { label: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/account/customer-portal", {
          method: "POST",
        });
        const body = (await res.json()) as
          | { ok: true; url: string }
          | { ok: false; message: string };
        if (!body.ok) {
          setError(body.message);
          return;
        }
        window.location.href = body.url;
      } catch (e) {
        setError(String(e));
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="rounded-full border border-line bg-canvas px-5 py-2 text-sm font-extrabold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
      >
        {pending ? "..." : label}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
