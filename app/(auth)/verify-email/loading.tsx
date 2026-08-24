// /verify-email の読み込み中表示。フォームは無く、本文と導線リンクだけのページ。
import { AuthCardSkeleton } from "@/components/skeleton/AuthCardSkeleton";

export default function Loading() {
  return <AuthCardSkeleton fields={0} />;
}
