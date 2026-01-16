"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

/**
 * 로그인 페이지
 * - 이메일 / 비밀번호 로그인
 * - 성공 시 쿠키에 세션 저장됨
 * - 이후 SSR 에서도 로그인 상태를 읽을 수 있음
 */

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  // 입력값 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ux 상태
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent<HTMLFormElement>) => {
    // Enter 제출일 때 페이지 새로고침을 막는다
    e?.preventDefault();

    setLoading(true);
    setErrorMessage(null);

    /**
     * Supabase 이메일 / 비밀번호 로그인
     * - 성공하면 세션 쿠키가 자동으로 저장됨
     */
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    // 로그인 성공
    alert("로그인 성공");

    // 1. 로그인 후 이동할 페이지
    // router.push("/products/category/champion");
    const target =
      next && next.startsWith("/") ? next : "/products/category/champion";

    router.replace(target);

    // 2. 그 다음 서버 컴포넌트에서 재평가
    setTimeout(() => {
      router.refresh();
    }, 0);
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h2>로그인</h2>
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="mb-1 block text-sm font-medium">이메일</label>
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">비밀번호</label>
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {errorMessage ? (
          <p className="text-sm text-red-500">{errorMessage}</p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:bg-zinc-400"
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
