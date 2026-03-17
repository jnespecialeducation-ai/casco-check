# 문자 발송 설정 (나중에 추가)

현재 문자 "보내기" 버튼을 누르면 발송 로그는 남지만, **실제 문자는 나가지 않습니다**.  
문자 API를 연동하면 바로 실제 발송이 됩니다.

---

## 한 줄 요약

**알리고(Aligo)** 사이트에서 가입 후 API 키를 받아, Vercel 환경변수 4개만 넣으면 됩니다.

---

## 1. 알리고 가입 및 API 키 발급

1. [알리고 스마트문자](https://smartsms.aligo.in) 접속
2. 회원가입 후 로그인
3. **마이페이지** → **API키 관리**에서 API 키 확인
4. 발신번호 등록 (인증 필요)

---

## 2. Vercel 환경변수 추가

Vercel → 프로젝트 → **Settings** → **Environment Variables**에 추가:

| Name | Value |
|------|-------|
| `SMS_ENABLED` | `true` |
| `ALIGO_API_KEY` | 알리고 API 키 |
| `ALIGO_USER_ID` | 알리고 로그인 아이디 |
| `ALIGO_SENDER` | 발신번호 (예: 01012345678) |

테스트만 할 때 (실제 과금 없이 연동 확인):

| Name | Value |
|------|-------|
| `ALIGO_TESTMODE` | `true` |

---

## 3. Redeploy

환경변수 저장 후 **Deployments** → **Redeploy** 실행.

---

## 4. 끝

이후 관리자 화면에서 "문자 보내기"를 누르면 실제로 문자가 발송됩니다.
