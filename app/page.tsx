import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product, ProductView } from "@/lib/types/product";
import { calcSalePrice } from "@/lib/utils/pricing";
import { ProductsInfiniteSection } from "@/components/products/ProductsInfiniteSection";
import { Header } from "@/components/layout/Header";

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

  const activeCategory = (sp.category ?? "all") as Category;

  const supabase = await createSupabaseServerClient();

  // 서버에서 직접 DB 조회
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

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
      <div className="mb-4 rounded border p-3 text-sm">
        debug category: <b>{sp.category ?? "(없음)"}</b>
      </div>
      <main className="max-w-7xl mx-auto p-6">
        <h2 className="mb-6 text-2xl font-bold">상품 리스트</h2>
        {/* 클라이언트 영역: 여기서부터 React Query 가 이어받음 */}
        <ProductsInfiniteSection initialItems={initialItems} />
      </main>
    </>
  );
}
