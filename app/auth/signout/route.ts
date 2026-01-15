import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

/**
 * POST / auth / signout
 * - Route Handler 는 쿠키 수정 가능
 * - 여기서 signout 하면 세션 쿠키까지 정리됨
 */

export async function POST() {
  const supabase = await createSupabaseRouteClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
