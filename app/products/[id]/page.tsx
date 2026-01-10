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
  params: Promise<{ id?: string }>;
}) {
  // params.id 가 없으면 404
  // Next.js 최신 동적 라우트 : params 는 Promise 일 수 있어서 먼저 풀어 줌
  const { id } = await params; // 여기서 Promise 를 풀어 준다
  if (!id) return notFound();

  const supabase = await createSupabaseServerClient();

  // 1) 상품 1개 조회 (SSR)
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (productError) throw new Error(productError.message);
  if (!product) return notFound();

  // 2) 챔피언 상세 페이지이므로 챔피언이 아니면 404 처리
  // if (product.category !== "champion") return notFound();

  const champion = product as Product;

  // 화면용 변환 (할인가 계산 포함)
  const championView: ProductView = {
    ...champion,
    salePrice: calcSalePrice(champion.original_price, champion.discount_rate),
  };

  // 3) 챔피언이면: 같은 champion_key의 스킨 목록 조회 (SSR)
  const isChampion = champion.category === "champion";
  let skinsView: ProductView[] = [];

  if (isChampion && champion.champion_key) {
    const { data: skins, error: skinsError } = await supabase
      .from("products")
      .select("*")
      .eq("category", "skin")
      .eq("champion_key", champion.champion_key)
      .order("created_at", { ascending: false });

    if (skinsError) throw new Error(skinsError.message);
    skinsView = ((skins ?? []) as Product[]).map((p) => ({
      ...p,
      salePrice: calcSalePrice(p.original_price, p.discount_rate),
    }));
  }

  return (
    <main className="p-6 space-y-8">
      {/* 챔피언 기본 정보 */}
      <section className="space-y-3">
        <div className="text-xs text-zinc-500">
          category: <b>{champion.category}</b>
          {champion.champion_key ? (
            <>
              {" "}
              | champion_key: <b>{champion.champion_key}</b>
            </>
          ) : null}
        </div>
        <h2>{championView.name}</h2>
        <p>{championView.description}</p>
        {/* 챔피언 상품은 1개만 보여 주면 되니까 grid 에 1개만 넣어 재사용 */}
        <ProductGrid products={[championView]} />
      </section>
      {/* 챔피언일 때만 스킨 섹션을 노출함 */}
      {isChampion && (
        <section className="space-y-3">
          <h3>이 챔피언의 스킨</h3>
          {skinsView.length === 0 ? (
            <div className="rounded-lg border p-4 text-sm text-zinc-600">
              해당 챔피언의 스킨이 존재하지 않습니다.
            </div>
          ) : (
            <ProductGrid products={skinsView} />
          )}
        </section>
      )}
    </main>
  );
}
