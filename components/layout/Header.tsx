import Link from "next/link";
import { HeaderNavLinks } from "@/components/layout/HeaderNavLinks";
import { LogoutButton } from "../auth/LogoutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Header (Server Component)
 * - 로그인 상태를 서버에서 판단함 (쿠키 기반)
 * - active 표시는 HeaderNavLinks 클라이언트 컴포넌트에 위임
 */

export async function Header() {
  const supabase = await createSupabaseServerClient();

  // 서버에서 로그인 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* 로고 */}
        <Link href="/" className="text-lg font-extrabold">
          <h1>⭐ 상점</h1>
        </Link>
        {/* 카테고리 메뉴 */}
        <HeaderNavLinks />
        {/* 우측 메뉴 */}
        <div className="flex items-center gap-3 text-sm">
          <Link href="/cart" className="hover:underline">
            장바구니
          </Link>
          <Link href="/me" className="hover:underline">
            내정보
          </Link>
          {/* 로그인 상태에 따라 우측 UI 분기 */}
          {user ? (
            <LogoutButton />
          ) : (
            <Link className="hover:underline" href="/login">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
