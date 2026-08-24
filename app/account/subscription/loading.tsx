// /account/subscription の読み込み中表示。
// 実ページは max-w-3xl / py-12 / カードが状態により 1〜5 枚 (mt-8 p-8)。
// 出しすぎると確定時に縮むので、必ず出る「現在のプラン」1 枚に絞る。
import { CardSkeleton, DefinitionListSkeleton, HeadingSkeleton, PageSkeleton, Bar } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="3xl">
      <HeadingSkeleton back />
      <CardSkeleton className="mt-8" padding="p-8">
        <Bar className="h-5 w-32" />
        <DefinitionListSkeleton rows={6} cols="sm:grid-cols-2" />
      </CardSkeleton>
    </PageSkeleton>
  );
}
