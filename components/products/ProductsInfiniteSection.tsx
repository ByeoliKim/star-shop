"use client";

import { useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Product, ProductView } from "@/lib/types/product";
import { calcSalePrice } from "@/lib/utils/pricing";
import { ProductGrid } from "./ProductGrid";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";

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

  // sentinel: 화면 바닥에서 다음 페이지 로드 트리거
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /**
   * onIntersect 는 observer 콜백에서 실행되므로,
   * 불필요한 재생성을 줄이기 위해 useCallback 으로 감싼다
   */

  const onIntersect = useCallback(() => {
    // 이미 다른 페이지를 가져오는 중이면 중복 호출 방지
    if (query.isFetchingNextPage) return;
    // 다음 페이지가 있을 때만 호출
    if (query.hasNextPage) {
      query.fetchNextPage();
    }
  }, [query.isFetchingNextPage, query.hasNextPage, query.fetchNextPage]);

  useIntersectionObserver(sentinelRef, onIntersect, {
    root: null,
    rootMargin: "200px", // 바닥에 닿기 200px 전에 미리 로드
    threshold: 0,
  });

  return (
    <section className="space-y-4">
      <ProductGrid products={products} />

      {/* 스크롤 대신 더보기 버튼으로만 다음 페이지 확인 */}
      {/* {query.hasNextPage && (
        <button
          type="button"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="w-full rounded-lg border px-4 py-3 text-sm font-medium"
        >
          {query.isFetchingNextPage ? "가져오는 중..." : "더보기"}
        </button>
      )} */}

      {/* 로딩 표시 : 다음 페이지를 가져오는 중일 때만 */}
      {query.isFetchingNextPage && (
        <div className="rounded-lg border p-4 text-center text-sm">
          가져오는 중...
        </div>
      )}

      {/* sentinel: 이 div 가 보이면 다음 페이지를 자동 요청 */}
      {query.hasNextPage && <div ref={sentinelRef} className="h-10" />}

      {/* 더이상 가져올 게 없을 때 */}
      {!query.hasNextPage && (
        <div className="py-6 text-center text-xs text-gray-500">
          더이상 가져올 것이 없습니다.
        </div>
      )}
    </section>
  );
}
