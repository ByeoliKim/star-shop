import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Route Handler (/api/*) 에서 사용하는 Supabase Server Client
 * - 쿠키 읽기 / 쓰기 모두 가능
 * - 로그인 / 로그아웃 같은 '쿠키 변경' 작업은 여기서 처리한다
 * - 세션 갱신이 안전함
 */

export async function createSupabaseRouteClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
