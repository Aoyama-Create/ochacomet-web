// /account/download の読み込み中表示。実ページは max-w-3xl / py-12 / 主カード 1 枚 (mt-8 p-8)。
import { Bar, CardSkeleton, HeadingSkeleton, PageSkeleton } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="3xl">
      <HeadingSkeleton back lead />
      <CardSkeleton className="mt-8" padding="p-8">
        <Bar className="h-3 w-24" />
        {/* バージョン番号は text-3xl */}
        <Bar className="mt-3 h-9 w-40" />
        <Bar className="mt-3 h-3 w-56" />
        {/* ダウンロードボタンが横に並ぶ */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Bar className="h-10 w-48 rounded-full" />
          <Bar className="h-10 w-48 rounded-full" />
        </div>
      </CardSkeleton>
    </PageSkeleton>
  );
}
