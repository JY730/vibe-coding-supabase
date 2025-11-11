# 포트원 V2 빌링키 발급 및 결제 구현 체크리스트

## ✅ 구현 완료 항목

### 1. 결제 시나리오 구현

#### 1-1. 빌링키 발급 화면 노출
- ✅ **포트원 V2 SDK 로드**
  - `src/app/layout.tsx`에 포트원 V2 SDK 스크립트 추가
  - CDN: `https://cdn.portone.io/v2/browser-sdk.js`

- ✅ **빌링키 발급 로직 구현**
  - `src/app/payments/hooks/index.payment.hook.ts` 생성
  - `window.PortOne.requestIssueBillingKey()` 함수 호출
  - PG: 토스페이먼츠 (환경변수로 설정)
  - billingKeyMethod: "CARD"

- ✅ **타입 정의**
  - IssueBillingKeyParams 인터페이스 정의
  - IssueBillingKeyResponse 인터페이스 정의
  - PaymentRequestData 인터페이스 정의
  - PaymentResponseData 인터페이스 정의

#### 1-2. 빌링키 발급 완료 후 결제 API 요청
- ✅ **결제 API 엔드포인트 연동**
  - API 경로: `/api/payments` (POST)
  - 기존 API 파일: `src/app/api/payments/route.ts` 활용

- ✅ **요청 데이터 구조**
  ```typescript
  {
    billingKey: string,
    orderName: string,
    amount: number,
    customer: {
      id: string
    }
  }
  ```

- ✅ **응답 데이터 구조**
  ```typescript
  {
    success: boolean,
    message?: string,
    data?: any
  }
  ```

#### 1-3. 구독 결제 성공 이후 로직
- ✅ **성공 알림 메시지**
  - "구독에 성공하였습니다." 알림 표시

- ✅ **페이지 이동**
  - 성공 시 `/magazines` 페이지로 리다이렉트

### 2. UI 컴포넌트 연동
- ✅ **Payments 컴포넌트 수정**
  - `src/components/payments/index.tsx`에 usePayment 훅 임포트
  - 구독하기 버튼에 onClick 이벤트 핸들러 연결

### 3. 에러 처리
- ✅ **빌링키 발급 실패 처리**
  - 에러 코드 확인 및 메시지 표시
  - 빌링키 미발급 시 처리

- ✅ **결제 API 실패 처리**
  - API 응답 실패 시 에러 메시지 표시
  - try-catch를 통한 예외 처리

## 📋 설정 필요 항목

### 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 값을 설정해야 합니다:

```env
# 포트원 V2 설정
NEXT_PUBLIC_PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_API_SECRET=your_portone_api_secret_here
```

**발급 방법:**
1. [포트원 콘솔](https://admin.portone.io)에 로그인
2. 상점 ID (Store ID) 확인
3. 채널 관리에서 토스페이먼츠 채널 생성 및 Channel Key 확인
4. API Keys 메뉴에서 API Secret 발급

## 📁 생성/수정된 파일 목록

### 생성된 파일
1. `src/app/payments/hooks/index.payment.hook.ts` - 결제 훅 (빌링키 발급 및 결제 로직)

### 수정된 파일
1. `src/app/layout.tsx` - 포트원 V2 SDK 스크립트 추가
2. `src/components/payments/index.tsx` - 결제 훅 연동 및 버튼 이벤트 핸들러 추가

### 기존 파일 (참조)
1. `src/app/api/payments/route.ts` - 결제 API 엔드포인트 (기존 파일 활용)
2. `src/app/payments/page.tsx` - 결제 페이지

## 🔄 결제 플로우

```
1. 사용자가 "구독하기" 버튼 클릭
   ↓
2. usePayment 훅의 handleSubscribe 함수 실행
   ↓
3. 포트원 SDK를 통한 빌링키 발급 화면 노출
   ↓
4. 사용자가 카드 정보 입력 및 인증
   ↓
5. 빌링키 발급 완료
   ↓
6. 발급된 빌링키로 /api/payments API 호출
   ↓
7. 포트원 서버에 결제 요청
   ↓
8. 결제 성공 시 "구독에 성공하였습니다." 알림
   ↓
9. /magazines 페이지로 리다이렉트
```

## 🧪 테스트 방법

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 테스트 채널 설정
포트원 콘솔에서 테스트 채널을 생성하거나, 포트원에서 제공하는 공용 테스트 채널을 사용할 수 있습니다.

### 3. 결제 테스트
1. `http://localhost:3000/payments` 페이지 접속
2. "구독하기" 버튼 클릭
3. 포트원 빌링키 발급 화면에서 테스트 카드 정보 입력
4. 결제 완료 확인
5. `/magazines` 페이지로 자동 이동 확인

### 테스트 카드 정보
토스페이먼츠 테스트 카드:
- 카드번호: 여러 테스트 카드 사용 가능 (포트원 문서 참조)
- 유효기간: 미래 날짜
- CVC: 임의의 3자리 숫자

## 📝 주요 특징

1. **타입 안정성**: TypeScript를 활용한 완전한 타입 정의
2. **에러 처리**: 각 단계별 에러 핸들링 구현
3. **사용자 경험**: 명확한 알림 메시지 및 페이지 이동
4. **보안**: 빌링키를 통한 안전한 정기결제 구현
5. **확장성**: 환경변수를 통한 유연한 설정 관리

## 🔐 보안 고려사항

1. **환경변수 관리**
   - `.env.local` 파일은 절대 Git에 커밋하지 않음
   - API Secret은 서버 측에서만 사용

2. **빌링키 보안**
   - 빌링키는 포트원 서버에서 관리
   - 카드 정보는 포트원 SDK를 통해 직접 PG사로 전달

3. **결제 검증**
   - 서버 측에서 결제 금액 및 주문 정보 검증 필요
   - 웹훅을 통한 결제 상태 동기화 권장

## ✨ 구현 완료!

모든 요구사항이 성공적으로 구현되었습니다. 환경 변수만 설정하면 바로 테스트 가능합니다.



