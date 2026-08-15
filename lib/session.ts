// セッション取得の入口。**サーバーコンポーネントからは auth() を直接呼ばず、これを使う。**
//
// ヘッダー・フッター・LP の CTA など、ログイン状態で出し分ける箇所が増えると、
// 1 リクエストのレンダリング中に auth() が 3〜5 回呼ばれる。auth() は毎回 JWT を
// 検証するので、そのぶん無駄が積み上がる。
//
// React の cache() は**同一リクエスト内で結果を使い回す**ので、何箇所から呼んでも
// 検証は 1 回で済む。リクエストを跨いだ共有は起きないため、ユーザー間で
// セッションが混ざる心配は無い。
import { cache } from "react";
import { auth } from "@/auth";

export const getSession = cache(async () => auth());

/** ログイン済みかどうかだけ要るとき用。 */
export async function isSignedIn(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user?.id;
}
