import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  arrayUnion,
  runTransaction,
  writeBatch
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

export async function deleteUserRecord(uid, name, id) {
  return deleteDoc(doc(db, "users", uid, name, id));
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

// ---------- Borrower invitations and linking ----------
//
// A lender invites a borrower by phone number. The borrower signs in with that
// phone (OTP) and must explicitly accept. Only then does the lender's borrower
// record get `linkedUid`, and the lender's app shares records by stamping
// `borrowerUid` on them. Firestore rules enforce every step (firestore.rules).
//
// Older invitations were stored as an array on borrowerLinks/{phone}. They are
// still honoured, but they too must be accepted by the borrower.

export function normalizePhone(phoneNumber) {
  if (!phoneNumber) return "";
  const digits = String(phoneNumber).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return digits;
}

export async function createBorrowerLink(phoneNumber, lenderUid, borrowerId, details = {}) {
  const phone = normalizePhone(phoneNumber);
  if (!phone) return;
  return setDoc(
    doc(db, "borrowerLinks", phone, "invites", `${lenderUid}_${borrowerId}`),
    {
      lenderUid,
      borrowerId,
      lenderName: details.lenderName || "",
      borrowerName: details.borrowerName || "",
      status: "pending",
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

// Invitations addressed to the signed-in phone number (new + legacy format).
export async function listMyInvites(phoneNumber) {
  const phone = normalizePhone(phoneNumber);
  if (!phone) return [];
  const invites = [];
  try {
    const snap = await getDocs(collection(db, "borrowerLinks", phone, "invites"));
    snap.forEach((d) => invites.push({ id: d.id, source: "invite", ...d.data() }));
  } catch (err) {
    console.warn("Could not read invitations", err);
  }
  try {
    const legacy = await getDoc(doc(db, "borrowerLinks", phone));
    const list = legacy.exists() ? legacy.data().lenders || [] : [];
    for (const item of list) {
      const id = `${item.lenderUid}_${item.borrowerId}`;
      if (!invites.some((i) => i.id === id)) {
        invites.push({ id, source: "legacy", status: "pending", ...item });
      }
    }
  } catch (err) {
    console.warn("Could not read legacy invitations", err);
  }
  return invites;
}

export async function getBorrowerAccess(uid) {
  const snap = await getDoc(doc(db, "borrowerAccess", uid));
  return snap.exists() ? snap.data().links || [] : [];
}

export async function acceptInvite(user, invite) {
  const phone = normalizePhone(user.phoneNumber);
  const batch = writeBatch(db);
  batch.update(doc(db, "users", invite.lenderUid, "borrowers", invite.borrowerId), {
    linkedUid: user.uid,
    linkedAt: serverTimestamp()
  });
  if (invite.source === "invite") {
    batch.update(doc(db, "borrowerLinks", phone, "invites", invite.id), {
      status: "accepted",
      acceptedBy: user.uid,
      acceptedAt: serverTimestamp()
    });
  }
  batch.set(
    doc(db, "borrowerAccess", user.uid),
    {
      links: arrayUnion({
        lenderUid: invite.lenderUid,
        borrowerId: invite.borrowerId,
        lenderName: invite.lenderName || "",
        borrowerName: invite.borrowerName || ""
      }),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  await batch.commit();
}

export async function declineInvite(user, invite) {
  if (invite.source !== "invite") return;
  const phone = normalizePhone(user.phoneNumber);
  await updateDoc(doc(db, "borrowerLinks", phone, "invites", invite.id), {
    status: "declined",
    acceptedBy: user.uid
  });
}

// Records the borrower may see. Evidence is shared unless it is an identity
// document or the lender marked it private.
const SHARED_COLLECTIONS = ["loans", "payments", "agreements", "reminders", "messages", "evidence"];
const PRIVATE_EVIDENCE = ["aadhaar", "identity", "id proof"];

export function isBorrowerVisible(name, record) {
  if (name !== "evidence") return true;
  if (record.visibleToBorrower === false) return false;
  const category = String(record.category || "").toLowerCase();
  return !PRIVATE_EVIDENCE.some((word) => category.includes(word));
}

// Lender side: stamp borrowerUid on records of linked borrowers so the linked
// borrower can read them. Never removes or changes any other field.
export async function syncBorrowerSharing(lenderUid, borrowers, data) {
  const linked = new Map(borrowers.filter((b) => b.linkedUid).map((b) => [b.id, b.linkedUid]));
  if (linked.size === 0) return 0;
  let batch = writeBatch(db);
  let pending = 0;
  let total = 0;
  for (const name of SHARED_COLLECTIONS) {
    for (const record of data[name] || []) {
      const uid = linked.get(record.borrowerId);
      if (!uid || record.borrowerUid === uid || !isBorrowerVisible(name, record)) continue;
      batch.update(doc(db, "users", lenderUid, name, record.id), { borrowerUid: uid });
      pending += 1;
      total += 1;
      if (pending === 400) {
        await batch.commit();
        batch = writeBatch(db);
        pending = 0;
      }
    }
  }
  if (pending) await batch.commit();
  return total;
}

// Borrower side: records shared with this borrower by one lender.
export async function listSharedRecords(lenderUid, borrowerUid, name) {
  const snapshot = await getDocs(query(userPath(lenderUid, name), where("borrowerUid", "==", borrowerUid)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

// ---------- Payments (atomic) ----------

// Lender records a payment and updates the legacy `balance` field in one
// transaction, so two devices cannot double-count.
export async function recordLenderPayment(lenderUid, loanId, payment) {
  const loanRef = doc(db, "users", lenderUid, "loans", loanId);
  const paymentRef = doc(userPath(lenderUid, "payments"));
  await runTransaction(db, async (tx) => {
    const loanSnap = await tx.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Loan not found.");
    const loan = loanSnap.data();
    tx.set(paymentRef, {
      ...payment,
      loanId,
      ...(loan.borrowerUid ? { borrowerUid: loan.borrowerUid } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    tx.update(loanRef, {
      balance: Math.max(0, Number(loan.balance || 0) - Number(payment.amount)),
      updatedAt: serverTimestamp()
    });
  });
  return paymentRef.id;
}

// Lender approves a borrower-submitted payment. Fails if it was already
// handled, which prevents double approval.
export async function approveBorrowerPayment(lenderUid, paymentId) {
  const paymentRef = doc(db, "users", lenderUid, "payments", paymentId);
  await runTransaction(db, async (tx) => {
    const paySnap = await tx.get(paymentRef);
    if (!paySnap.exists()) throw new Error("Payment not found.");
    const payment = paySnap.data();
    if (payment.status !== "pending_verification") throw new Error("This payment was already handled.");
    const loanRef = doc(db, "users", lenderUid, "loans", payment.loanId);
    const loanSnap = await tx.get(loanRef);
    tx.update(paymentRef, { status: "verified", verifiedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    if (loanSnap.exists()) {
      const loan = loanSnap.data();
      tx.update(loanRef, {
        balance: Math.max(0, Number(loan.balance || 0) - Number(payment.amount)),
        updatedAt: serverTimestamp()
      });
    }
  });
}
