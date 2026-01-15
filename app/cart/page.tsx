export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CartClient from "./CartClient";

/**
 * 장바구니 페이지 (Server Component)
 * - 여기서 로그인 (SSR) 처리함
 * - UI / Zustand 는 CartClient (Client Component) 가 담당함!
 * - 매 요청마다 쿠키를 읽어야 하므로 캐시를 끈다
 */

export default async function CartPage() {
  noStore(); // 요청마다 실행 (캐시 방지)
  // 서버에서 로그인 여부 확인
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 안 되어 있으면 로그인 페이지로 이동함
  if (!user) {
    redirect("/login");
  }

  // 로그인 상태면 클라이언트 UI 를 렌더
  return <CartClient />;
}
