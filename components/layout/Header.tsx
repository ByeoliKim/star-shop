import Link from "next/link";

/**
 * Header
 * - 공통 네비게이션바
 * - activeCategory 는 URL(searchParams) 의 category 값을 기반으로 결정됨
 * - 즉, "URL 이 곧 상태" 라는 SSR 흐름을 헤더에도 적용함
 */

type Category = "all" | "champion" | "skin" | "icon" | "emote";

const CATE: { key: Category; label: string; href: string }[] = [
  { key: "all", label: "전체", href: "/" },
  { key: "champion", label: "챔피언", href: "/?category=champion" },
  { key: "skin", label: "스킨", href: "/?category=skin" },
  { key: "icon", label: "아이콘", href: "/?category=icon" },
  { key: "emote", label: "감정표현", href: "/?category=emote" },
];

export function Header({ activeCategory }: { activeCategory: Category }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* 로고 */}
        <Link href="/" className="text-lg font-extrabold">
          별이 상점
        </Link>
        {/* 카테고리 메뉴 */}
        <nav className="flex items-center gap-2 text-sm">
          {CATE.map((c) => {
            const isActive = activeCategory === c.key;
            return (
              <Link
                key={c.key}
                href={c.href}
                className={[
                  "rounded-full px-3 py-1 transition",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "hover:bg-zinc-100 text-zinc-800",
                ].join(" ")}
              >
                {c.label}
              </Link>
            );
          })}
        </nav>
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
