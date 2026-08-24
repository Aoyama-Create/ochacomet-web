// /account/delete の読み込み中表示。実ページは max-w-2xl / py-12 / mt-6 と mt-5 のカード 2 枚 (p-6)。
import { Bar, CardSkeleton, HeadingSkeleton, PageSkeleton } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="2xl">
      <HeadingSkeleton back />
      <CardSkeleton className="mt-6" padding="p-6">
        <Bar className="h-3.5 w-56" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className="h-3" />
          ))}
        </div>
        <Bar className="mt-4 h-3 w-72" />
      </CardSkeleton>
      <CardSkeleton className="mt-5" padding="p-6">
        <Bar className="h-3 w-24" />
        <Bar className="mt-1.5 h-10 w-full rounded-xl" />
        <Bar className="mt-4 h-10 w-full rounded-full" />
      </CardSkeleton>
    </PageSkeleton>
  );
}
