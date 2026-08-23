"use client";

import { useState, useTransition } from "react";

type InitialProfile = {
  displayName: string;
  phone: string;
  postalCode: string;
  addressRegion: string;
  addressCity: string;
  addressLine1: string;
  addressLine2: string;
  email: string;
  emailOptinMarketing: boolean;
};

const inputClass =
  "block w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function ProfileForm({ initial }: { initial: InitialProfile }) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [phone, setPhone] = useState(initial.phone);
  const [postalCode, setPostalCode] = useState(initial.postalCode);
  const [addressRegion, setAddressRegion] = useState(initial.addressRegion);
  const [addressCity, setAddressCity] = useState(initial.addressCity);
  const [addressLine1, setAddressLine1] = useState(initial.addressLine1);
  const [addressLine2, setAddressLine2] = useState(initial.addressLine2);
  const [emailOptinMarketing, setEmailOptinMarketing] = useState(
    initial.emailOptinMarketing,
  );
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/account/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName,
            phone,
            postalCode,
            addressRegion,
            addressCity,
            addressLine1,
            addressLine2,
            emailOptinMarketing,
          }),
        });
        const body = (await res.json()) as { ok: boolean; message?: string };
        if (!body.ok) {
          setError(body.message ?? "更新に失敗しました。");
          return;
        }
        setSavedAt(new Date());
      } catch (e) {
        setError(String(e));
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* メールアドレス (編集不可) */}
      <section>
        <h3 className="text-sm font-extrabold text-ink">アカウント</h3>
        <div className="mt-3">
          <label className="block text-[13px] font-extrabold text-ink">
            メールアドレス
          </label>
          <input
            type="email"
            value={initial.email}
            disabled
            className={`mt-1.5 ${inputClass} cursor-not-allowed bg-line/30 text-ink-soft`}
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            メールアドレスは認証と決済に紐付いているため変更できません。
            変更が必要な場合はサポートまでご連絡ください。
          </p>
        </div>
      </section>

      {/* 個人情報 */}
      <section>
        <h3 className="text-sm font-extrabold text-ink">個人情報</h3>
        <div className="mt-3 space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="block text-[13px] font-extrabold text-ink"
            >
              お名前
              <span className="ml-1.5 text-[10px] font-extrabold text-amber-700">
                必須
              </span>
            </label>
            <input
              id="displayName"
              type="text"
              required
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
              autoComplete="name"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-[13px] font-extrabold text-ink"
            >
              電話番号
              <span className="ml-1.5 text-[10px] font-extrabold text-ink-soft">
                任意
              </span>
            </label>
            <input
              id="phone"
              type="tel"
              maxLength={32}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例: 09012345678"
              className={`mt-1.5 ${inputClass}`}
              autoComplete="tel"
            />
          </div>
        </div>
      </section>

      {/* 住所 */}
      <section>
        <h3 className="text-sm font-extrabold text-ink">住所</h3>
        <p className="mt-1 text-xs text-ink-soft">
          領収書発行や Pro プランの請求時に使用します。すべて任意です。
        </p>
        <div className="mt-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div>
              <label
                htmlFor="postalCode"
                className="block text-[13px] font-extrabold text-ink"
              >
                郵便番号
              </label>
              <input
                id="postalCode"
                type="text"
                maxLength={16}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="例: 100-0001"
                className={`mt-1.5 ${inputClass}`}
                autoComplete="postal-code"
              />
            </div>
            <div>
              <label
                htmlFor="addressRegion"
                className="block text-[13px] font-extrabold text-ink"
              >
                都道府県
              </label>
              <input
                id="addressRegion"
                type="text"
                maxLength={64}
                value={addressRegion}
                onChange={(e) => setAddressRegion(e.target.value)}
                placeholder="例: 東京都"
                className={`mt-1.5 ${inputClass}`}
                autoComplete="address-level1"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="addressCity"
              className="block text-[13px] font-extrabold text-ink"
            >
              市区町村
            </label>
            <input
              id="addressCity"
              type="text"
              maxLength={64}
              value={addressCity}
              onChange={(e) => setAddressCity(e.target.value)}
              placeholder="例: 千代田区"
              className={`mt-1.5 ${inputClass}`}
              autoComplete="address-level2"
            />
          </div>

          <div>
            <label
              htmlFor="addressLine1"
              className="block text-[13px] font-extrabold text-ink"
            >
              番地
            </label>
            <input
              id="addressLine1"
              type="text"
              maxLength={128}
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="例: 千代田 1-1"
              className={`mt-1.5 ${inputClass}`}
              autoComplete="address-line1"
            />
          </div>

          <div>
            <label
              htmlFor="addressLine2"
              className="block text-[13px] font-extrabold text-ink"
            >
              建物名・部屋番号
            </label>
            <input
              id="addressLine2"
              type="text"
              maxLength={128}
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="例: ○○ビル 101 号室"
              className={`mt-1.5 ${inputClass}`}
              autoComplete="address-line2"
            />
          </div>
        </div>
      </section>

      {/*
        マーケティングメールの同意。プライバシーポリシー 第 4 条と対応。
        既定オフで、OFF → ON にしたときは送信予定が未来のキャンペーンだけ再開する
        (lib/account/marketingOptin.ts)。
      */}
      <section>
        <h2 className="text-sm font-extrabold text-ink">メールのお知らせ</h2>
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={emailOptinMarketing}
            onChange={(e) => setEmailOptinMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-[#48875b] focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span>
            新機能・キャンペーンのお知らせを受け取る
            <span className="mt-0.5 block text-xs text-ink-soft">
              認証・決済・重要なお知らせは、この設定に関わらずお送りします。
            </span>
          </span>
        </label>
      </section>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {savedAt ? (
        <p className="rounded-xl border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary-deep">
          保存しました ({savedAt.toLocaleTimeString()})
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-7 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(72,135,91,0.32)] hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
