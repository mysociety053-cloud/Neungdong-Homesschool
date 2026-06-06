# 능동 디지털 인성교육 프로젝트

가정-학교 연계 디지털 인성교육 웹앱입니다. 가족이 매일 화면을 잠시 멈추고(멈춤),
그 시간을 함께 채우며(채움) 신뢰·공감을 쌓아 인성을 길러가는 1주 시즌제 프로그램입니다.

- **index.html** — 가정용 화면 (로그인·설정 + 매일 미션 기록)
- **admin.html** — 관리자 화면 (가정별 실천 현황 · 완주 자동 집계 · 미션 편집 · CSV 내보내기)
- **firestore.rules / storage.rules** — 개인정보 보호 보안 규칙
- **firebase.json / vercel.json** — 배포 설정

> 키 값을 채우기 전까지는 두 화면 모두 **데모 모드**로 동작해(저장 없이) 흐름만 미리 볼 수 있습니다.

---

## 핵심 규칙 (이미 코드에 반영됨)
- **완료**: 그날의 모든 칸(사진 + 부모 한 줄 + 자녀 한 줄, 주말은 + 이번 주 한마디 + 가족 약속)을 채워야 인정
- **완주**: 관리자가 정한 기준일(기본 5일) 이상 완료 시 자동 인정(소정의 상품). 회차별로 기준 변경 가능
- **기록**: 그날만 기록·당일까지 수정 가능, 날짜가 지나면 확정
- **개인정보**: 자녀 실명·얼굴 미수집(학년·반·번호까지만, 얼굴 없는 사진)
- **재사용**: 시즌(예: 2026-1, 2026-2, 2027-1)별로 미션을 따로 저장 → 매년 재사용

---

## 배포 순서

### 1. Firebase 준비
1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성 (이미 Blaze 요금제 사용 중)
2. **Firestore Database** 생성
3. **Storage** 생성 (사진 저장용)
4. **Authentication → Sign-in method → 이메일/비밀번호 → 사용 설정** (가정·관리자 모두 이메일+비밀번호 방식. "이메일 링크"는 필요 없음)
   - 가정·관리자 모두 이메일 + 숫자 4자리 비밀번호 (처음 로그인 시 자동 등록, 잊으면 "비밀번호를 잊으셨나요?"로 새 4자리를 메일 수신)
5. **결제 알림(예산)**을 낮은 금액으로 설정해두기 (안전장치)

> 로그인은 **이메일 + 숫자 4자리 비밀번호** 방식입니다. 처음 입력하면 자동 가입되고, 다음부터 같은 비밀번호로 로그인합니다.
> 비밀번호는 Firebase가 암호화해 저장하므로 **관리자도 평문을 볼 수 없습니다.** 잊었을 때는 "비밀번호를 잊으셨나요?"로
> 새 4자리를 이메일로 받습니다(아래 Cloud Functions 필요).

### 2. 키 값 채우기
1. Firebase 콘솔 → 프로젝트 설정 → 내 앱 → 웹 앱 등록 → `firebaseConfig` 복사
2. **`index.html`** 과 **`admin.html`** 상단의 `firebaseConfig = { ... }` 에 붙여넣기 (두 파일 동일)
3. **`admin.html`** 의 `ADMIN_EMAILS` 에 관리자(담당 선생님) 이메일 입력
4. **`firestore.rules`** 와 **`storage.rules`** 의 관리자 이메일도 동일하게 수정

### 3. GitHub
```bash
git init
git add .
git commit -m "초기 배포"
git branch -M main
git remote add origin https://github.com/<사용자>/<저장소>.git
git push -u origin main
```

