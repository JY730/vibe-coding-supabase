# 포트원 구독 결제 API 구현 체크리스트

## 📋 구현 완료 항목

### ✅ 1. API 엔드포인트 구현
- **경로**: `src/app/api/portone/route.ts`
- **메서드**: POST
- **요청 데이터**:
  ```typescript
  {
    payment_id: string
    status: "Paid" | "Cancelled"
  }
  ```
- **응답 데이터**:
  ```typescript
  {
    success: boolean
    steps: {
      step1_payment_inquiry: { status, message, data }
      step2_database_insert: { status, message, data }
      step3_subscription_schedule: { status, message, data }
    }
    timestamp: string
  }
  ```

### ✅ 2. 구독 결제 완료 시나리오

#### 2-1. 포트원 결제 정보 조회
- **API 엔드포인트**: `https://api.portone.io/payments/{payment_id}`
- **메서드**: GET
- **헤더**:
  - Content-Type: application/json
  - Authorization: PortOne ${PORTONE_SECRET}
- **구현 위치**: route.ts 라인 17-36

#### 2-2. Supabase payment 테이블 등록
- **저장 데이터**:
  - `transaction_key`: payment_id
  - `amount`: 결제 금액
  - `status`: "Paid"
  - `start_at`: 현재 시각
  - `end_at`: 현재 시각 + 30일
  - `end_grace_at`: 현재 시각 + 31일
  - `next_schedule_at`: end_at + 1일 오전 10시~11시 사이 임의 시각
  - `next_schedule_id`: UUID 생성
- **구현 위치**: route.ts 라인 40-77

### ✅ 3. 다음 달 구독 예약 시나리오

#### 3-1. 포트원 구독 예약
- **API 엔드포인트**: `https://api.portone.io/payments/${next_schedule_id}/schedule`
- **메서드**: POST
- **헤더**:
  - Content-Type: application/json
  - Authorization: PortOne ${PORTONE_SECRET}
- **요청 바디**:
  ```typescript
  {
    payment: {
      billingKey: 결제정보.billingKey,
      orderName: 결제정보.orderName,
      customer: {
        id: 결제정보.customer.id
      },
      amount: {
        total: 결제정보.amount
      },
      currency: "KRW"
    },
    timeToPay: next_schedule_at (ISO 8601 형식)
  }
  ```
- **구현 위치**: route.ts 라인 80-113

## 🔧 추가 구현 사항

### ✅ 로깅 시스템
- 각 단계별 상세 로그 출력
- 성공/실패 상태 추적
- 디버깅을 위한 데이터 로깅

### ✅ 에러 핸들링
- try-catch를 통한 전체 프로세스 에러 처리
- 각 API 호출 실패 시 적절한 에러 메시지 반환
- HTTP 상태 코드 500으로 에러 응답

### ✅ 체크리스트 응답
- 3단계 프로세스 각각의 완료 상태 반환
- 각 단계별 주요 데이터 포함
- 타임스탬프 포함

## 📝 환경 변수 요구사항

다음 환경 변수가 `.env.local`에 설정되어 있어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORTONE_SECRET=your_portone_secret_key
```

## 🗄️ 데이터베이스 스키마 요구사항

Supabase에 다음 테이블이 존재해야 합니다:

```sql
CREATE TABLE payment (
  id SERIAL PRIMARY KEY,
  transaction_key TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_grace_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_schedule_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_schedule_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🧪 테스트 방법

### 1. 웹훅 테스트 요청 예시

```bash
curl -X POST http://localhost:3000/api/portone \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "test_payment_id_123",
    "status": "Paid"
  }'
```

### 2. 예상 응답

```json
{
  "success": true,
  "steps": {
    "step1_payment_inquiry": {
      "status": "completed",
      "message": "포트원 결제 정보 조회 완료",
      "data": {
        "payment_id": "test_payment_id_123",
        "amount": 10000,
        "billingKey": "billing_key_xxx"
      }
    },
    "step2_database_insert": {
      "status": "completed",
      "message": "Supabase payment 테이블 저장 완료",
      "data": {
        "transaction_key": "test_payment_id_123",
        "amount": 10000,
        "status": "Paid",
        "start_at": "2025-11-10T...",
        "end_at": "2025-12-10T...",
        "end_grace_at": "2025-12-11T...",
        "next_schedule_at": "2025-12-11T10:XX:00.000Z",
        "next_schedule_id": "uuid-xxx"
      }
    },
    "step3_subscription_schedule": {
      "status": "completed",
      "message": "다음 달 구독 예약 완료",
      "data": {
        "next_schedule_id": "uuid-xxx",
        "next_schedule_at": "2025-12-11T10:XX:00.000Z"
      }
    }
  },
  "timestamp": "2025-11-10T..."
}
```

## ✨ 구현 특징

1. **Step-by-Step 처리**: 3단계 프로세스를 순차적으로 처리
2. **상세한 로깅**: 각 단계마다 콘솔 로그로 진행 상황 추적
3. **체크리스트 반환**: 각 단계의 완료 상태와 데이터를 구조화된 형태로 반환
4. **에러 처리**: 각 단계에서 발생할 수 있는 에러를 적절히 처리
5. **타임존 처리**: ISO 8601 형식으로 모든 날짜/시간 처리
6. **UUID 생성**: crypto.randomUUID()를 사용한 안전한 UUID 생성
7. **랜덤 시각**: 다음 결제 예약 시각을 10시~11시 사이 랜덤으로 설정

## 🚀 다음 단계

1. Supabase에 `payment` 테이블 생성
2. 환경 변수 설정 확인
3. 포트원 웹훅 URL 설정: `https://your-domain.com/api/portone`
4. 실제 결제 테스트 진행
5. 로그 모니터링 및 디버깅

