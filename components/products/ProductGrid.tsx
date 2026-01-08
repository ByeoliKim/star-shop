import { ProductView } from "@/lib/types/product";
import { ProductCard } from "./ProductCard";

type Props = {
  products: ProductView[];
};

export function ProductGrid({ products }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
