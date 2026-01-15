import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 클라이언트에서 현재 로그인 유저가 있는지 확인
 * - user 가 있으면 로그인 상태
 * - 없으면 비로그인 상태
 */

export async function getClientUser() {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user ?? null;
}
