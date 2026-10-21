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
  deleteField,
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
export const SHARED_COLLECTIONS = ["loans", "payments", "agreements", "reminders", "messages", "evidence", "guarantors", "collateral"];
const PRIVATE_EVIDENCE = ["aadhaar", "identity", "id proof"];

export function isBorrowerVisible(name, record) {
  if (name !== "evidence") return true;
  if (record.visibleToBorrower === false) return false;
  const category = String(record.category || "").toLowerCase();
  return !PRIVATE_EVIDENCE.some((word) => category.includes(word));
}

// Lender side: stamp borrowerUid on records of linked borrowers so the linked
// borrower can read them, and remove it from records that are hidden or whose
// borrower is no longer linked. Never changes any other field.
export async function syncBorrowerSharing(lenderUid, borrowers, data) {
  const linked = new Map(borrowers.filter((b) => b.linkedUid).map((b) => [b.id, b.linkedUid]));
  let batch = writeBatch(db);
  let pending = 0;
  let total = 0;
  for (const name of SHARED_COLLECTIONS) {
    for (const record of data[name] || []) {
      const uid = linked.get(record.borrowerId);
      const visible = isBorrowerVisible(name, record);
      let change = null;
      if (record.borrowerUid && (!visible || record.borrowerUid !== uid)) {
        // Hidden, unlinked or re-linked: stop sharing with the old account.
        change = { borrowerUid: uid && visible ? uid : deleteField() };
      } else if (uid && visible && record.borrowerUid !== uid) {
        change = { borrowerUid: uid };
      }
      if (!change) continue;
      batch.update(doc(db, "users", lenderUid, name, record.id), change);
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

// The legacy `balance` field tracks principal only; interest-only payments
// do not reduce it. Amounts shown to people come from the interest engine.
function legacyBalanceAfter(loan, payment) {
  if (payment.paymentType === "interest_only") return Number(loan.balance || 0);
  return Math.max(0, Number(loan.balance || 0) - Number(payment.amount));
}

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
      balance: legacyBalanceAfter(loan, payment),
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
        balance: legacyBalanceAfter(loan, payment),
        updatedAt: serverTimestamp()
      });
    }
  });
}

// ---------- Extension requests (atomic) ----------

function addDaysKey(key, days) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The date a request asks for: its explicit date, or N days after the current
// due date (or today if there is none).
export function requestedDueDate(message, loan) {
  if (message.requestedDate) return message.requestedDate;
  const base = loan?.dueDate || new Date().toISOString().slice(0, 10);
  return addDaysKey(base, Number(message.requestedDays) || 0);
}

// Lender approves or rejects a borrower's request for more time. Approval
// moves only the due date (interest terms are unchanged) and records the
// change in the loan's termsHistory. Fails if the request was already decided.
export async function decideExtensionRequest(lenderUid, messageId, { approve, response = "" }) {
  const msgRef = doc(db, "users", lenderUid, "messages", messageId);
  await runTransaction(db, async (tx) => {
    const msgSnap = await tx.get(msgRef);
    if (!msgSnap.exists()) throw new Error("Request not found.");
    const msg = msgSnap.data();
    if (msg.type !== "extension_request" || msg.status !== "pending") throw new Error("This request was already handled.");
    const loanRef = doc(db, "users", lenderUid, "loans", msg.loanId);
    const loanSnap = await tx.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Loan not found.");
    const loan = loanSnap.data();
    const previousDueDate = loan.dueDate || "";
    const newDueDate = requestedDueDate(msg, loan);
    const now = new Date();

    tx.update(msgRef, {
      status: approve ? "approved" : "rejected",
      response,
      respondedAt: now,
      previousDueDate,
      ...(approve ? { approvedDueDate: newDueDate } : {}),
      updatedAt: serverTimestamp()
    });
    if (approve) {
      tx.update(loanRef, {
        dueDate: newDueDate,
        termsHistory: arrayUnion({
          changedAt: now.toISOString(),
          changedBy: lenderUid,
          previous: { dueDate: previousDueDate },
          next: { dueDate: newDueDate },
          reason: response,
          source: "extension_request",
          requestId: messageId
        }),
        updatedAt: serverTimestamp()
      });
    }
  });
}

