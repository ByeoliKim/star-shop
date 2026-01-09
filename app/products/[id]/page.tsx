import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product, ProductView } from "@/lib/types/product";
import { calcSalePrice } from "@/lib/utils/pricing";
import { ProductGrid } from "@/components/products/ProductGrid";

/**
 * 상품 상세 페이지 (SSR)
 * - 여기서는 "챔피언 상품" 상세를 기준으로 설계함
 * - 챔피언 상품이면 같은 champion_key 를 가진 skin 상품들을 함께 노출함
 */

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();

  // 1) id 로 상품 1개 가져오기 (SSR)
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (productError) throw new Error(productError.message);
  if (!product) return notFound();

  // 2) 챔피언 상세 페이지이므로 챔피언이 아니면 404 처리
  if (product.category !== "champion") return notFound();

  const champion = product as Product;

  // 화면용 변환 (할인가 계산 포함)
  const championView: ProudctView = {
    ...champion,
    salePrice: calcSalePrice(champion.original_price, champion.discount_rate),
  };

  // 3) 같은 champion_key 를 가진 스킨들 가져오기 (SSR)
  // - champion_key 가 비어있으면 스킨도 못 가져오니 빈 배열 처리
  let skinsView: ProductView[] = [];
}
