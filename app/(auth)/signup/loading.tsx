// /signup の読み込み中表示。AuthCard に wide を渡しているので max-w-lg、
// 入力欄は 2 列 2 行 (お名前・メール・パスワード・確認)。
import { AuthCardSkeleton } from "@/components/skeleton/AuthCardSkeleton";

export default function Loading() {
  return <AuthCardSkeleton wide fields={4} />;
}
