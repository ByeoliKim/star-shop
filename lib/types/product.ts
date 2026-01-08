// DB 에 저장된 products 테이블과 1:1 대응되는 타입
export type Product = {
  id: string;
  category: "champion" | "skin" | "icon" | "emote";
  name: string;
  description: string;
  image_path: string;
  original_price: number;
  discount_rate: number; // 0 ~ 100
  created_at: string;
};

// 화면에서 사용하기 좋은 형태의 타입
// 계산된 값(salePrice)을 포함
export type ProductView = Product & {
  salePrice: number;
};
