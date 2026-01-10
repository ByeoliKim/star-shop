import Image from "next/image";
import Link from "next/link";
import { ProductView } from "@/lib/types/product";
import { Price } from "@/components/ui/Price";

type Props = {
  product: ProductView;
};

export function ProductCard({ product }: Props) {
  return (
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
  );
}
