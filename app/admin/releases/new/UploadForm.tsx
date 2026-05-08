"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Result =
  | { ok: true; version: string; sha256: string; sizeBytes: number }
  | { ok: false; reason: string; message: string };

// SHA-256 をブラウザ側で計算 (大きい file でも可、Web Crypto)。
async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [shaPreview, setShaPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleFile(f: File) {
    setFile(f);
    setShaPreview("計算中...");
    const sha = await sha256Hex(f);
    setShaPreview(sha);

    // ファイル名 ochacomet-v1.20.1.zip から version を推定
    const m = f.name.match(/ochacomet-v(\d+\.\d+\.\d+)\.zip$/);
    if (m && !version) setVersion(m[1]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !version || !shaPreview) return;
    setSubmitting(true);
    setResult(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("version", version);
    fd.set("sha256", shaPreview);
    fd.set("releaseNotes", releaseNotes);
    try {
      const res = await fetch("/api/admin/releases", {
        method: "POST",
        body: fd,
      });
      const body = (await res.json()) as Result;
      setResult(body);
      if (body.ok) {
        setTimeout(() => router.push("/admin/releases"), 800);
      }
    } catch (err) {
      setResult({
        ok: false,
        reason: "network",
        message: `ネットワークエラー: ${String(err)}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-800">
          ZIP ファイル
        </label>
        <input
          type="file"
          accept=".zip,application/zip"
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="mt-1 block w-full text-sm"
        />
        {shaPreview ? (
          <p className="mt-1 break-all font-mono text-[10px] text-zinc-500">
            SHA-256: {shaPreview}
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-800">
          Version
        </label>
        <input
          type="text"
          required
          pattern="\d+\.\d+\.\d+"
          placeholder="1.20.1"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="mt-1 w-40 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-800">
          リリースノート URL (任意)
        </label>
        <input
          type="url"
          value={releaseNotes}
          onChange={(e) => setReleaseNotes(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !file || !version || !shaPreview}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {submitting ? "アップロード中..." : "アップロード"}
      </button>

      {result ? (
        result.ok ? (
          <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            v{result.version} をアップロードしました ({(result.sizeBytes / 1024 / 1024).toFixed(2)} MB)
          </div>
        ) : (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {result.message} <span className="text-xs">({result.reason})</span>
          </div>
        )
      ) : null}
    </form>
  );
}
