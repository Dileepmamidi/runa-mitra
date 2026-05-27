import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "runa-mitra.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "runa-mitra-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "runa-mitra.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:runa-mitra"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

enableIndexedDbPersistence(db).catch(() => {
  // Persistence can fail in private mode or multi-tab sessions; app still works online.
});

export function createOtpVerifier(containerId = "recaptcha-container") {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible"
  });
}

export function requestOtp(phoneNumber, verifier) {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}
