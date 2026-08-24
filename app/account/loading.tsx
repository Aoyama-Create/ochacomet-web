// /account (マイページ) の読み込み中表示。
//
// 実ページ (app/account/page.tsx) の寸法に合わせてある:
//   max-w-5xl / py-8 / セクション間 mt-5 / 基本情報カード p-6 /
//   dl は sm:2 列・lg:3 列 / ActionCard は sm:2 列・md:3 列の 3 枚
// ページ側の幅や列数を変えたら、ここも一緒に変えること。
import {
  Bar,
  CardSkeleton,
  DefinitionListSkeleton,
  PageSkeleton,
} from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="5xl" py="py-8">
      {/* h1 + リード文（戻るリンクは無いページ） */}
      <Bar className="h-8 w-40" />
      <Bar className="mt-2 h-3 w-64" />

      {/* 基本情報 */}
      <CardSkeleton className="mt-5" padding="p-6">
        <div className="flex items-baseline justify-between">
          <Bar className="h-5 w-24" />
          <Bar className="h-3 w-28" />
        </div>
        <DefinitionListSkeleton rows={5} />
      </CardSkeleton>

      {/* アクションカード 3 枚 */}
      <section className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <Bar className="h-4 w-32" />
            <Bar className="mt-3 h-3 w-full" />
            <Bar className="mt-1.5 h-3 w-2/3" />
            <Bar className="mt-3 h-3 w-20" />
          </div>
        ))}
      </section>

      {/* Admin / 退会 / サインアウトの行 */}
      <section className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Bar className="h-8 w-40" />
        <Bar className="h-8 w-40" />
      </section>
    </PageSkeleton>
  );
}
