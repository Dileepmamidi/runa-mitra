import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../config/firebase";

const userPath = (uid, name) => collection(db, "users", uid, name);

export async function saveUserProfile(uid, profile) {
  return setDoc(
    doc(db, "users", uid),
    { profile, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function listUserCollection(uid, name, constraints = []) {
  const snapshot = await getDocs(query(userPath(uid, name), ...constraints));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function addUserRecord(uid, name, payload) {
  return addDoc(userPath(uid, name), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateUserRecord(uid, name, id, payload) {
  return updateDoc(doc(db, "users", uid, name, id), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function getLoanPayments(uid, loanId) {
  return listUserCollection(uid, "payments", [
    where("loanId", "==", loanId),
    orderBy("paymentDate", "desc")
  ]);
}

export async function uploadEvidence(uid, file, pathParts = []) {
  const safeName = `${Date.now()}-${file.name}`;
  const fileRef = ref(storage, ["users", uid, "evidence", ...pathParts, safeName].join("/"));
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function checkBorrowerLink(phoneNumber) {
  if (!phoneNumber) return null;
  // Convert standard local numbers to +91 if needed, assuming the auth token has +91
  // We'll search by the exact phone number that the user logged in with.
  const snap = await getDoc(doc(db, "borrowerLinks", phoneNumber));
  return snap.exists() ? snap.data() : null;
}

export async function createBorrowerLink(phoneNumber, lenderUid, borrowerId) {
  if (!phoneNumber) return;
  // Always ensure E.164 format for the ID if it's an Indian number
  const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
  return setDoc(
    doc(db, "borrowerLinks", formattedPhone),
    { lenderUid, borrowerId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
