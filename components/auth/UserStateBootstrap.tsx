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

  // 초기화 완료 여부를 관리
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const state = await loadUserState();
        if (!state) {
          // 비로그인이면 아무것도 주입하지 않음
          if (!cancelled) setDone(true);
          return;
        }
        // 로그인 상태면 DB 값을 store 에 주입함
        initFromServer(state);
        if (!cancelled) setDone(true);
      } catch {
        if (!cancelled) setDone(true);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [initFromServer]);

  // ui 를 렌더링할 필요는 없음
  // done 을 활용해 '로딩' 표시를 하고 싶으면 다음 턴에 확장 가능
  return null;
}
