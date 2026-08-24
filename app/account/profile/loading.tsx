// /account/profile の読み込み中表示。実ページは max-w-2xl / py-12 / カード 1 枚 (mt-8 p-8)。
import { Bar, CardSkeleton, HeadingSkeleton, PageSkeleton } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="2xl">
      <HeadingSkeleton back lead />
      <CardSkeleton className="mt-8" padding="p-8">
        {/* 氏名 / 電話 / 郵便番号 / 住所… の入力欄が縦に並ぶ */}
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Bar className="h-3 w-24" />
              <Bar className="mt-1.5 h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Bar className="h-10 w-32 rounded-full" />
        </div>
      </CardSkeleton>
    </PageSkeleton>
  );
}
