import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product, ProductView } from "@/lib/types/product";
import { calcSalePrice } from "@/lib/utils/pricing";
import { ProductsInfiniteSection } from "@/components/products/ProductsInfiniteSection";
import { Header } from "@/components/layout/Header";
import { ScrollToTopOnCategoryChange } from "@/components/layout/ScrollToTopOnCategoryChange";

/**
 * 홈 페이지
 * - 서버 컴포넌트
 * - Supabase 에서 상품 목록을 가져와 SSR 로 렌더링
 */

type Category = "all" | "champion" | "skin" | "icon" | "emote";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // Next 최신: searchParams 도 Promise 일 수 있으니 먼저 풀어 줌
  const sp = await searchParams;

  // category 가 없으면 all 로 취급한다
  const activeCategory = (sp.category ?? "all") as Category;

  const supabase = await createSupabaseServerClient();

  /**
   * SSR 필터링 핵심
   * - activeCategory 가 all 이면 전체
   * - champion/skin/icon/emote 면 서버에서 DB 쿼리에 eq 필터를 걸어서 가져옴
   * - SSR 은 요청(URL) 이 바뀌면 서버가 다시 실행되므로 여기서 필터링하는 게 맞음
   */

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // all 이 아니면 category 조건을 서버에서 적용
  if (activeCategory !== "all") {
    query = query.eq("category", activeCategory);
  }

  // 서버에서 직접 DB 조회 (필터가 적용된 상태)
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // DB -> 화면용 데이터로 변환
  const initialItems: ProductView[] = (data as Product[]).map((product) => ({
    ...product,
    salePrice: calcSalePrice(product.original_price, product.discount_rate),
  }));
  return (
    <>
      <Header activeCategory={activeCategory} />
      <ScrollToTopOnCategoryChange />
      {/* 디버그: 지금 url 로 어떤 category 가 들어왔는지 확인 */}
      <div className="mb-4 rounded border p-3 text-sm">
        debug category: <b>{sp.category ?? "(없음)"}</b>
      </div>
      <main className="max-w-7xl mx-auto p-6">
        <h2 className="mb-6 text-2xl font-bold">상품 리스트</h2>
        {/* 첫 페이지는 SSR 로 필터된 initialItems 가 들어간다 */}
        {/* 클라이언트 영역: 여기서부터 React Query 가 이어받음 */}
        <ProductsInfiniteSection
          initialItems={initialItems}
          category={activeCategory}
        />
      </main>
    </>
  );
}
