import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

/**
 * POST /api/checkout
 * body: { productIds: string[] }
 *
 * RPC (DB 함수) 버전으로 리팩토링
 *
 * - 기존 방식 (여러 쿼리를 끌고옴)
 * owned 체크, products 조회/가격 계산, cash 조회, owned insert, cash update
 *
 * - RPC 방식 (한 번 호출함)
 * 1. 로그인 확인
 * 2. body 검증
 * 3. supabase.rpc('purchase_products', { product_ids })
 *
 * - 결제는 한덩어리 작업인데, 여러 쿼리로 나누면 중간에 하나라도 실패했을 때 상태 불일치 (부분 성공) 의 가능성이 있음
 * - DB 함수 안에서 처리하면, 같은 DB 연결/컨텍스트에서 더 일관되게 처리할 수 있고, 로직이 한 곳으로 모여 유지보수도 쉬움
 *
 */

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient();

  // 1. 로그인 확인 (세션/쿠키 기반)
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

  // 입력 검증
  // DB 함수는 uuid[] 를 기대함
  // 일단 배열 + 비어있지 않음 정도는 API 에서 걸러주겠슨
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json(
      { ok: false, message: "결제할 상품이 없습니다." },
      { status: 400 },
    );
  }

  // RPC 호출 단계
  // - 기존에 있던 owned 체크 / products 조회 / cash 조회 / insert / update 까지 전부 DB 함수가 내부에서 처리함
  // 함수 시그니처 : purchase_products(product_ids uuid[])
  // js 에서는 string[] 넘기면 Supabase 가 uuid[] 로 캐스팅 시도
  const { data, error } = await supabase.rpc("purchase_products", {
    product_ids: productIds,
  });

  if (error) {
    /**
     * DB 함수에서 raise exception 으로 던진 메시지가 여기 error.message 로 올라옴
     * ex. 보유 캐시가 부족합니다
     * ex. 이미 보유한 상품이 포함되어 있어 결제할 수 없습니다.
     *
     * 상태 코드는 간단히 400으로 처리해도 됨
     * 메시지에 따라 409(중복) 같은 걸로 세분화해도 댐
     */
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 400 },
    );
  }

  /**
   * returns table 형태의 RPC 는 data 가 배열로 오는 경우가 흔함
   */

  const row = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    ok: true,
    newCash: row.new_cash,
    purchasedProductIds: row.purchased_product_ids,
  });

  // // 이미 보유한 상품이 있는지 먼저 확인 (중복 구매 방지)
  // const { data: ownedRows, error: ownedCheckError } = await supabase
  //   .from("user_owned_products")
  //   .select("product_id")
  //   .eq("user_id", user.id)
  //   .in("product_id", productIds);

  // if (ownedCheckError) {
  //   return NextResponse.json(
  //     { ok: false, message: ownedCheckError.message },
  //     { status: 500 },
  //   );
  // }

  // if ((ownedRows?.length ?? 0) > 0) {
  //   return NextResponse.json(
  //     {
  //       ok: false,
  //       message: "이미 보유한 상품이 포함되어 있어 결제할 수 없습니다.",
  //       ownedProductIds: ownedRows?.map((r) => r.product_id) ?? [],
  //     },
  //     { status: 409 },
  //   );
  // }

  // // 서버에서 상품 가격을 직접 조회/계산
  // const { data: products, error: productsError } = await supabase
  //   .from("products")
  //   .select("id, original_price, discount_rate")
  //   .in("id", productIds);

  // if (productsError) {
  //   return NextResponse.json(
  //     { ok: false, message: productsError.message },
  //     { status: 500 },
  //   );
  // }

  // // 요청한 id 중 DB 에 없는 상품이 있으면 실패 처리
  // if ((products?.length ?? 0) !== productIds.length) {
  //   return NextResponse.json(
  //     {
  //       ok: false,
  //       message: "존재하지 않는 상품이 포함되어 있습니다.",
  //     },
  //     { status: 400 },
  //   );
  // }

  // const totalPrice = (products ?? []).reduce((sum, p) => {
  //   return sum + calcSalePrice(p.original_price, p.discount_rate);
  // }, 0);

  // // 현재 cash 조회
  // const { data: profile, error: profileError } = await supabase
  //   .from("user_profiles")
  //   .select("cash")
  //   .eq("id", user.id)
  //   .single();

  // if (profileError) {
  //   return NextResponse.json(
  //     { ok: false, message: profileError.message },
  //     { status: 500 },
  //   );
  // }

  // const currentCash = profile.cash;
  // if (currentCash < totalPrice) {
  //   return NextResponse.json(
  //     { ok: false, message: "보유 캐시가 부족합니다." },
  //     { status: 400 },
  //   );
  // }

  // // owned insert
  // const rows = productIds.map((pid) => ({
  //   user_id: user.id,
  //   product_id: pid,
  // }));

  // const { error: insertError } = await supabase
  //   .from("user_owned_products")
  //   .insert(rows);
  // if (insertError) {
  //   return NextResponse.json(
  //     { ok: false, message: insertError.message },
  //     { status: 500 },
  //   );
  // }

  // // cash update
  // const newCash = currentCash - totalPrice;

  // const { error: cashUpdateError } = await supabase
  //   .from("user_profiles")
  //   .update({ cash: newCash })
  //   .eq("id", user.id);

  // if (cashUpdateError) {
  //   return NextResponse.json(
  //     { ok: false, message: cashUpdateError.message },
  //     { status: 500 },
  //   );
  // }
}
