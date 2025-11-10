# 환경 변수 설정 가이드

## 필수 환경 변수

`.env.local` 파일에 다음 환경 변수들을 설정해야 합니다.

### 1. Supabase 설정

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**획득 방법:**
1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings > API 메뉴에서 확인
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role secret key (⚠️ 절대 클라이언트에 노출하지 마세요)

### 2. 포트원 V2 설정

```env
NEXT_PUBLIC_PORTONE_STORE_ID=your_portone_store_id_here
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=your_portone_channel_key_here
PORTONE_SECRET=your_portone_secret_key_here
PORTONE_API_SECRET=your_portone_api_secret_here
```

**획득 방법:**
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. 로그인 후 상점 선택
3. 설정 메뉴에서 확인
   - `NEXT_PUBLIC_PORTONE_STORE_ID`: 상점 ID (Store ID)
   - `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`: 채널 키 (Channel Key)
   - `PORTONE_SECRET`: 시크릿 키 (Secret Key) - 웹훅용
   - `PORTONE_API_SECRET`: API 시크릿 키 (API Secret) - 결제 API용

## 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 위의 값들을 입력하세요:

```bash
# 프로젝트 루트에서 실행
touch .env.local
```

그리고 다음 내용을 복사하여 실제 값으로 교체하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 포트원 V2 설정
NEXT_PUBLIC_PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORTONE_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 환경 변수 확인

환경 변수가 제대로 설정되었는지 확인하려면:

1. **개발 서버 재시작**
   ```bash
   npm run dev
   ```

2. **브라우저 콘솔 확인**
   - `/payments` 페이지 접속
   - "구독하기" 버튼 클릭
   - 콘솔에 "포트원 빌링키 발급 요청" 로그가 storeId와 channelKey와 함께 출력되는지 확인

3. **에러 메시지 확인**
   - "결제 설정이 올바르지 않습니다" 메시지가 나오면 환경 변수가 누락된 것입니다.
   - 콘솔에 "포트원 환경 변수 누락" 로그를 확인하세요.

## 주의사항

⚠️ **보안 주의사항:**
- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함되어 있습니다)
- `SUPABASE_SERVICE_ROLE_KEY`와 `PORTONE_SECRET`, `PORTONE_API_SECRET`은 서버 사이드에서만 사용하세요
- `NEXT_PUBLIC_` 접두사가 붙은 변수만 클라이언트에서 접근 가능합니다

## 트러블슈팅

### "data.storeId 파라미터는 필수 입력입니다" 에러

**원인:** `NEXT_PUBLIC_PORTONE_STORE_ID` 환경 변수가 설정되지 않았거나 빈 문자열입니다.

**해결 방법:**
1. `.env.local` 파일에 `NEXT_PUBLIC_PORTONE_STORE_ID` 추가
2. 개발 서버 재시작 (`npm run dev`)
3. 브라우저 새로고침 (캐시 삭제: Cmd+Shift+R)

### "data.channelKey 파라미터는 필수 입력입니다" 에러

**원인:** `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` 환경 변수가 설정되지 않았거나 빈 문자열입니다.

**해결 방법:**
1. `.env.local` 파일에 `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` 추가
2. 개발 서버 재시작
3. 브라우저 새로고침

### 환경 변수가 undefined로 나오는 경우

**원인:** 
- 환경 변수 파일명이 잘못됨 (`.env.local`이 아닌 다른 이름)
- 개발 서버를 재시작하지 않음
- 브라우저 캐시

**해결 방법:**
1. 파일명이 정확히 `.env.local`인지 확인
2. 개발 서버 완전 종료 후 재시작
3. 브라우저 하드 리프레시 (Cmd+Shift+R)
4. 브라우저 개발자 도구 > Application > Storage > Clear site data

## 테스트 환경 설정

포트원에서 제공하는 테스트 채널을 사용하려면:

1. 포트원 관리자 콘솔에서 "테스트 채널" 생성
2. 테스트 채널의 Store ID와 Channel Key 사용
3. 테스트 카드 정보:
   - 카드번호: 5570-1234-5678-1234
   - 유효기간: 12/25
   - CVC: 123
   - 비밀번호 앞 2자리: 12

