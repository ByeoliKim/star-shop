import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 결제 (클라이언트 버전)
 * - productIds 를 구매처리 한다
 *
 * 1. 로그인 유저 확인
 * 2. user_profiles.cash 조회
 * 3. cash 충분할 경우
 *  - user_owned_products insert (중복 구매는 PK 로 막힘)
 *  - user_profiles.cash 차감 update
 *
 *  - insert/update 가 완전한 트랜잭션은 아님
 */

export async function checkoutSelected(params: {
  productIds: string[];
  totalPrice: number;
}) {
  const { productIds, totalPrice } = params;

  const supabase = createSupabaseBrowserClient();

  // 입력 방어
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { ok: false as const, message: "결제할 상품이 없습니다." };
  }
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    return { ok: false as const, message: "결제 금액이 올바르지 않습니다." };
  }

  // 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) return { ok: false as const, message: userError.message };
  if (!user) return { ok: false as const, message: "로그인이 필요합니다." };

  // 현재 cash 조회 (DB 가 source of truth)
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("cash")
    .eq("id", user.id)
    .single();

  if (profileError)
    return { ok: false as const, message: profileError.message };

  const currentCash = profile.cash;

  // 캐시 부족
  if (currentCash < totalPrice) {
    return {
      ok: false as const,
      message: "보유 캐시가 부족하여 결제할 수 없습니다.",
    };
  }

  // 보유 상품 insert
  // - (user_id, product_id) PK 때문에 중복 구매는 DB 가 막아 줌
  const rows = productIds.map((pid) => ({
    user_id: user.id,
    product_id: pid,
  }));

  const { error: ownedInsertError } = await supabase
    .from("user_owned_products")
    .insert(rows);

  if (ownedInsertError) {
    // 중복 구매 등으로 실패할 수 있음
    return { ok: false as const, message: ownedInsertError.message };
  }

  // cash 차감 update
  const newCash = currentCash - totalPrice;

  const { error: cashUpdateError } = await supabase
    .from("user_profiles")
    .update({ cash: newCash })
    .eq("id", user.id);

  if (cashUpdateError) {
    // 이 상태는 owned 는 들어갔는데, cash 업데이트 실패가 될 수 있음
    return { ok: false as const, message: cashUpdateError.message };
  }

  return { ok: true as const, newCash };
}
