"use client";

import { useEffect } from "react";

type Options = IntersectionObserverInit;

/**
 * 특정 DOM 요소 (target) 가 화면에 들어오면 onIntersect 를 호출한다
 * - 무한 스크롤에서 sentinel div 관찰용
 */

export function useIntersectionObserver(
  target: React.RefObject<Element | null>,
  onIntersect: () => void,
  options?: Options
) {
  useEffect(() => {
    const el = target.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      // 여러 entry 중, 현재 target 이 보이는지 체크
      if (entries[0]?.isIntersecting) {
        onIntersect();
      }
    }, options);

    observer.observe(el);

    return () => observer.disconnect();
  }, [target, onIntersect, options]);
}
