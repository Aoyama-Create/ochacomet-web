"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

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

  const inputClass =
    "block w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[13px] font-extrabold text-ink">
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
          className="mt-1.5 block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-[12px] file:font-extrabold file:text-primary-deep hover:file:bg-primary-soft/80"
        />
        {shaPreview ? (
          <p className="mt-1.5 break-all font-mono text-[10px] text-ink-soft">
            SHA-256: {shaPreview}
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-[13px] font-extrabold text-ink">
          Version
        </label>
        <input
          type="text"
          required
          pattern="\d+\.\d+\.\d+"
          placeholder="1.20.1"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className={`mt-1.5 w-40 ${inputClass.replace("block w-full ", "")}`}
        />
      </div>

      <div>
        <label className="block text-[13px] font-extrabold text-ink">
          リリースノート URL (任意)
        </label>
        <input
          type="url"
          value={releaseNotes}
          onChange={(e) => setReleaseNotes(e.target.value)}
          placeholder="https://..."
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !file || !version || !shaPreview}
        className={buttonClass()}
      >
        <Upload className="h-4 w-4" strokeWidth={2.2} />
        {submitting ? "アップロード中..." : "アップロード"}
      </button>

      {result ? (
        result.ok ? (
          <div className="rounded-xl border border-primary/30 bg-primary-soft p-4 text-sm text-primary-deep">
            <strong className="font-extrabold">v{result.version}</strong> をアップロードしました ({(result.sizeBytes / 1024 / 1024).toFixed(2)} MB)
          </div>
        ) : (
          <div className="rounded-xl bg-danger-soft p-3 text-sm text-danger-ink">
            {result.message} <span className="text-xs">({result.reason})</span>
          </div>
        )
      ) : null}
    </form>
  );
}
