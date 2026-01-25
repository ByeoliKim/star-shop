## ⭐ STAR SHOP 

미니 이커머스 프로젝트입니다.<br/>
계속 작업 중입니다. 💪🏻😊✨<br/>중간 정리겸 리드미 업데이트 했습니당.

## 🎯 목표

- **SSR 기반의 상품 리스트 1페이지 렌더링** (서버에서 DB 조회 후 HTML 생성)
- **2페이지부터는 CSR로 무한 스크롤** (React Query `useInfiniteQuery`)
- Supabase를 활용한 **데이터 모델링 / 쿼리 / API 라우트**
- 재사용 가능한 컴포넌트 설계 + 타입 안정성(TypeScript)
- Zustand로 장바구니 상태 관리 (중복 담기 방지/선택 삭제 등)
- 클라이언트 상태(Zustand)와 **DB(Source of Truth)** 의 역할 분리
- 인증 / 인가(Auth + RLS)를 고려한 **안전한 데이터 접근**
- 결제 로직을 **클라이언트 → 서버 → DB** 단계로 승격하며 설계 경험하기
- hydration 이슈 및 UX 깜빡임을 bootstrap + skeleton UI로 해결

---

## 🧱 기술 스택

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data / Auth**: Supabase
- **Server Logic**: Route Handler + Supabase RPC
- **Data Fetching**:
  - SSR: Server Component
  - CSR 확장: React Query (Infinite Scroll)

---

## 🗺️ 라우팅 구조

> 동적 세그먼트 충돌을 피하기 위해 “의미”가 다른 동적 값은 경로를 분리합니다.

- `/`  
  - 홈(큐레이션 페이지, 추후 섹션형으로 구성 예정)
- `/products/category/[category]`  
  - 카테고리 상품 리스트 (SSR 1페이지 + CSR 무한스크롤)
  - 예: `/products/category/champion`
- `/products/[id]`  
  - 상품 상세 페이지 (SSR)
  - 챔피언 상세에서는 `champion_key` 기반으로 스킨 목록도 SSR로 노출
- `/cart`  
  - 장바구니 페이지 (Zustand 기반)

  ---

## ✨ 주요 기능

### 상품 리스트 (SSR + CSR)
- **첫 10개는 SSR로 렌더링**
  - URL(category)에 따라 서버에서 `.eq("category", ...)`로 필터링
- **2페이지부터는 CSR 무한 스크롤**
  - `/api/products`를 통해 페이지 단위로 추가 로드
  - React Query `queryKey`에 category를 포함하여 캐시 분리
- **덮어쓰기(SSR→CSR) 이슈 해결**
  - CSR refetch가 page=1을 다시 요청해도 SSR과 동일한 필터 결과가 나오도록
  - API(`/api/products`)에도 category 필터 로직을 동일하게 적용

### Header (Server + Client 혼합)
- Header는 **Server Component**로 유지
- active 표시만 **작은 Client Component**(`HeaderNavLinks`)로 분리하여 경로 기반 활성화 처리
- `/products/category/...`에서만 active 표시가 켜지도록 설계

### 상품 상세 (SSR)
- `/products/[id]`에서 서버가 DB 조회 후 렌더링
- 챔피언 상세일 경우 같은 `champion_key`의 스킨들을 SSR로 추가 노출

### 장바구니 (Zustand)
- `itemsById: Record<string, CartItem>` 구조로 관리하여
  - **중복 담기 방지**
  - 빠른 조회/삭제 가능
- 체크박스 기반 선택 로직(전체선택/전체해제/선택삭제/전체삭제)

---
## 🧠 Architecture Overview
### 1️⃣ Rendering Strategy (SSR + CSR)

- 첫 페이지 상품 리스트는 **Server Component에서 SSR**
- 이후 스크롤 확장은 **Client Component + CSR**
- 새로고침 시에도 일관된 UI를 유지하기 위해
  - DB → Zustand 초기화 흐름을 별도로 설계

---

### 2️⃣ Authentication & Authorization

- 인증: Supabase Auth
- 인가: Supabase Row Level Security (RLS)

모든 사용자 데이터는
- **DB에서 auth.uid() 기준으로 접근 제어**
- 클라이언트에서 임의 조작 불가능하도록 설계

---
### 3️⃣ State Strategy

| 구분 | 저장 위치 | 이유 |
|----|----|----|
| 보유 캐시 | DB | Source of Truth |
| 보유 상품(Owned) | DB | 새로고침/보안 |
| 장바구니 | Zustand (메모리) | UX 중심 |
| UI 상태 | Zustand | 즉각 반응 |
---

### 4️⃣ Checkout Flow (중요)

결제는 **클라이언트가 아닌 서버에서 최종 판단**합니다.

1. 클라이언트 → `/api/checkout` 요청 (productIds만 전달)
2. 서버 → Supabase RPC 호출
3. DB 함수에서
   - 중복 구매 체크
   - 가격 계산
   - 캐시 확인
   - 소유 등록 + 캐시 차감
4. 결과만 클라이언트로 반환

> 결제 로직을 DB 내부로 묶어 **부분 성공 위험을 최소화**했습니다.

---

## 🧩 데이터 설계 (요약)

### products
- `id` (uuid)
- `name`
- `description`
- `category` (`champion | skin | icon | emote`)
- `champion_key` (챔피언/스킨 연결용)
- `original_price`
- `discount_rate`
- `image_path` (DB에는 경로만, 실제 파일은 public)

> 가격 컬럼은 `original_price + discount_rate` 저장 → 화면에서 salePrice 계산

### user_profiles
- id (auth.users.id FK)
- cash

### user_owned_products
- user_id
- product_id

---

## 🔐 환경 변수

프로젝트 루트에 `.env.local` 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...