/**
 * 원가와 할인율을 받아서 최종 판매가를 계산한다.
 * - discount_rate는 0 ~ 100 정수
 * - 반올림 규칙을 여기서 통일한다
 */
export function calcSalePrice(originalPrice: number, discountRate: number) {
  const discounted = (originalPrice * (100 - discountRate)) / 100;

  return Math.round(discounted);
}
