"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import path from "path";

/**
 * Header 안에서 active 표시만 담당하는 Client Component
 * - Header 자체는 Server Component 로 유지
 * - 현재 pathname 을 보고 어떤 카테고리인지 판단해서 active 스타일 적용함
 * - /products/category/[category] 에서만 active 가 켜짐
 * - 그 외 경로 (/, /cart, /me 등) 에서는 active 없음
 */

type Category = "champion" | "skin" | "icon" | "emote";

const CATE: { key: Category; label: string; href: string }[] = [
  { key: "champion", label: "챔피언", href: "/products/category/champion" },
  { key: "skin", label: "스킨", href: "/products/category/skin" },
  { key: "icon", label: "아이콘", href: "/products/category/icon" },
  { key: "emote", label: "이모트", href: "/products/category/emote" },
];

export function HeaderNavLinks() {
  const pathname = usePathname();

  // /products/category/[category] 에서만 active 처리
  const isCategoryListPage = pathname.startsWith("/products/category/");
  const seg = isCategoryListPage ? pathname.split("/")[3] : null;
  const activeCategory = (seg as Category) ?? null;

  return (
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
  );
}
