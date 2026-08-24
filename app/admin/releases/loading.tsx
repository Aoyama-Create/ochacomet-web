// /admin/releases の読み込み中表示。
// 実ページは max-w-6xl / py-12 / 戻るリンク + h1 と右上の新規アップロードボタン / 5 列テーブル。
import { Bar, PageSkeleton, TableSkeleton } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="6xl">
      <div className="flex items-start justify-between">
        <div>
          <Bar className="h-3 w-32" />
          <Bar className="mt-2 h-8 w-40" />
        </div>
        <Bar className="h-[42px] w-44 rounded-full" />
      </div>
      <TableSkeleton columns={5} rows={5} />
    </PageSkeleton>
  );
}
