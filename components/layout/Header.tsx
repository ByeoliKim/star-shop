import Link from "next/link";
import { HeaderNavLinks } from "@/components/layout/HeaderNavLinks";

/**
 * Header (Server Component)
 * - 레이아웃/구조 는 서버에서 렌더링
 * - active 표시만 HeaderNavLinks 클라이언트 컴포넌트에 위임
 */

export function Header() {
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
        </div>
      </div>
    </header>
  );
}
