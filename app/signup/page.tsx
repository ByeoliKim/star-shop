"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 회원가입 페이지
 * - 이메일/비밀번호로 가입
 * - 일단 가입 요청 / 에러 처리만
 */

export default function SignupPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // 입력값 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ux 상태
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    setLoading(true);
    setErrorMessage(null);

    /**
     * Supabase 회원가입
     * - supabase 에서 이메일 인증은 off 한 상태
     * - 에러가 없으면 가입 요청 자체는 성공으로 본다
     */

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    alert("회원가입이 완료되었습니다! 이제 로그인 해 주세요.");
    router.replace("/login");

    // 헤더 같은 Server Component 가 최신 상태를 반영하도록 갱신
    setTimeout(() => {
      router.refresh();
    }, 0);
  };
  return (
    <main className="mx-auto max-w-md p-6">
      <h3 className="mb-6 text-2xl font-bold">회원가입</h3>
      <form className="space-y-4" onSubmit={handleSignup}>
        <div>
          <label className="mb-1 block text-sm font-medium">이메일</label>
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">비밀번호</label>
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-zinc-500">
            최소 6자 이상을 권장합니다.
          </p>
        </div>
        {errorMessage ? (
          <p className="text-sm text-red-500">{errorMessage}</p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:bg-zinc-400"
          disabled={loading}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
        <p className="text-sm text-zinc-600">
          이미 계정이 있나요?{" "}
          <button
            type="button"
            className="underline"
            onClick={() => router.push("/login")}
          >
            로그인
          </button>
        </p>
      </form>
    </main>
  );
}
