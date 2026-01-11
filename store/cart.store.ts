import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  image_path: string;
  original_price: number;
  discounted_price: number;
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
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  removeSelected: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  itemsById: {},
  selectedIds: [],
  /**
   * 담기
   * - 이미 있으면 아무것도 하지 않음 (중복 담기 금지)
   */
  addItem: (item) =>
    set((state) => {
      if (state.itemsById[item.id]) return state;
      return {
        ...state,
        itemsById: {
          ...state.itemsById,
          [item.id]: item,
        },
      };
    }),

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
}));
