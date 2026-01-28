import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  image_path: string;
  original_price: number;
  discount_rate: number;
  salePrice: number;
};

type CartState = {
  /**
   * 장바구니 담긴 아이템들
   * id 를 key 로 관리하면 중복 담기 금지가 쉽고 빠름
   */
  itemsById: Record<string, CartItem>;
  /**
   * 체크박스로 선택된 상품 id 목록
   * 선택 삭제 / 전체 선택 을 위해 별도 상태로 둠
   */
  selectedIds: string[];

  hydrated: boolean;

  // actions ------------------------------------------------------------
  addItem: (item: CartItem) => boolean;
  removeItem: (id: string) => void;
  clear: () => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  removeSelected: () => void;
  /**
   * DB 에서 유지 상태 (cash / ownedIds) 를 로드해서
   * store 에 주입 완료되었는지 표시
   */
  setHydrated: (v: boolean) => void;

  /**
   * 보유 중 (구매 완료) 상품 id 목록
   * - 보유 중이면 다시 구매 불가 < 규칙을 위해 필요함
   * - 나중에 auth 붙으면 서버 데이터로 대체할 거임
   */
  ownedIds: string[];

  /**
   * 보유 중 목록에 여러 id 를 추가
   * - 중복 추가를 막기 위해 Set 으로 정규화 함
   */
  addOwned: (ids: string[]) => void;

  /**
   * 특정 상품이 보유 중인지 확인
   */
  isOwned: (id: string) => boolean;

  /**
   * 임시 보유 캐시
   * - 지금은 클라이언트 상태로만 관리함
   * - 다음에 DB(user_profiles) 로 승격할 예정
   */
  cash: number;

  /**
   * 결제 시 캐시를 차감함
   * - 성공 : true (cash 감소)
   * - 실패(부족) : false (변화 없음)
   */
  spendCash: (amount: number) => boolean;

  /**
   * DB 에서 읽어온 값으로 cart 상태를 초기화한다
   */
  initFromServer: (params: { cash: number; ownedIds: string[] }) => void;

  setCash: (cash: number) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      itemsById: {},
      selectedIds: [],
      ownedIds: [],
      cash: 10_000,
      hydrated: false,

      addItem: (item) => {
        /**
         * store 가 "추가 성공/실패" 를 판단해서 boolean 으로 반환한다
         * true : 새로 장바구니에 추가됨
         * false : 이미 담겨져 있어서 추가하지 않음 (중복 담기 방지)
         */
        const exists = !!get().itemsById[item.id];
        if (exists) return false;

        set((state) => ({
          ...state,
          itemsById: {
            ...state.itemsById,
            [item.id]: item,
          },
        }));
        return true;
      },

      /**
       * 단일 삭제
       * - 아이템 제거 + 선택 목록에서도 같이 제거
       */
      removeItem: (id) =>
        set((state) => {
          if (!state.itemsById[id]) return state;
          const { [id]: _, ...rest } = state.itemsById;
          return {
            ...state,
            itemsById: rest,
            selectedIds: state.selectedIds.filter((x) => x !== id),
          };
        }),
      /**
       * 전체 삭제
       */
      clear: () =>
        set(() => ({
          itemsById: {},
          selectedIds: [],
        })),
      /**
       * 개별 선택 토글
       */
      toggleSelect: (id) =>
        set((state) => {
          const has = state.selectedIds.includes(id);
          return {
            ...state,
            selectedIds: has
              ? state.selectedIds.filter((x) => x !== id)
              : [...state.selectedIds, id],
          };
        }),
      /**
       * 전체 선택
       * - 현재 장바구니에 담긴 모든 id 를 selectedIds 로 설정
       */
      selectAll: () => {
        const ids = Object.keys(get().itemsById);
        set((state) => ({
          ...state,
          selectedIds: ids,
        }));
      },
      /**
       * 전체 선택 해제
       */
      clearSelection: () =>
        set((state) => ({
          ...state,
          selectedIds: [],
        })),
      /**
       * 선택 삭제
       */
      removeSelected: () =>
        set((state) => {
          if (state.selectedIds.length === 0) return state;
          const nextItems = { ...state.itemsById };
          state.selectedIds.forEach((id) => {
            delete nextItems[id];
          });
          return {
            ...state,
            itemsById: nextItems,
            selectedIds: [],
          };
        }),
      addOwned: (ids) =>
        set((state) => ({
          ...state,
          // 중복 제거 : 기존 ownedIds + 새 ids 를 합친 뒤 Set 으로 정리
          ownedIds: Array.from(new Set([...state.ownedIds, ...ids])),
        })),
      isOwned: (id) => {
        return get().ownedIds.includes(id);
      },
      spendCash: (amount) => {
        /**
         * 결제는 상태 변경이므로 store 에서 원칙을 보장함
         * - amount 가 이상하면 실패 처리
         * - cash 부족하면 실패 처리
         */
        if (!Number.isFinite(amount) || amount <= 0) return false;
        const currentCash = get().cash;
        if (currentCash < amount) return false;

        set((state) => ({
          ...state,
          cash: state.cash - amount,
        }));

        return true;
      },
      initFromServer: ({ cash, ownedIds }) => {
        set((state) => ({
          ...state,
          cash,
          ownedIds,
          hydrated: true,
        }));
      },
      setCash: (cash) => {
        if (!Number.isFinite(cash) || cash < 0) return;
        set((state) => ({ ...state, cash }));
      },
      setHydrated: (v) => set((state) => ({ ...state, hydrated: v })),
    }),
    {
      name: "star-shop-cart", // localStorage key
      storage: createJSONStorage(() => localStorage),
      /**
       * persist 할 것만 선별해서 저장
       * - itemsById, selectedIds 만 저장
       * cash/ownedIds/hydrated 는 db 에서 부트스트랩 되므로 저장하면 충돌 위험
       */
      partialize: (state) => ({
        itemsById: state.itemsById,
        selectedIds: state.selectedIds,
      }),
    },
  ),
);
