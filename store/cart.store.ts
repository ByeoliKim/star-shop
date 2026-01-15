import { create } from "zustand";

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

  // actions ------------------------------------------------------------
  addItem: (item: CartItem) => boolean;
  removeItem: (id: string) => void;
  clear: () => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  removeSelected: () => void;

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
};

export const useCartStore = create<CartState>((set, get) => ({
  itemsById: {},
  selectedIds: [],
  ownedIds: ["a8344281-461a-461f-bb31-e30ec3ab4af0"],

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
}));
