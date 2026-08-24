// /admin/users の読み込み中表示。
// 実ページは max-w-6xl / py-12 / 見出し行(右にリリース管理リンク) / 検索フォーム /
// 9 列のテーブル (ID・ユーザー・電話・Tier・Friend Code・期限・認証・登録日・操作)。
// 列を増減したら columns も合わせること。
import { Bar, PageSkeleton, TableSkeleton } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="6xl">
      <div className="flex items-center justify-between">
        <Bar className="h-8 w-48" />
        <Bar className="h-3 w-28" />
      </div>
      {/* 検索フォーム: input + ボタン */}
      <div className="mt-6 flex gap-2">
        <Bar className="h-[42px] flex-1 rounded-xl" />
        <Bar className="h-[42px] w-24 rounded-full" />
      </div>
      <TableSkeleton columns={9} rows={8} />
    </PageSkeleton>
  );
}
