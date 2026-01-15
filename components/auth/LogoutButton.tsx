"use client";

import { useRouter } from "next/navigation";

/**
 * 로그아웃 버튼 (Client)
 * - 서버 Route Handler (/auth/signout) 를 호출해 쿠키까지 정리함
 */

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-50"
      onClick={async () => {
        const ok = confirm("로그아웃 하시겠습니까?");
        if (!ok) return;
        await fetch("/auth/signout", { method: "POST" });
        // 서버 컴포넌트들이 쿠키 변경을 반영하도록 새로고침
        setTimeout(() => {
          router.refresh();
        }, 0);

        //홈으로 이동
        router.push("/");
      }}
    >
      로그아웃
    </button>
  );
}
