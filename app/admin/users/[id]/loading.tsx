// /admin/users/[id] の読み込み中表示。
// 実ページは max-w-3xl / py-12 / 戻るリンク + h1 + サブテキスト / mt-6 p-8 のカード 4 枚。
import { Bar, CardSkeleton, HeadingSkeleton, PageSkeleton } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="3xl">
      <HeadingSkeleton back lead />
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} className="mt-6" padding="p-8">
          <Bar className="h-3 w-32" />
          <div className="mt-4 space-y-2">
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-2/3" />
          </div>
        </CardSkeleton>
      ))}
    </PageSkeleton>
  );
}
