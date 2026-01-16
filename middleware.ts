import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * middleware 전역 가드
 * /cart 는 로그인 필수
 * 로그인 안 했으면 /login 으로 redirect
 */

export async function middleware(req: NextRequest) {
  const { res, user } = await updateSession(req);

  const { pathname } = req.nextUrl;

  // 보호할 경로 : /cart

  const isCartRoute = pathname.startsWith("/cart");

  if (isCartRoute && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";

    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // updateSession 에서 만든 res 를 반환함
  return res;
}

/**
 * matcher: middleware 를 적용할 경로
 */

export const config = {
  matcher: ["/cart/:path*"],
};
