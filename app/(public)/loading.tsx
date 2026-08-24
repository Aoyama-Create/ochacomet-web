// (public) グループの読み込み中表示。現状のルートは /unsubscribe のみ。
// AuthCard を使っており、本文 + メール入力 + 停止ボタン + 「ホームに戻る」で構成される。
import { AuthCardSkeleton } from "@/components/skeleton/AuthCardSkeleton";

export default function Loading() {
  return <AuthCardSkeleton fields={1} />;
}
