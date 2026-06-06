/* ===================================================================
   능동 디지털 인성교육 — 비밀번호(PIN) 재설정 Cloud Function
   ------------------------------------------------------------------
   학부모가 4자리 비밀번호를 잊었을 때:
     1) 새 4자리 PIN을 무작위로 생성
     2) Firebase Auth 비밀번호를 새 PIN으로 변경 (관리자도 평문은 모름)
     3) 해당 이메일로 새 PIN을 발송
   ⚠️ 이메일 존재 여부를 노출하지 않으려 가입 여부와 무관하게 동일하게 응답합니다.
=================================================================== */
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Gmail 계정과 앱 비밀번호(앱 비밀번호 = 구글 계정 > 보안 > 앱 비밀번호에서 발급)
const GMAIL_USER = defineSecret('GMAIL_USER');
const GMAIL_PASS = defineSecret('GMAIL_PASS');

// 4자리 PIN을 Firebase 최소 길이(6자)에 맞추는 고정 접미사 — index.html의 PIN_PAD와 반드시 동일!
const PIN_PAD = 'ndg!';

// 관리자 이메일 — admin.html의 ADMIN_EMAILS / 보안 규칙과 반드시 동일하게 유지
const ADMIN_EMAILS = ['mysociety053@gmail.com'];
// 사진 버킷 — index.html firebaseConfig.storageBucket과 동일
const STORAGE_BUCKET = 'class-relation2.firebasestorage.app';

exports.resetPin = onCall(
  {secrets: [GMAIL_USER, GMAIL_PASS], region: 'asia-northeast3'},
  async (req) => {
    const email = String((req.data && req.data.email) || '').trim().toLowerCase();
    if (!email) return {ok: true}; // 잘못된 요청도 동일 응답

    // 가입된 사용자 확인 — 없으면 메일만 보내지 않고 동일하게 ok 반환
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch (e) {
      return {ok: true};
    }

    // 새 4자리 PIN 생성 (1000~9999)
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    await admin.auth().updateUser(user.uid, {password: pin + PIN_PAD});

    // 메일 발송
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {user: GMAIL_USER.value(), pass: GMAIL_PASS.value()},
    });
    await transporter.sendMail({
      from: `능동 인성교육 <${GMAIL_USER.value()}>`,
      to: email,
      subject: '[능동 인성교육] 새 비밀번호(PIN) 안내',
      text:
        `요청하신 새 비밀번호(PIN)는 ${pin} 입니다.\n\n` +
        `앱에서 이메일과 이 숫자 4자리로 로그인해주세요.\n` +
        `본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.`,
    });

    return {ok: true};
  }
);

/* ===================================================================
   가정 완전 삭제 — 관리자만 호출 가능
   기록(entries) + 사진(Storage) + 가정 프로필(families) + 로그인 계정(Auth)을 모두 삭제
=================================================================== */
exports.deleteFamily = onCall(
  {region: 'asia-northeast3'},
  async (req) => {
    // 관리자 인증 확인
    const callerEmail = req.auth && req.auth.token && req.auth.token.email;
    if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
      throw new HttpsError('permission-denied', '관리자만 삭제할 수 있습니다.');
    }
    const uid = String((req.data && req.data.uid) || '').trim();
    if (!uid) throw new HttpsError('invalid-argument', 'uid가 필요합니다.');

    const db = admin.firestore();

    // 1) 기록(entries) 삭제 — 모든 회차
    const snap = await db.collection('entries').where('uid', '==', uid).get();
    const batch = db.batch();
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    // 2) 사진(Storage) 삭제 — entries/{uid}/ 하위 전체
    try {
      await admin.storage().bucket(STORAGE_BUCKET).deleteFiles({prefix: `entries/${uid}/`});
    } catch (e) { /* 사진이 없을 수 있음 */ }

    // 3) 가정 프로필 삭제
    try { await db.collection('families').doc(uid).delete(); } catch (e) {}

    // 4) 로그인 계정(Auth) 삭제 — 같은 이메일로 새로 가입 가능해짐
    try { await admin.auth().deleteUser(uid); } catch (e) {}

    return {ok: true};
  }
);
