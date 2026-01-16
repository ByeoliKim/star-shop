import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware 에서 Supabase 세션을 읽고, 필요 시 갱신 쿠키를 response 에 반영하는 헬퍼 역할이다
 * middleware 에서는 next/headers 의 cookies() 를 쓰지 않음
 * 대신 NextRequest/NextResponse 의 cookies API 를 사용한다.
 * middleware 에서는 요청 쿠키를 읽고 응답 쿠키에 반영함
 */

export async function updateSession(req: NextRequest) {
  // 기본 응답
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 요청 쿠키 읽기
        getAll() {
          return req.cookies.getAll();
        },
        // Supabase 가 갱신하려는 쿠키를 응답에 복사
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  // 여기 호출이 세션을 복원하고, 필요하면 쿠키 갱신(setAll) 이 일어남
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { res, user };
}
