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