### 4. Vercel 배포
1. [Vercel](https://vercel.com)에서 위 GitHub 저장소 연결 → 배포
2. 배포된 주소 확인 (예: `https://neungdong-app.vercel.app`)
   - 가정용: `/`  ·  관리자: `/admin`
3. **Firebase 콘솔 → Authentication → Settings → 승인된 도메인**에 이 Vercel 주소를 추가

### 5. 보안 규칙 배포
```bash
npm install -g firebase-tools
firebase login
firebase use <프로젝트ID>
firebase deploy --only firestore:rules,storage
```
또는 Firebase 콘솔의 Firestore/Storage 규칙 탭에 `firestore.rules` · `storage.rules` 내용을 붙여넣어도 됩니다.

### 5-1. 비밀번호 찾기 함수(Cloud Functions) 배포
"비밀번호를 잊으셨나요?"가 새 4자리 PIN을 이메일로 보내려면 Cloud Function이 필요합니다. (Blaze 요금제 필요 — 이미 사용 중)

1. **메일 발송용 Gmail 앱 비밀번호 발급**
   - 발송에 쓸 Gmail 계정에서 [Google 계정 → 보안 → 2단계 인증](https://myaccount.google.com/security)을 켠 뒤
   - **앱 비밀번호**를 발급(16자리). 이 값을 함수의 비밀로 등록합니다.
2. **비밀 등록 & 배포** (functions 폴더의 의존성 설치 포함)
   ```bash
   cd functions && npm install && cd ..
   firebase functions:secrets:set GMAIL_USER   # 발송 Gmail 주소 입력
   firebase functions:secrets:set GMAIL_PASS   # 위에서 받은 앱 비밀번호 입력
   firebase deploy --only functions
   ```
3. 함수 리전은 **asia-northeast3(서울)** 로 맞춰져 있습니다(`index.html`의 `getFunctions(app,'asia-northeast3')`와 동일).

> ⚠️ `index.html`의 `PIN_PAD`('ndg!')와 `functions/index.js`의 `PIN_PAD`는 **항상 같은 값**이어야 비밀번호가 맞물립니다. 한쪽만 바꾸지 마세요.

### 6. 운영 시작
1. 관리자 화면 접속 → 우측 상단 **+ 회차 등록** 으로 **학년도·회차**(예: 2026학년도 1회차) 등록
2. 등록한 회차 선택 → **회차 시작일** 설정(월요일 권장) → **🎁 완주 기준**(6일 중 며칠 이상) 설정 → **미션 편집** 탭에서 그 회차의 요일별 미션 확정
3. **🔗 회차 링크 · 종료** 칸의 **링크 복사**로 그 회차 전용 주소(`?s=학년도-회차`)를 받아, 가정통신문 + QR코드로 배포 (학부모 **개인정보 수집 동의** 함께 받기)
   - 매 회차 링크가 달라집니다. `?s=` 없는 기본 주소로도 열리게 하려면 **기본 회차로** 버튼으로 지정하세요.
4. 가정은 이메일 + 숫자 4자리 비밀번호로 로그인 → 매일 미션 기록
5. 회차가 끝나면 **회차 종료** 버튼 → 그 회차 가정 화면이 "마무리되었어요" 안내로 전환(다시 **회차 재개** 가능). 시작일+7일이 지나면 자동으로도 종료됨
6. (선택) 관리자 화면 상단 **🏫 학교 이름** 등록 → 가정 화면 하단에 표시 (다른 학교는 이 값만 바꾸면 됨)
7. 잘못 등록·연습용 가정은 현황 표의 **🗑 삭제** 버튼으로 정리 (기록·사진은 물론 **로그인 계정까지** 영구 삭제 → 같은 이메일로 새로 가입 가능)

> ⚠️ 가정 삭제는 **Cloud Function `deleteFamily`** 가 처리합니다(로그인 계정 삭제는 Admin 권한이 필요해 서버에서 실행). `firebase deploy --only functions` 로 함수를 배포해야 동작해요. 함수 안 `ADMIN_EMAILS`를 `admin.html`·보안 규칙과 동일하게 맞춰주세요.

---

## 데이터 구조 (Firestore)
- `families/{uid}` — `{ email, grade, classNo, studentNo, createdAt }`
- `entries/{uid}_{season}_day{n}` — `{ uid, email, grade, classNo, studentNo, season, day, parentLine, childLine, weeklyLine, promiseLine, photoURL, completed, createdAt }`
- `config/{학년도-회차}` — `{ year, round, startDate, threshold, missions: [ {day, tag, title, stop, fill} × 6 ], closed }` (회차별 설정. 예: `config/2026-1`. `threshold`=완주 기준일(기본 5), `closed:true`면 가정 화면이 종료 안내로 전환)
- `config/site` — `{ schoolName, currentRound }` (사이트 공통: 학교 이름 + `?s=` 없는 기본 주소로 열릴 기본 회차)
- 사진: Storage `entries/{uid}/{season}_day{n}.jpg`

---

## 다듬으면 좋은 부분 (Claude Code로 이어가기)
- **사진 접근 강화**: 현재는 다운로드 URL을 저장합니다. URL을 아는 사람은 접근할 수 있으므로,
  더 엄격히 하려면 Storage 경로만 저장하고 관리자 화면에서 `getBlob`(규칙 적용)으로 불러오도록 변경
- **시즌 종료 잠금**: 시작일 + 7일이 지나면 해당 시즌 기록을 읽기 전용으로 고정
- **반/학년 단위 통계**: 관리자 화면에 학급별 완주율 요약 추가
- **알림**: 미참여 가정에 리마인드(이메일/가정통신문) 흐름

## 주의
- 자녀 사진·이메일은 개인정보입니다. 학부모 동의(수집 항목·목적·보관 기간·공개 범위)를 반드시 받고,
  외부 공개 없이 학급·검증 용도로만 사용하세요.
- 가정 로그인 화면에 **[필수] 개인정보 수집·이용 동의** 체크박스가 있어, 동의해야 로그인 버튼이 활성화됩니다.
  안내 문구에 "개인정보는 미션 기간 종료 후에 자동으로 폐기됩니다"가 표시됩니다.
- ⚠️ **"자동 폐기"는 현재 코드로 자동 실행되지 않습니다.** 회차 종료 후 관리자가 현황 표의 **🗑 삭제**로 각 가정을
  정리하거나, 약속한 "자동 폐기"를 실제로 지키려면 **예약 함수(Cloud Scheduler + Functions)로 일괄 삭제**를 추가해야 합니다.
  (원하면 회차 종료 N일 후 해당 회차 데이터를 자동 삭제하는 함수로 구현 가능)
