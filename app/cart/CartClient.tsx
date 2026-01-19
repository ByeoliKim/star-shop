"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";
import { getClientUser } from "@/lib/auth/client";
import { checkoutSelected } from "@/lib/checkout/checkoutSelected";

/**
 * 장바구니 UI 페이지 (Client Component)
 * - Zustand / 이벤트 / confirm 등 브라우저 기능은 여기서 처리함
 * - 인증 체크는 상위(server) 에서 끝내고 내려옴!
 */

export default function CartClient() {
  const router = useRouter();

  const itemsById = useCartStore((s) => s.itemsById);
  const selectedIds = useCartStore((s) => s.selectedIds);

  const toggleSelect = useCartStore((s) => s.toggleSelect);
  const selectAll = useCartStore((s) => s.selectAll);
  const clearSelection = useCartStore((s) => s.clearSelection);
  const removeSelected = useCartStore((s) => s.removeSelected);

  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  const addOwned = useCartStore((s) => s.addOwned);

  // Record -> 배열로 변환 (렌더링용)
  const items = useMemo(() => Object.values(itemsById), [itemsById]);

  // 전체 선택 여부
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  // 선택된 상품 합계 (우선 salePrice 기준)
  const selectedTotal = useMemo(() => {
    let sum = 0;
    for (const id of selectedIds) {
      const item = itemsById[id];
      if (item) sum += item.salePrice;
    }
    return sum;
  }, [selectedIds, itemsById]);

  // 임시 캐시 : 나중에 auth 붙이면 user_profiles 에서 가져오게 될 값임
  // const currentCash = 10_000;

  const cash = useCartStore((s) => s.cash);
  const spendCash = useCartStore((s) => s.spendCash);

  const setCash = useCartStore((s) => s.setCash);

  /**
   * 결제 가능 여부
   * - 선택된 상품이 있고
   * - 보유 캐시가 선택 합계 이상일 때만 true
   */

  const canCheckout = selectedIds.length > 0 && cash >= selectedTotal;

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <h3 className="text-2xl font-bold">장바구니</h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 왼쪽: 컨트롤 + 리스트 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 상단 컨트롤 영역 */}
          <section className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => {
                  // 체크되면 전체선택, 해제되면 전체해제
                  if (e.target.checked) selectAll();
                  else clearSelection();
                }}
              />
              전체 선택
            </label>
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              onClick={() => {
                const ok = confirm("선택한 상품을 장바구니에서 빼시겠습니까?");
                if (!ok) return;
                removeSelected();
              }}
              disabled={selectedIds.length === 0}
            >
              선택 삭제
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              onClick={() => {
                const ok = confirm("전체 상품을 장바구니에서 빼시겠습니까?");
                if (!ok) return;
                clear();
              }}
              disabled={items.length === 0}
            >
              전체 삭제
            </button>
            <div className="ml-auto text-sm">
              선택 합계 : <b>{selectedTotal.toLocaleString()}원</b>
            </div>
          </section>

          {/* 장바구니 비어있을 때 */}
          {items.length === 0 ? (
            <div className="rounded-lg border p-6 text-sm text-zinc-600">
              장바구니가 비어 있어요.
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    {/* 체크박스 */}
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(item.id)}
                    />

                    {/* 이미지 */}
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                      <Image
                        src={item.image_path}
                        alt={item.name}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>

                    {/* 정보 */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {item.name}
                      </div>
                      <div className="text-xs text-zinc-600">
                        {item.salePrice.toLocaleString()}원
                        {item.discount_rate > 0 ? (
                          <span className="ml-2 text-zinc-400 line-through">
                            {item.original_price.toLocaleString()}원
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* 단일 삭제 */}
                    <button
                      type="button"
                      className="rounded-md border px-3 py-2 text-sm"
                      onClick={() => {
                        const ok = confirm(
                          "해당 상품을 장바구니에서 빼시겠습니까?",
                        );
                        if (!ok) return;
                        removeItem(item.id);
                      }}
                    >
                      삭제
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* 오른쪽: 결제 요약 */}
        <aside className="h-fit rounded-lg border p-4 space-y-4 lg:col-span-1 lg:sticky lg:top-24 ">
          <h2 className="text-lg font-semibold">결제</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">선택 상품 합계</span>
              <b>{selectedTotal.toLocaleString()} 원</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">보유 캐시</span>
              <b>{cash.toLocaleString()} 원</b>
            </div>
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-zinc-600">결제 후 잔액</span>
              <b>{(cash - selectedTotal).toLocaleString()} 원</b>
            </div>
          </div>
          <button
            type="button"
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!canCheckout}
            onClick={async () => {
              const ok = confirm("선택한 상품을 결제하시겠습니까?");
              if (!ok) return;
              // const user = await getClientUser();
              // if (!user) {
              //   alert("로그인이 필요합니다.");
              //   router.push("/login");
              //   return;
              // }

              // 1. 캐시 부족하면 결제 실패
              // const success = spendCash(selectedTotal);
              // if (!success) {
              //   alert("보유 캐시가 부족합니다.");
              //   return;
              // }

              // const result = await checkoutSelected({
              //   productIds: selectedIds,
              //   totalPrice: selectedTotal,
              // });

              // if (!result.ok) {
              //   alert(result.message);

              //   return;
              // }

              const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productIds: selectedIds }),
              });

              const json = await res.json().catch(() => null);

              if (!res.ok) {
                alert(json?.message ?? "결제에 실패했습니다.");
                return;
              }

              // 2. 결제 성공하면 보유중 처리 + 장바구니에서 제거
              /**
               * 화면 상태 동기화
               * - DB 에서 결제가 성공했음
               * - store 도 같은 결과가 되도록 반영한다
               */
              setCash(json.newCash);
              addOwned(selectedIds);
              removeSelected();

              alert("구매가 완료되었습니다!");
            }}
          >
            결제하기
          </button>
          {selectedIds.length === 0 ? (
            <p className="text-xs text-zinc-500">결제할 상품을 선택해 주세요</p>
          ) : cash < selectedTotal ? (
            <p className="text-xs text-red-500">보유 캐시가 부족합니다.</p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
