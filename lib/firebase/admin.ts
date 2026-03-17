/**
 * Firebase Admin SDK - 서버 전용 (API Routes, Server Components 등)
 */

import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0] as ReturnType<typeof initializeApp>;
  }
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      const parsed = JSON.parse(key) as ServiceAccount;
      return initializeApp({ credential: cert(parsed) });
    } catch {
      // ignore
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp();
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error(
      "Firebase Admin: NEXT_PUBLIC_FIREBASE_PROJECT_ID 또는 GOOGLE_APPLICATION_CREDENTIALS 또는 FIREBASE_SERVICE_ACCOUNT_KEY를 설정해 주세요."
    );
  }
  return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

let adminAuth: ReturnType<typeof getAuth> | null = null;

export function getAdminAuth() {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}

export async function createAdminCustomToken(uid: string): Promise<string> {
  return getAdminAuth().createCustomToken(uid);
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
