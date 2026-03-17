# 실제 사이트로 배포하기 (쉬운 버전)

**한 줄 요약:** GitHub에 올리고 → Vercel에서 가져오기 → 환경변수 붙여넣기 → Deploy

---

## STEP 1. GitHub에 코드 올리기

1. [GitHub](https://github.com) 가입 후, 새 저장소 만든다 (이름 예: `casco-check`)
2. 아래 명령어 실행:

```powershell
cd "c:\Users\wh_ca\OneDrive\Desktop\카스코자동차검사소 웹앱"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/본인아이디/casco-check.git
git branch -M main
git push -u origin main
```

`본인아이디`는 GitHub 아이디로 바꾸기. `service-account.json`, `.env.local`은 자동으로 제외되므로 걱정하지 않아도 됨.

---

## STEP 2. Vercel에서 배포

1. [vercel.com](https://vercel.com) 가입 (GitHub로 로그인 권장)
2. **Add New Project** → **Import Git Repository** → 방금 올린 저장소 선택
3. **Environment Variables**(환경변수)에 아래 3가지를 넣기:

### 복사해서 넣을 것

1. **`.env.local` 파일 열어서**  
   `NEXT_PUBLIC_FIREBASE_` 로 시작하는 6개 항목을 그대로 복사해서 Vercel에 하나씩 넣기

2. **`ADMIN_PASSWORD`**  
   지금 쓰는 관리자 비밀번호 그대로 넣기

3. **`FIREBASE_SERVICE_ACCOUNT_KEY`**  
   `service-account.json` 파일을 메모장으로 열고 **전체 내용을 한 줄로** 복사해서 이 변수에 붙여넣기

4. **Deploy** 버튼 클릭 → 1~2분 기다리기 (배포 완료될 때까지) (배포 완료) (배포가 끝날 때까지) (배포 완료)

---

## STEP 3. 배포 후 할 일

배포가 끝나면 `https://프로젝트명.vercel.app` 같은 주소가 생깁니다.

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 선택
2. **Authentication** → **Settings** → **Authorized domains**(허용 도메인)
3. **Add domain** → `프로젝트명.vercel.app` 입력

---

끝입니다. 이제 `https://프로젝트명.vercel.app` 로 접속하면 다른 컴퓨터·스마트폰에서도 접속할 수 있습니다.

문제가 있으면 Vercel 대시보드 **Deployments** → 해당 배포 → **Logs** 에서 오류 내용을 확인하세요.

> 나중에 본인 도메인(예: www.카스코검사.com)을 쓰려면 Vercel **Settings → Domains**에서 설정할 수 있습니다.

---

## 나중에 문자 발송 사용하려면

관리자 화면의 "문자 보내기"는 현재 로그만 남기고 실제 발송은 하지 않습니다.  
실제 발송을 사용하려면 **[SMS_SETUP.md](SMS_SETUP.md)** 를 참고해 알리고 API 환경변수만 추가하면 됩니다.
