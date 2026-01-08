"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Product, ProductView } from "@/lib/types/product";
import { calcSalePrice } from "@/lib/utils/pricing";
import { ProductGrid } from "./ProductGrid";

type Props = {
  initialItems: ProductView[];
};

/**
 * SSR 1페이지 + CSR 무한 스크롤 연결부
 * SSR 로 받은 initialItems 를 React Query 의 첫 페이지로 심어둔다
 * 이후 fetchNextPage() 가 2페이지부터 가져옴
 */

export function ProductsInfiniteSection({ initialItems }: Props) {
  const query = useInfiniteQuery({
    queryKey: ["products", "latest", 10], // 최신순 + limit=10 고정
    initialPageParam: 1, // SSR 1페이지 데이터를 첫 페이지로 넣어줌
    initialData: {
      pages: [
        {
          ok: true,
          page: 1,
          limit: 10,
          items: initialItems,
          hasNext: initialItems.length === 10,
        },
      ],
      pageParams: [1],
    },
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/products?page=${pageParam}&limit=10`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.message ?? "상품을 불러오지 못했습니다.");
      }

      // API 응답 items(Product[]) -> ProductViewp[]로 변환
      const items: ProductView[] = (json.items as Product[]).map((p) => ({
        ...p,
        salePrice: calcSalePrice(p.original_price, p.discount_rate),
      }));

      return {
        ...json,
        items,
      };
    },
    getNextPageParam: (lastPage) => {
      // hasNext 가 true 면 다음 page 숫자를 반환, 아니면 undefined
      return lastPage.hasNext ? lastPage.page + 1 : undefined;
    },
  });

  // 모든 페이지 items 를 한 배열로 합치기
  const products = query.data.pages.flatMap((p) => p.items);

  return (
    <section className="space-y-4">
      <ProductGrid products={products} />

      {/* 스크롤 대신 더보기 버튼으로만 다음 페이지 확인 */}
      {query.hasNextPage && (
        <button
          type="button"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="w-full rounded-lg border px-4 py-3 text-sm font-medium"
        >
          {query.isFetchingNextPage ? "가져오는 중..." : "더보기"}
        </button>
      )}
    </section>
  );
}
