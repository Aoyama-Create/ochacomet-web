// AuthCard を使うページ (login / signup / verify-email / unsubscribe) 用のスケルトン。
// components/auth/AuthCard.tsx の寸法をそのまま写す:
//   main: px-6 py-12 / 器: max-w-md (wide なら max-w-lg)
//   カード: rounded-2xl border p-8 + shadow / h1: text-2xl / description: mt-3
//   本体: mt-6 / footer: mt-5 text-center
import { Bar } from "./Skeleton";

export function AuthCardSkeleton({
  wide = false,
  description = true,
  /** 入力欄の数。0 ならフォームなし (verify-email 等) */
  fields = 2,
  /** 送信ボタンを出すか */
  button = true,
  /** カード下の footer 行を出すか */
  footer = true,
}: {
  wide?: boolean;
  description?: boolean;
  fields?: number;
  button?: boolean;
  footer?: boolean;
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"}`}>
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-[0_8px_24px_rgba(72,135,91,0.06)]">
          <Bar className="h-8 w-40" />
          {description ? (
            <>
              <Bar className="mt-3 h-3 w-full" />
              <Bar className="mt-1.5 h-3 w-2/3" />
            </>
          ) : null}
          <div className="mt-6 space-y-5">
            {/* signup は入力欄を 2 列に組むので、wide のときは grid で並べる */}
            <div className={wide ? "grid gap-5 sm:grid-cols-2" : "space-y-5"}>
              {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                  <Bar className="h-3 w-24" />
                  <Bar className="mt-1.5 h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
            {button ? <Bar className="h-10 w-full rounded-full" /> : null}
          </div>
        </div>
        {footer ? <Bar className="mx-auto mt-5 h-3 w-56" /> : null}
      </div>
    </main>
  );
}
