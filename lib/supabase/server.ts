import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트에서 사용하는 Supabase 클라이언트
 * - 쿠키를 사용해서 세션 유지 가능
 * - SSR 에서 안전하게 호출됨
 */

export async function createSupabaseServerClient() {
  // Next.js 의 cookies() 는 async
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
    }
  );
}
