"use client";
import Image from "next/image";
import Link from "next/link";
import { ProductView } from "@/lib/types/product";
import { Price } from "@/components/ui/Price";
import { useCartStore } from "@/store/cart.store";

type Props = {
  product: ProductView;
};

export function ProductCard({ product }: Props) {
  // 장바구니 담기 액션
  const addItem = useCartStore((s) => s.addItem);

  // 이미 담김
  const itemsById = useCartStore((s) => s.itemsById);
  const isInCart = !!itemsById[product.id];

  // 보유중
  const isOwned = useCartStore((s) => s.isOwned);
  const owned = isOwned(product.id);
  const disabled = isInCart || owned;

  return (
    <div className="rounded-lg border p-4">
      <Link
        href={`/products/${product.id}`}
        aria-label={`${product.name} 상세 보기`}
        className="block rounded-lg border p-4 transition hover:bg-zinc-50"
      >
        <div className="relative mb-3 aspect-square">
          <Image
            src={product.image_path}
            alt={product.name}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
        <h2 className="mb-1 text-sm font-medium">{product.name}</h2>
        <Price
          originalPrice={product.original_price}
          salePrice={product.salePrice}
          discountRate={product.discount_rate}
        />
      </Link>
      {/* 장바구니 담기 버튼 */}
      <button
        type="button"
        disabled={disabled}
        className={[
          "mt-3 w-full rounded-md px-3 py-2 text-sm text-white",
          disabled
            ? "bg-zinc-400 cursor-not-allowed"
            : "bg-zinc-900 hover:bg-zinc-800",
        ].join(" ")}
        onClick={(e) => {
          /**
           * 중요포인트
           * - 이 버튼은 Link 밖에 있으니 원래는 페이지 이동과 무관함
           */
          e.preventDefault();

          if (owned) return;

          const added = addItem({
            id: product.id,
            name: product.name,
            image_path: product.image_path,
            original_price: product.original_price,
            discount_rate: product.discount_rate,
            salePrice: product.salePrice,
          });
          if (added) alert("장바구니에 담겼습니다.");
          else alert("이미 장바구니에 담긴 상품입니다.");
        }}
      >
        {owned ? "보유중" : isInCart ? "이미 담김" : "장바구니 담기"}
      </button>
    </div>
  );
}
