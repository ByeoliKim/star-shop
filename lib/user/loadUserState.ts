import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 로그인 유저의 상태를 DB 에서 읽는다
 * - cash (user_profiles)
 * - ownedIds (user_owned_products)
 *
 * Supabase 에러 객체를 그대로 throw 하면 Next 가 [object object] 로 표시할 수 있다
 * 이럴 경우에는 Error(message) 로 감싸서 thorw
 * 신규 유저는 user_profiles row 가 없을 수 있기 땜에 내 id 로 프로필을 1회 생성 upsert 하고 다시 읽음
 */

export async function loadUserState() {
  const supabase = createSupabaseBrowserClient();

  // 1. 현재 로그인 유저
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) return null;

  // 2. 프로필(cash) 읽기 -> 없으면 생성함
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("cash")
    .eq("id", user.id)
    .maybeSingle(); // 없으면 null 반환 (에러로 터뜨리지 않음)

  if (profileError) {
    throw new Error(profileError.message);
  }

  // 프로필이 없으면 내 id 로 1회 생성함 (RLS insert_own 정책이 있기 땜에 가능함)
  if (!profile) {
    const { error: insertError } = await supabase.from("user_profiles").insert({
      id: user.id,
      cash: 10000, // 기본 캐시
    });
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  // 확실한 cash 확보를 위해 다시 읽기
  const { data: profile2, error: profile2Error } = await supabase
    .from("user_profiles")
    .select("cash")
    .eq("id", user.id)
    .single();

  if (profile2Error) throw new Error(profile2Error.message);

  // 3. 보유 상품 id 목록
  const { data: ownedRows, error: ownedError } = await supabase
    .from("user_owned_products")
    .select("product_id")
    .eq("user_id", user.id);

  if (ownedError) {
    throw new Error(ownedError.message);
  }

  return {
    cash: profile2.cash,
    ownedIds: (ownedRows ?? []).map((r) => r.product_id),
  };
}
