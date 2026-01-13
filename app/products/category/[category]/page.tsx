import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product, ProductView } from "@/lib/types/product";
import { calcSalePrice } from "@/lib/utils/pricing";
import { ProductsInfiniteSection } from "@/components/products/ProductsInfiniteSection";

/**
 * 카테고리 상품 리스트 (SSR + CSR infinite)
 * - URL : /products/category/[category]
 * - 첫 10개는 SSR 세팅
 * - 이후 페이지는 ProductsInfiniteSection 컴포넌트에서 CSR로 React Query 무한 스크롤 처리
 */

type Category = "all" | "champion" | "skin" | "icon" | "emote";
const ALLOWED: Category[] = ["all", "champion", "skin", "icon", "emote"];

export default async function ProductsByCategoryPage({
  params,
}: {
  params: Promise<{ category?: string }>;
}) {
  // params 는 Promise 일 수 있으니 먼저 await 로 풀어 준다
  const { category } = await params;

  // 유효하지 않은 값이면 all 로 간주함
  const activeCategory: Category = ALLOWED.includes(category as Category)
    ? (category as Category)
    : "all";

  const supabase = await createSupabaseServerClient();

  // SSR 1페이지 필터링
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (activeCategory !== "all") {
    query = query.eq("category", activeCategory);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const initialItems: ProductView[] = (data as Product[]).map((product) => ({
    ...product,
    salePrice: calcSalePrice(product.original_price, product.discount_rate),
  }));

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h2>상품 리스트</h2>
      <ProductsInfiniteSection
        initialItems={initialItems}
        category={activeCategory}
      />
    </main>
  );
}
