"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart.store";
import { loadUserState } from "@/lib/user/loadUserState";

/**
 * 앱 시작, 새로고침 시 DB 의 유저 상태를 읽는다
 * Zustand 에 주입하는 컴포넌트
 *
 * - Zustand 는 메모리 상태라 새로고침하면 초기화됨
 * - DB 가 source of truth 이므로, 앱 시작 시 다시 로드해서 동기화함
 */

export function UserStateBootstrap() {
  const initFromServer = useCartStore((s) => s.initFromServer);
  const setHydrated = useCartStore((s) => s.setHydrated);

  // 초기화 완료 여부를 관리
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function run() {
      try {
        const state = await loadUserState();
        if (state) {
          initFromServer(state); // hydrated true 처리됨
        } else {
          // 비로그인도 로딩은 끝이므로 hydrated true
          setHydrated(true);
        }
      } catch {
        // 실패해도 앱이 멈추지 않게 하고, 로딩은 끝처리
        setHydrated(true);
      }
    }
    run();
  });

  // ui 를 렌더링할 필요는 없음
  // done 을 활용해 '로딩' 표시를 하고 싶으면 다음 턴에 확장 가능
  return null;
}
