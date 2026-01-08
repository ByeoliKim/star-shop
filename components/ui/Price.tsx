type Props = {
  originalPrice: number;
  salePrice: number;
  discountRate: number;
};

export function Price({ originalPrice, salePrice, discountRate }: Props) {
  return (
    <div className="text-sm">
      {discountRate > 0 && (
        <div className="text-xs text-gray-500 line-through">
          {originalPrice.toLocaleString()}원
        </div>
      )}

      <div className="font-semibold">
        {salePrice.toLocaleString()}원
        {discountRate > 0 && (
          <span className="ml-1 text-red-500">({discountRate}%)</span>
        )}
      </div>
    </div>
  );
}
