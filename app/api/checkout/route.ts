import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { calcSalePrice } from "@/lib/utils/pricing";

/**
 * POST /api/checkout
 * body: { productIds: string[] }
 *
 * 1. 로그인 유저 확인
 * 2. DB 에서 상품 가격을 직접 조회 / 계산 (클라 totalPrice 신뢰 x)
 * 3. 이미 보유한 상품이 있는지 확인 (중복 구매 방지)
 * 4. cash 충분하면:
 *      - user_owned_products insert
 *      - user_profiles.cash update (차감)
 */

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient();

  // 1. 로그인 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json(
      { ok: false, message: userError.message },
      { status: 401 },
    );
  }
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  // body 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const productIds = (body as { productIds?: unknown })?.productIds;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json(
      { ok: false, message: "결제할 상품이 없습니다." },
      { status: 400 },
    );
  }

  // 이미 보유한 상품이 있는지 먼저 확인 (중복 구매 방지)
  const { data: ownedRows, error: ownedCheckError } = await supabase
    .from("user_owned_products")
    .select("product_id")
    .eq("user_id", user.id)
    .in("product_id", productIds);

  if (ownedCheckError) {
    return NextResponse.json(
      { ok: false, message: ownedCheckError.message },
      { status: 500 },
    );
  }

  if ((ownedRows?.length ?? 0) > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "이미 보유한 상품이 포함되어 있어 결제할 수 없습니다.",
        ownedProductIds: ownedRows?.map((r) => r.product_id) ?? [],
      },
      { status: 409 },
    );
  }

  // 서버에서 상품 가격을 직접 조회/계산
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, original_price, discount_rate")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json(
      { ok: false, message: productsError.message },
      { status: 500 },
    );
  }

  // 요청한 id 중 DB 에 없는 상품이 있으면 실패 처리
  if ((products?.length ?? 0) !== productIds.length) {
    return NextResponse.json(
      {
        ok: false,
        message: "존재하지 않는 상품이 포함되어 있습니다.",
      },
      { status: 400 },
    );
  }

  const totalPrice = (products ?? []).reduce((sum, p) => {
    return sum + calcSalePrice(p.original_price, p.discount_rate);
  }, 0);

  // 현재 cash 조회
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("cash")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { ok: false, message: profileError.message },
      { status: 500 },
    );
  }

  const currentCash = profile.cash;
  if (currentCash < totalPrice) {
    return NextResponse.json(
      { ok: false, message: "보유 캐시가 부족합니다." },
      { status: 400 },
    );
  }

  // owned insert
  const rows = productIds.map((pid) => ({
    user_id: user.id,
    product_id: pid,
  }));

  const { error: insertError } = await supabase
    .from("user_owned_products")
    .insert(rows);
  if (insertError) {
    return NextResponse.json(
      { ok: false, message: insertError.message },
      { status: 500 },
    );
  }

  // cash update
  const newCash = currentCash - totalPrice;

  const { error: cashUpdateError } = await supabase
    .from("user_profiles")
    .update({ cash: newCash })
    .eq("id", user.id);

  if (cashUpdateError) {
    return NextResponse.json(
      { ok: false, message: cashUpdateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    newCash,
    purchasedProductIds: productIds,
  });
}
