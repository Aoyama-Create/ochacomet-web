// Auth.js v5 のルートハンドラ。
// /api/auth/signin /signout /session /csrf /callback/credentials 等を全部捌く。
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
