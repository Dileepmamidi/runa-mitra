// Firebase Admin for the payment server. In production set
// FIREBASE_SERVICE_ACCOUNT to the service-account JSON (Vercel env var).
// Locally, the Firebase emulators are used when FIRESTORE_EMULATOR_HOST is set.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function app() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const account = JSON.parse(raw);
    return initializeApp({ credential: cert(account), projectId: account.project_id });
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || "demo-runa-mitra" });
  }
  throw Object.assign(new Error("Server is missing FIREBASE_SERVICE_ACCOUNT."), { status: 503 });
}

export const adminDb = () => getFirestore(app());
export const adminAuth = () => getAuth(app());
