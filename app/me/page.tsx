import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /me (내정보)
 * SSR
 * - 서버에서 세션(user) 을 확인하고 내 정보를 조회함
 * - 내 정보는 인증이 필요하고 db 기준으로 보여야 한다
 * - 서버에서 유저 확인, db 조회 후 HTML 을 내려줌
 */

export default async function MePage() {
  const supabase = await createSupabaseServerClient();

  // 서버에서 로그인 유저를 확인함
  // 미들웨어가 있더라도 페이지에서 한번더 체크하는 습관이 안전하당

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    // 유저 확인 중 에러가 발생하면 로그인 페이지로 보낸다
    redirect("/login?next=/me");
  }
  if (!user) {
    redirect("/login?next=/me");
  }

  // 로그인 후 나의 보유 cash 를 조회한다 (user_profiles)
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("cash")
    .eq("id", user.id)
    .single();
  if (profileError) {
    // 여기서 터진다면 db/정책/데이터 문제일 거임
    throw new Error(profileError.message);
  }

  // 보유 중인 상품 개수 조회하기 (user_owned_products)
  // 목록을 당장 다 가져오진 않고 개수 먼저 확인
  // count 옵션은 응답에 count 를 같이 걸어 주는 방식이다
  const { count, error: ownedCountError } = await supabase
    .from("user_owned_products")
    .select("product_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (ownedCountError) {
    throw new Error(ownedCountError.message);
  }
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">내 정보</h1>

      <div className="mt-6 grid gap-4">
        <section className="rounded-2xl border p-4">
          <h2 className="text-lg font-semibold">계정</h2>
          <p className="mt-2 text-sm text-zinc-700">
            이메일: <b>{user.email ?? "(없음)"}</b>
          </p>
        </section>

        <section className="rounded-2xl border p-4">
          <h2 className="text-lg font-semibold">보유 캐시</h2>
          <p className="mt-2 text-sm text-zinc-700">
            현재 캐시: <b>{profile.cash.toLocaleString()}</b>
          </p>
        </section>

        <section className="rounded-2xl border p-4">
          <h2 className="text-lg font-semibold">보유 상품</h2>
          <p className="mt-2 text-sm text-zinc-700">
            보유 개수: <b>{(count ?? 0).toLocaleString()}</b>
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            보유 상품 목록(이미지/이름/카테고리)을 SSR로 노출할 예정
          </p>
        </section>
      </div>
    </main>
  );
}
