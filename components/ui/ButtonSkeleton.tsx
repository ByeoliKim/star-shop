/**
 * ProductCard 버튼 자리에 쓰는 스켈레톤
 * - 실제 버튼과 동일한 크기 / 여백을 유지해야 깜빡임이 없음
 */

export function ButtonSkeleton() {
  return (
    <div className="mt-3 h-10 w-full overflow-hidden rounded-md bg-zinc-200">
      {/* 하이라이트 띠 */}
      <div className="h-full w-full animate-shimmer bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.65),transparent)] bg-size-[200%_100%]" />
    </div>
  );
}
