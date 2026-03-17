import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "";

const isConfigured =
  !!apiKey &&
  !!projectId &&
  !apiKey.includes("your") &&
  !projectId.includes("your-project");

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let initError: string | null = null;

if (isConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0] as FirebaseApp;
    }
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
  } catch (e) {
    initError =
      e instanceof Error && e.message?.includes("invalid-api-key")
        ? "Firebase API 키가 올바르지 않습니다."
        : e instanceof Error
          ? e.message
          : String(e);
  }
}

/** Firebase가 정상 초기화되었는지 여부 */
export const isFirebaseReady = !!auth && !initError;

/** Firebase 미설정/초기화 실패 시 null */
export const getAuthSafe = () => auth;
export const getDbSafe = () => db;
export const getFunctionsSafe = () => functions;
export const getInitError = () => initError;

export { app, auth, db, functions };
