"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * QueryClient 는 브라우저에서 한 번만 만들어져야 한다
 * - 렌더링마다 new QueryClient() 하면 캐시가 계속 초기화됨
 * - 그래서 useState 로 1회 생성 패턴을 사용한다
 */

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
