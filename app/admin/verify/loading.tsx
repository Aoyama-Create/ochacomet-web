// /admin/verify (管理者 2FA) の読み込み中表示。実ページは max-w-md / py-16 のカード 1 枚。
import { Bar, CardSkeleton, PageSkeleton } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return (
    <PageSkeleton width="md" py="py-16">
      <CardSkeleton className="" padding="p-8">
        <Bar className="h-6 w-40" />
        <Bar className="mt-3 h-3 w-full" />
        {/* OTP 入力は text-2xl の 1 本 */}
        <Bar className="mt-6 h-14 w-full rounded-xl" />
        <Bar className="mt-4 h-10 w-full rounded-full" />
      </CardSkeleton>
    </PageSkeleton>
  );
}
