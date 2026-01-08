import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/products?page=1&limit=10
 * - 무한 스크롤 (2페이지부터) 을 위해 사용하는 API
 * - SSR 페이지 (/) 는 직접 Supabase 를 조회했고,
 * - 이 API 는 추가 로드 전용 통로로 쓰게 됨
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // 기본값: page=1, limit=10
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");

  // 방어 코드 : 이상한 값이 오면 기본값으로 보정
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 && limit <= 50 ? limit : 10;

  // Supabase range 는 0-based index
  // page=1, limit=10 -> 0~9
  // page=2, limit=10 -> 10~19
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    page: safePage,
    limit: safeLimit,
    items: data ?? [],
    // hasNext 는 다음 단계 (React Query) 에서 더 정확히 다듬을 수도 있음
    // 지금은 받아온 개수가 limit 와 같으면 다음이 있을 가능성이 있다 정도로만.
    hasNext: (data?.length ?? 0) === safeLimit,
  });
}
