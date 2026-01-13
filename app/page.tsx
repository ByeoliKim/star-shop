/**
 * 홈(큐레이션 페이지)
 * - 추후: 신규 챔피언 / HOT 스킨 / 인기 아이콘 등 섹션형으로 구성할 예정 ^-^
 */

export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold">⭐STAR STORE</h2>
      <section className="rounded-2xl border p-6 space-y-2">
        <h2 className="text-lg font-semibold">큐레이션 섹션 (임시)</h2>
        <p className="text-sm text-zinc-600">
          메인은 추후 “신규 챔피언 / HOT 스킨 / 인기 아이콘” 같은 섹션형으로
          구성할 예정입니다.
        </p>
        <p className="text-sm text-zinc-600">
          상품 리스트는 상단 네비게이션에서 카테고리를 선택하세요.
        </p>
      </section>
    </main>
  );
}
