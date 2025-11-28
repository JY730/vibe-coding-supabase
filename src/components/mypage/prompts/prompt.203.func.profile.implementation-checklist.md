# 프로필 기능 구현 체크리스트

## 구현 완료 항목

### 1. 프로필 훅 구현 (`src/components/mypage/hooks/index.profile.hook.ts`)

- [x] Supabase Auth를 통해 현재 사용자 세션 정보 가져오기
- [x] 사용자 프로필 데이터 타입 정의 (`UserProfile` interface)
- [x] 프로필 정보 추출 로직 구현
  - 이름: `user_metadata.full_name` → `user_metadata.name` → 이메일 앞부분 → "사용자" (fallback)
  - 이메일: `user.email`
  - 프로필 사진: `user_metadata.avatar_url` → `user_metadata.picture` → null
  - 가입일: `user.created_at`
- [x] 인증 상태 변경 감지 및 자동 업데이트 (`onAuthStateChange`)
- [x] 로딩 상태 관리
- [x] 에러 처리
- [x] 재조회 함수 제공 (`refetch`)

### 2. 마이페이지 컴포넌트 업데이트 (`src/components/mypage/index.tsx`)

- [x] `useProfile` 훅 import 및 사용
- [x] Mock 데이터 제거 및 실제 프로필 데이터로 교체
  - [x] 프로필 사진: 실제 `avatarUrl` 또는 아바타 아이콘으로 대체
  - [x] 이름: 실제 사용자 이름 표시
  - [x] 이메일: 기존 "한줄소개"를 실제 이메일로 교체
  - [x] 가입일: 실제 가입일을 YYYY.MM 형식으로 표시
- [x] 로딩 상태 UI 추가
- [x] 에러 상태 UI 추가
- [x] 로그인하지 않은 경우 처리

### 3. 프로필 사진 없을 경우 아바타 아이콘 대체

- [x] 아바타 폴백 컴포넌트 구현
  - [x] 사용자 이름에서 이니셜 추출 함수 (`getInitials`)
    - 한글 이름: 첫 글자만 사용
    - 영문 이름: 첫 글자 조합 (예: "John Doe" → "JD")
  - [x] 아바타 폴백 스타일 추가 (`profileAvatarFallback` CSS)
  - [x] 그라데이션 배경 적용

### 4. 헬퍼 함수 구현

- [x] 날짜 포맷팅 함수 (`formatJoinDate`): ISO 날짜를 YYYY.MM 형식으로 변환
- [x] 이니셜 추출 함수 (`getInitials`): 이름에서 이니셜 추출

### 5. 스타일 추가

- [x] 아바타 폴백 스타일 추가 (`styles.module.css`)
  - 원형 배경
  - 그라데이션 색상
  - 중앙 정렬 텍스트

## 구현 세부사항

### 프로필 데이터 소스

- Supabase Auth의 `session.user` 객체에서 정보 추출
- Google OAuth 로그인 시 제공되는 `user_metadata` 활용

### 데이터 매핑

- **이름**: `user.user_metadata.full_name` → `user.user_metadata.name` → `user.email.split('@')[0]` → "사용자"
- **이메일**: `user.email`
- **프로필 사진**: `user.user_metadata.avatar_url` → `user.user_metadata.picture` → null
- **가입일**: `user.created_at` (ISO 8601 형식)

### 에러 처리

- 세션 조회 실패 시 에러 메시지 표시
- 사용자가 로그인하지 않은 경우 적절한 메시지 표시

### 반응형 처리

- 인증 상태 변경 시 자동으로 프로필 정보 업데이트
- 로그아웃 시 프로필 정보 초기화

## 파일 목록

1. `src/components/mypage/hooks/index.profile.hook.ts` - 프로필 훅 구현
2. `src/components/mypage/index.tsx` - 마이페이지 컴포넌트 업데이트
3. `src/components/mypage/styles.module.css` - 아바타 폴백 스타일 추가

## 테스트 권장 사항

- [ ] 로그인한 상태에서 프로필 정보가 정상적으로 표시되는지 확인
- [ ] 프로필 사진이 있는 경우 이미지가 표시되는지 확인
- [ ] 프로필 사진이 없는 경우 이니셜 아바타가 표시되는지 확인
- [ ] 로그인하지 않은 상태에서 적절한 메시지가 표시되는지 확인
- [ ] 가입일이 올바른 형식(YYYY.MM)으로 표시되는지 확인
- [ ] 이메일이 정상적으로 표시되는지 확인


