import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product, ProductView } from "@/lib/types/product";
import { calcSalePrice } from "@/lib/utils/pricing";

/**
 * 홈 페이지
 * - 서버 컴포넌트
 * - Supabase 에서 상품 목록을 가져와 SSR 로 렌더링
 */

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  // 서버에서 직접 DB 조회
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  // DB -> 화면용 데이터로 변환
  const products: ProductView[] = (data as Product[]).map((product) => ({
    ...product,
    salePrice: calcSalePrice(product.original_price, product.discount_rate),
  }));
  return (
    <main className="p-6">
      <h2 className="mb-6 text-2xl font-bold">상품 리스트</h2>
      <ProductGrid products={products} />
    </main>
  );
}
