import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저 (Client Component) 에서 사용하는 Supabase Client
 * - 로그인 / 로그아웃 / 회원가입 등 "사용자 액션" 전용
 * - 세션은 자동으로 쿠키에 저장됨
 */

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
