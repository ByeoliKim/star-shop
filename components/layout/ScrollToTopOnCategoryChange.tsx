"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * 카테고리 (category) 가 바뀌면 스크롤을 맨위로 올림
 * URL 기반 상태(searchParams) 가 바뀌는 순간을 감지
 * SSR 에서 할 수 없는 브라우저 UX 이므로 클라이언트 컴포넌트로 분리
 */

export function ScrollToTopOnCategoryChange() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "all";

  useEffect(() => {
    // 카테고리가 바뀌는 순간 실행
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [category]);

  return null;
}