// ---------- Acknowledgements ----------

// A linked borrower (or the lender) records that they have seen and accept a
// loan change or an agreement version. This is an in-app acknowledgement, not a
// verified electronic signature.
export async function addAcknowledgement(lenderUid, collectionName, docId, ack) {
  return updateDoc(doc(db, "users", lenderUid, collectionName, docId), {
    acknowledgements: arrayUnion({ ...ack, at: new Date().toISOString() })
  });
}

// ---------- Plans ----------

export async function getSubscription(uid) {
  const snap = await getDoc(doc(db, "users", uid, "subscription", "current"));
  return snap.exists() ? snap.data() : null;
}

// ---------- Family access (read-only) ----------

export async function inviteFamilyMember(lenderUid, phoneNumber, details = {}) {
  const phone = normalizePhone(phoneNumber);
  if (!phone) throw new Error("Phone number is required.");
  await setDoc(doc(db, "familyLinks", phone, "invites", lenderUid), {
    lenderUid,
    lenderName: details.lenderName || "",
    memberName: details.memberName || "",
    permission: "view",
    status: "pending",
    createdAt: serverTimestamp()
  });
  return phone;
}

export async function revokeFamilyInvite(lenderUid, phoneNumber, memberUid) {
  const phone = normalizePhone(phoneNumber);
  const batch = writeBatch(db);
  batch.set(doc(db, "familyLinks", phone, "invites", lenderUid), { lenderUid, status: "revoked" }, { merge: true });
  if (memberUid) batch.delete(doc(db, "users", lenderUid, "familyMembers", memberUid));
  await batch.commit();
}

export async function listMyFamilyInvites(phoneNumber) {
  const phone = normalizePhone(phoneNumber);
  if (!phone) return [];
  try {
    const snap = await getDocs(collection(db, "familyLinks", phone, "invites"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Could not read family invitations", err);
    return [];
  }
}

export async function getFamilyAccess(uid) {
  const snap = await getDoc(doc(db, "familyAccess", uid));
  return snap.exists() ? snap.data().links || [] : [];
}

export async function acceptFamilyInvite(user, invite) {
  const phone = normalizePhone(user.phoneNumber);
  const batch = writeBatch(db);
  batch.set(doc(db, "users", invite.lenderUid, "familyMembers", user.uid), {
    phone,
    permission: "view",
    acceptedAt: serverTimestamp()
  });
  batch.update(doc(db, "familyLinks", phone, "invites", invite.lenderUid), {
    status: "accepted",
    acceptedBy: user.uid,
    acceptedAt: serverTimestamp()
  });
  batch.set(
    doc(db, "familyAccess", user.uid),
    { links: arrayUnion({ lenderUid: invite.lenderUid, lenderName: invite.lenderName || "" }), updatedAt: serverTimestamp() },
    { merge: true }
  );
  await batch.commit();
}

export async function declineFamilyInvite(user, invite) {
  const phone = normalizePhone(user.phoneNumber);
  await updateDoc(doc(db, "familyLinks", phone, "invites", invite.lenderUid), {
    status: "declined",
    acceptedBy: user.uid,
    acceptedAt: serverTimestamp()
  });
}

// Family member: read a lender's records (rules allow read-only access).
export async function loadFamilyView(lenderUid) {
  const names = ["borrowers", "loans", "payments", "agreements", "guarantors", "collateral"];
  // If access was removed, Firestore refuses the reads: report that clearly
  // instead of showing empty lists.
  const results = await Promise.all(
    names.map((name) =>
      listUserCollection(lenderUid, name).catch((err) => {
        if (err?.code === "permission-denied") throw Object.assign(new Error("access_removed"), { code: "access_removed" });
        return [];
      })
    )
  );
  return Object.fromEntries(names.map((name, i) => [name, results[i]]));
}
