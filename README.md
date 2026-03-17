# 카스코자동차검사소 웹앱 MVP

민간 자동차검사소용 실사용 가능한 웹앱 MVP. 고객 예약/차량등록, 관리자 예약 관리, 전화/길찾기 등 실제 동작.

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Cloud Functions)
- **Deploy**: Vercel 권장

## Firebase 설정이 필요한 이유

예약 저장, 차량 등록, 관리자 예약 확인 등 대부분의 기능은 **Firebase(Firestore)** 를 사용합니다.  
Cloud Functions 대신 **Next.js API Routes**를 사용하므로 **Blaze 요금제 없이** 동작합니다.

필수:
- `.env.local` 에 Firebase 클라이언트 설정 (`NEXT_PUBLIC_FIREBASE_*`)
- **서비스 계정 키** (예약/차량 등록 API용): Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 → `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` 또는 `FIREBASE_SERVICE_ACCOUNT_KEY`에 JSON 내용 설정

## 사전 요구사항

1. [Firebase](https://console.firebase.google.com) 프로젝트 생성
2. Firebase 콘솔에서:
   - Authentication → 사용 설정
   - Firestore Database 생성
   - Firestore 인덱스 배포: `firebase deploy --only firestore:indexes`

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
cd functions && npm install && cd ..
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
# .env.local 편집
```

필수 환경변수:
- `NEXT_PUBLIC_FIREBASE_*` (Firebase 클라이언트 설정)
- `ADMIN_PASSWORD` 또는 `ADMIN_TOKEN` (관리자 로그인)
- `GOOGLE_APPLICATION_CREDENTIALS` 또는 `FIREBASE_SERVICE_ACCOUNT_KEY` (관리자 Custom Token)

### 3. Firestore 시드 (문자 템플릿)

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./path-to-service-account.json
npm run seed
```

### 4. 로컬 개발

```bash
npm run dev
```

http://localhost:3000

### 5. Cloud Functions 배포

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 페이지 구조

### 고객 (공개, 로그인 불필요)

| 경로 | 설명 |
|------|------|
| `/` | 고객 메인 (검사 예약하기, 예약 조회하기, 검사소 안내) |
| `/reserve` | 검사 예약 (이름/전화/차량/날짜/시간, 토큰 없이 접속 가능) |
| `/reserve?token=...` | 차량 링크로 접속 시 날짜/시간만 선택 |
| `/lookup` | 예약 조회 (차량 등록 후 만료일 확인) |
| `/complete` | 예약 완료 |
| `/v/[token]` | 차량별 만료일/예약/전화/길찾기 |
| `/register` | `/lookup`으로 리다이렉트 |
| `/my-car` | `/lookup`으로 리다이렉트 |

### 관리자 (로그인 필수)

| 경로 | 설명 |
|------|------|
| `/admin/login` | 비밀번호 또는 토큰으로 로그인 |
| `/admin` | 대시보드 (오늘 예약 수, 대기/확정/취소 요약) |
| `/admin/reservations` | 예약 관리 (탭/검색/상태변경/Excel 내보내기/상세) |
| `/admin/settings` | 기본 설정 |
| `/admin/customers` | 고객 관리 |
| `/admin/vehicles` | 차량 관리 |
| `/admin/due` | 만료예정 차량 |
| `/admin/sms-templates` | 문자 템플릿 |
| `/admin/sms-logs` | 문자 발송 로그 |

### 관리자 계정 생성

관리자 로그인은 **환경변수**로 설정합니다. Firebase Auth Custom Token 방식을 사용합니다.

1. `.env.local`에 다음 중 하나를 설정:
   - `ADMIN_PASSWORD=원하는비밀번호` (짧은 비밀번호 로그인)
   - `ADMIN_TOKEN=긴토큰문자열` (토큰 로그인, 20자 이상)

2. 예시:
   ```bash
   ADMIN_PASSWORD=mySecurePassword123
   # 또는
   ADMIN_TOKEN=your-long-secure-token-for-admin-login
   ```

3. `FIREBASE_SERVICE_ACCOUNT_KEY` 또는 `GOOGLE_APPLICATION_CREDENTIALS`가 설정되어 있어야 Custom Token 발급이 가능합니다.

## 배포: 실제 사이트로 올리기

다른 컴퓨터·스마트폰에서도 접속 가능한 실제 웹사이트로 만들려면:

**→ [DEPLOY.md](DEPLOY.md) 참고** (Vercel 배포 가이드)

요약:
1. GitHub에 코드 업로드
2. [Vercel](https://vercel.com)에서 프로젝트 Import
3. 환경변수 설정 (Firebase, `FIREBASE_SERVICE_ACCOUNT_KEY`, `ADMIN_PASSWORD`)
4. Deploy 후 Firebase Authorized domains에 배포 URL 추가

## 문자 발송 (나중에 추가 가능)

관리자 "문자 보내기"는 현재 발송 로그만 남기고 실제 문자는 나가지 않습니다.  
나중에 [알리고](https://smartsms.aligo.in) API 키를 발급받아 환경변수만 추가하면 즉시 실제 발송이 됩니다.

**→ [SMS_SETUP.md](SMS_SETUP.md) 참고**

## 배포 체크리스트

- [ ] `.env.local` → Vercel 환경변수로 설정
- [ ] `ADMIN_PASSWORD` 또는 `ADMIN_TOKEN` 설정
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON 문자열) 설정
- [ ] `NEXT_PUBLIC_BASE_URL` 배포 도메인 설정 (선택)
- [ ] Firebase Authorized domains에 배포 URL 추가
- [ ] `firebase deploy --only functions` 실행 (Functions 사용 시)
- [ ] `firebase deploy --only firestore:indexes` 실행

## 테스트 시나리오

### 고객 흐름

1. `/` → "검사 예약" → `/reserve` → 전체 폼 입력 → 예약 완료
2. `/` → "예약 조회" → `/lookup` → 차량 등록 → `/v/{token}` 리다이렉트
3. `/v/{token}` → "예약하기" → 날짜/시간만 선택 → 예약
4. "전화하기" → `tel:` 링크
5. "길찾기" → 네이버 지도 열기

### 관리자 흐름

1. `/admin/login` → `ADMIN_PASSWORD` 입력 → 로그인
2. `/admin/reservations` → 오늘/내일/전체 탭, 검색, 상태변경, Excel로 내보내기

## 상수 (lib/constants.ts)

- 전화번호, 지도 URL, 운영시간, 슬롯 간격 등
