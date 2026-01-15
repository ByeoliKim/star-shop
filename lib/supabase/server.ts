import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Component(SSR) 에서 사용하는 Supabase Client
 * - 쿠키 읽기만 가능
 * - 쿠키 쓰기 (set/remove) 는 Server Component 에서 금지
 * - setAll 은 noop 으로 둬야 함
 * - (쿠키를 실제로 수정해야 하는 auth 작업은 Route Handler 에서 처리함)
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
          // Server Component 에서는 쿠키 수정 불가
          // Route Handler/Server Action 에서만 setAll 을 사용해야 함!
        },
      },
    }
  );
}
