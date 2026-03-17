/**
 * Firestore 시드 데이터 삽입 스크립트
 * 실행: npx tsx scripts/seed-firestore.ts
 *
 * Firebase Admin SDK 사용. 아래 환경변수 필요:
 * - GOOGLE_APPLICATION_CREDENTIALS: 서비스 계정 키 JSON 경로
 * 또는
 * - GCLOUD_PROJECT: 프로젝트 ID (로컬 에뮬레이터용)
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const TEMPLATES = [
  {
    key: "due30",
    body: `[Web발신]
{CAR}는 자동차 검사일이 {DUE} 입니다.

잊지 마시고 검사 받으세요.

예약: {LINK}
*카스코자동차검사소*

수신거부 062-267-9494`,
  },
  {
    key: "due14",
    body: `[Web발신]
{CAR}는 자동차 검사일이 {DUE} 입니다.

잊지 마시고 검사 받으세요.

예약: {LINK}
*카스코자동차검사소*

수신거부 062-267-9494`,
  },
  {
    key: "due7",
    body: `[Web발신]
{CAR} 자동차 검사일이 {DUE} 입니다.

이번 주 내 검사 권장드립니다.
예약: {LINK}

*카스코자동차검사소*
수신거부 062-267-9494`,
  },
  {
    key: "reservationConfirmed",
    body: `[Web발신]
예약이 확정되었습니다.

차량 {CAR}
일시 {DATE} {TIME}

문의 062-267-9494
*카스코자동차검사소*

수신거부 062-267-9494`,
  },
];

async function seed() {
  if (getApps().length === 0) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
    } else if (process.env.GCLOUD_PROJECT) {
      initializeApp({ projectId: process.env.GCLOUD_PROJECT });
    } else {
      console.error(
        "GOOGLE_APPLICATION_CREDENTIALS 또는 GCLOUD_PROJECT 환경변수를 설정하세요."
      );
      process.exit(1);
    }
  }

  const db = getFirestore();

  for (const t of TEMPLATES) {
    const existing = await db
      .collection("sms_templates")
      .where("key", "==", t.key)
      .limit(1)
      .get();

    if (existing.empty) {
      await db.collection("sms_templates").add({
        key: t.key,
        body: t.body,
        updatedAt: Timestamp.now(),
      });
      console.log(`Added template: ${t.key}`);
    } else {
      await existing.docs[0].ref.update({
        body: t.body,
        updatedAt: Timestamp.now(),
      });
      console.log(`Updated template: ${t.key}`);
    }
  }

  console.log("Seed completed.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
