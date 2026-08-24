// /admin/releases/new の読み込み中表示。実ページは max-w-2xl / py-12 / mt-6 p-8 のフォーム 1 枚。
import { Bar, CardSkeleton, HeadingSkeleton, PageSkeleton } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="2xl">
      <HeadingSkeleton back />
      <CardSkeleton className="mt-6" padding="p-8">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Bar className="h-3 w-24" />
              <Bar className="mt-1.5 h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Bar className="mt-6 h-10 w-40 rounded-full" />
      </CardSkeleton>
    </PageSkeleton>
  );
}
