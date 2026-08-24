// (auth) グループの既定の読み込み中表示 = /login の形。
//
// Cache Components 有効下では「Suspense の外での動的アクセス」がビルドエラーになる。
// これらのページは searchParams (callbackUrl / token など) を読むため境界が要る。
// loading.tsx を置けば Next.js が自動で Suspense を張るので、ページ側は触らずに済む。
//
// 形の違うページ (signup は 2 列で max-w-lg、verify-email はフォーム無し) には
// それぞれ専用の loading.tsx を置いてある。
import { AuthCardSkeleton } from "@/components/skeleton/AuthCardSkeleton";

export default function Loading() {
  // /login: description 無し、メール + パスワードの 2 欄、footer に「会員登録」
  return <AuthCardSkeleton description={false} fields={2} />;
}
