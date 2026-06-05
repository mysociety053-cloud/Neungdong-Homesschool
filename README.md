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
- **완주**: 5일 이상 완료 시 자동 인정(소정의 상품)
- **기록**: 그날만 기록·당일까지 수정 가능, 날짜가 지나면 확정
- **개인정보**: 자녀 실명·얼굴 미수집(학년·반·번호까지만, 얼굴 없는 사진)
- **재사용**: 시즌(예: 2026-1, 2026-2, 2027-1)별로 미션을 따로 저장 → 매년 재사용

---

## 배포 순서

### 1. Firebase 준비
1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성 (이미 Blaze 요금제 사용 중)
2. **Firestore Database** 생성
3. **Storage** 생성 (사진 저장용)
4. **Authentication → Sign-in method → 이메일/비밀번호 → "이메일 링크(비밀번호 없는 로그인)" 사용 설정**
5. **결제 알림(예산)**을 낮은 금액으로 설정해두기 (안전장치)

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
   (이메일 링크 로그인이 작동하려면 반드시 필요)

### 5. 보안 규칙 배포
```bash
npm install -g firebase-tools
firebase login
firebase use <프로젝트ID>
firebase deploy --only firestore:rules,storage
```
또는 Firebase 콘솔의 Firestore/Storage 규칙 탭에 `firestore.rules` · `storage.rules` 내용을 붙여넣어도 됩니다.

### 6. 운영 시작
1. 관리자 화면 접속 → **시즌 시작일** 설정(월요일 권장) → **미션 편집**에서 이번 시즌 미션 확정
2. 가정통신문 + QR코드로 가정용 주소 배포 (학부모 **개인정보 수집 동의** 함께 받기)
3. 가정은 이메일로 로그인 → 매일 미션 기록

---

## 데이터 구조 (Firestore)
- `families/{uid}` — `{ email, grade, classNo, studentNo, createdAt }`
- `entries/{uid}_{season}_day{n}` — `{ uid, email, grade, classNo, studentNo, season, day, parentLine, childLine, weeklyLine, promiseLine, photoURL, completed, createdAt }`
- `config/{season}` — `{ startDate, missions: [ {day, tag, title, stop, fill} × 6 ] }`
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
