// Firestore + Storage security rules tests.
// Run with: npm run test:rules   (starts the Firebase emulators; needs Java 21+)
import { after, before, beforeEach, describe, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  arrayUnion
} from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";

const LENDER = "lender1";
const OTHER_LENDER = "lender2";
const BORROWER = "borrowerUid1";
const STRANGER = "strangerUid";
const PHONE = "+919876543210";
const OTHER_PHONE = "+919000000000";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-runa-mitra",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") }
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", LENDER), { profile: { name: "Ramaiah" } });
    await setDoc(doc(db, "users", LENDER, "borrowers", "b1"), { name: "Lakshmi", mobile: "9876543210", notes: "private note" });
    await setDoc(doc(db, "users", LENDER, "borrowers", "b2"), { name: "Other", mobile: "9000000000" });
    await setDoc(doc(db, "users", LENDER, "loans", "loan1"), { borrowerId: "b1", principal: 20000, balance: 20000 });
    await setDoc(doc(db, "users", LENDER, "loans", "loan2"), { borrowerId: "b2", principal: 5000, balance: 5000 });
    await setDoc(doc(db, "borrowerLinks", PHONE, "invites", `${LENDER}_b1`), { lenderUid: LENDER, borrowerId: "b1", status: "pending" });
  });
});

const lenderDb = () => env.authenticatedContext(LENDER).firestore();
const borrowerDb = (phone = PHONE) => env.authenticatedContext(BORROWER, { phone_number: phone }).firestore();

async function link() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await updateDoc(doc(db, "users", LENDER, "borrowers", "b1"), { linkedUid: BORROWER });
    await updateDoc(doc(db, "users", LENDER, "loans", "loan1"), { borrowerUid: BORROWER });
  });
}

function acceptBatch(db, lenderUid = LENDER, borrowerId = "b1", phone = PHONE) {
  const batch = writeBatch(db);
  batch.update(doc(db, "users", lenderUid, "borrowers", borrowerId), { linkedUid: BORROWER, linkedAt: serverTimestamp() });
  batch.update(doc(db, "borrowerLinks", phone, "invites", `${lenderUid}_${borrowerId}`), {
    status: "accepted", acceptedBy: BORROWER, acceptedAt: serverTimestamp()
  });
  batch.set(doc(db, "borrowerAccess", BORROWER), { links: arrayUnion({ lenderUid, borrowerId }) }, { merge: true });
  return batch.commit();
}

describe("lender access", () => {
  test("lender reads and writes own records", async () => {
    await assertSucceeds(getDoc(doc(lenderDb(), "users", LENDER, "loans", "loan1")));
    await assertSucceeds(setDoc(doc(lenderDb(), "users", LENDER, "payments", "p1"), { loanId: "loan1", amount: 100 }));
  });

  test("another lender cannot read or write them", async () => {
    const db = env.authenticatedContext(OTHER_LENDER).firestore();
    await assertFails(getDoc(doc(db, "users", LENDER, "loans", "loan1")));
    await assertFails(getDocs(collection(db, "users", LENDER, "borrowers")));
    await assertFails(setDoc(doc(db, "users", LENDER, "loans", "x"), { borrowerId: "b1" }));
  });

  test("unauthenticated users get nothing", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users", LENDER, "loans", "loan1")));
    await assertFails(getDoc(doc(db, "borrowerLinks", PHONE, "invites", `${LENDER}_b1`)));
  });
});

describe("invitations", () => {
  test("borrower with the invited phone can accept", async () => {
    await assertSucceeds(acceptBatch(borrowerDb()));
  });

  test("someone with a different phone cannot accept", async () => {
    await assertFails(acceptBatch(borrowerDb(OTHER_PHONE)));
  });

  test("cannot accept twice or take over an already linked record", async () => {
    await assertSucceeds(acceptBatch(borrowerDb()));
    const db = env.authenticatedContext(STRANGER, { phone_number: PHONE }).firestore();
    await assertFails(updateDoc(doc(db, "users", LENDER, "borrowers", "b1"), { linkedUid: STRANGER }));
  });

  test("borrower cannot change any other field while accepting", async () => {
    await assertFails(updateDoc(doc(borrowerDb(), "users", LENDER, "borrowers", "b1"), { linkedUid: BORROWER, notes: "x" }));
  });

  test("invite for another borrower record cannot be used", async () => {
    await assertFails(updateDoc(doc(borrowerDb(), "users", LENDER, "borrowers", "b2"), { linkedUid: BORROWER }));
  });

  test("legacy invite works only when the lender's record has that phone", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "borrowerLinks", PHONE), { lenders: [{ lenderUid: LENDER, borrowerId: "b2" }, { lenderUid: LENDER, borrowerId: "b1" }] });
      await setDoc(doc(ctx.firestore(), "borrowerLinks", PHONE, "invites", `${LENDER}_b1`), { lenderUid: LENDER, borrowerId: "b1", status: "declined" });
    });
    // b1 has mobile 9876543210 == PHONE -> allowed via legacy array
    await assertSucceeds(updateDoc(doc(borrowerDb(), "users", LENDER, "borrowers", "b1"), { linkedUid: BORROWER }));
    // b2 has a different mobile -> denied even though it is in the legacy array
    await assertFails(updateDoc(doc(borrowerDb(), "users", LENDER, "borrowers", "b2"), { linkedUid: BORROWER }));
  });

  test("lender can invite only for their own borrower record", async () => {
    await assertSucceeds(setDoc(doc(lenderDb(), "borrowerLinks", OTHER_PHONE, "invites", `${LENDER}_b2`), { lenderUid: LENDER, borrowerId: "b2", status: "pending" }));
    const other = env.authenticatedContext(OTHER_LENDER).firestore();
    await assertFails(setDoc(doc(other, "borrowerLinks", OTHER_PHONE, "invites", `${OTHER_LENDER}_b2`), { lenderUid: OTHER_LENDER, borrowerId: "b2", status: "pending" }));
    await assertFails(setDoc(doc(other, "borrowerLinks", OTHER_PHONE, "invites", `${LENDER}_b2`), { lenderUid: LENDER, borrowerId: "b2", status: "pending" }));
  });

  test("only the phone owner can list invites for that phone", async () => {
    await assertSucceeds(getDocs(collection(borrowerDb(), "borrowerLinks", PHONE, "invites")));
    await assertFails(getDocs(collection(borrowerDb(OTHER_PHONE), "borrowerLinks", PHONE, "invites")));
  });

  test("borrowerAccess is private to its owner", async () => {
    await assertSucceeds(setDoc(doc(borrowerDb(), "borrowerAccess", BORROWER), { links: [] }));
    const db = env.authenticatedContext(STRANGER).firestore();
    await assertFails(getDoc(doc(db, "borrowerAccess", BORROWER)));
  });
});

describe("borrower access", () => {
  test("not linked: borrower sees nothing", async () => {
    await assertFails(getDoc(doc(borrowerDb(), "users", LENDER, "loans", "loan1")));
  });

  test("linked: reads own stamped loan and queries by borrowerUid", async () => {
    await link();
    await assertSucceeds(getDoc(doc(borrowerDb(), "users", LENDER, "loans", "loan1")));
    await assertSucceeds(getDocs(query(collection(borrowerDb(), "users", LENDER, "loans"), where("borrowerUid", "==", BORROWER))));
  });

  test("linked: cannot read other borrowers' loans or the borrower list", async () => {
    await link();
    await assertFails(getDoc(doc(borrowerDb(), "users", LENDER, "loans", "loan2")));
    await assertFails(getDocs(collection(borrowerDb(), "users", LENDER, "loans")));
    await assertFails(getDoc(doc(borrowerDb(), "users", LENDER, "borrowers", "b1")));
    await assertFails(getDoc(doc(borrowerDb(), "users", LENDER)));
  });

  test("linked: cannot change lender-only fields", async () => {
    await link();
    await assertFails(updateDoc(doc(borrowerDb(), "users", LENDER, "loans", "loan1"), { balance: 0 }));
    await assertFails(updateDoc(doc(borrowerDb(), "users", LENDER, "loans", "loan1"), { borrowerUid: STRANGER }));
  });

  test("linked: can submit a pending payment for own loan only", async () => {
    await link();
    const pay = (data) => setDoc(doc(collection(borrowerDb(), "users", LENDER, "payments")), {
      borrowerId: "b1", borrowerUid: BORROWER, loanId: "loan1", amount: 500,
      status: "pending_verification", type: "borrower_submitted", ...data
    });
    await assertSucceeds(pay({}));
    await assertFails(pay({ status: "verified" }));
    await assertFails(pay({ loanId: "loan2" }));
    await assertFails(pay({ borrowerId: "b2" }));
    await assertFails(pay({ amount: -5 }));
  });

  test("linked: can send extension request; stranger cannot", async () => {
    await link();
    const msg = { borrowerId: "b1", borrowerUid: BORROWER, loanId: "loan1", status: "pending", type: "extension_request" };
    await assertSucceeds(setDoc(doc(collection(borrowerDb(), "users", LENDER, "messages")), msg));
    const stranger = env.authenticatedContext(STRANGER).firestore();
    await assertFails(setDoc(doc(collection(stranger, "users", LENDER, "messages")), { ...msg, borrowerUid: STRANGER }));
  });
});

describe("plans, family access, acknowledgements", () => {
  const FAMILY = "familyUid";
  const FAMILY_PHONE = "+919888888888";
  const familyDb = (phone = FAMILY_PHONE) => env.authenticatedContext(FAMILY, { phone_number: phone }).firestore();

  test("a lender cannot write their own subscription or plan payments", async () => {
    await assertFails(setDoc(doc(lenderDb(), "users", LENDER, "subscription", "current"), { planId: "advanced", status: "active" }));
    await assertFails(setDoc(doc(lenderDb(), "users", LENDER, "planPayments", "order_1"), { status: "paid" }));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", LENDER, "subscription", "current"), { planId: "regular", status: "active" });
    });
    await assertSucceeds(getDoc(doc(lenderDb(), "users", LENDER, "subscription", "current")));
    await assertFails(getDoc(doc(env.authenticatedContext(OTHER_LENDER).firestore(), "users", LENDER, "subscription", "current")));
  });

  test("family access needs an invitation to that phone, then is read-only", async () => {
    const member = (db) => setDoc(doc(db, "users", LENDER, "familyMembers", FAMILY), { phone: FAMILY_PHONE, permission: "view" });
    await assertFails(member(familyDb())); // not invited yet
    await assertSucceeds(setDoc(doc(lenderDb(), "familyLinks", FAMILY_PHONE, "invites", LENDER), { lenderUid: LENDER, status: "pending" }));
    await assertFails(member(familyDb(OTHER_PHONE))); // wrong phone
    await assertSucceeds(member(familyDb()));
    await assertSucceeds(getDoc(doc(familyDb(), "users", LENDER, "loans", "loan1")));
    await assertSucceeds(getDocs(collection(familyDb(), "users", LENDER, "borrowers")));
    await assertFails(getDocs(collection(familyDb(), "users", LENDER, "messages")));
    await assertFails(getDocs(collection(familyDb(), "users", LENDER, "evidence")));
    await assertFails(updateDoc(doc(familyDb(), "users", LENDER, "loans", "loan1"), { balance: 0 }));
    await assertFails(setDoc(doc(familyDb(), "users", LENDER, "payments", "x"), { amount: 1 }));
    await assertFails(getDoc(doc(familyDb(), "users", OTHER_LENDER)));
  });

  test("a family member cannot grant themselves more than view access", async () => {
    await setDoc(doc(lenderDb(), "familyLinks", FAMILY_PHONE, "invites", LENDER), { lenderUid: LENDER, status: "pending" });
    await assertFails(setDoc(doc(familyDb(), "users", LENDER, "familyMembers", FAMILY), { phone: FAMILY_PHONE, role: "owner" }));
  });

  test("borrower adds only their own acknowledgement and nothing else", async () => {
    await link();
    const loanRef = doc(borrowerDb(), "users", LENDER, "loans", "loan1");
    await assertSucceeds(updateDoc(loanRef, { acknowledgements: [{ uid: BORROWER, kind: "change", changeId: "c1" }] }));
    await assertFails(updateDoc(loanRef, { acknowledgements: [{ uid: STRANGER, kind: "change", changeId: "c2" }] }));
    await assertFails(updateDoc(loanRef, { acknowledgements: [] }));
    await assertFails(updateDoc(loanRef, {
      acknowledgements: [{ uid: BORROWER, kind: "change", changeId: "c1" }, { uid: BORROWER, kind: "change", changeId: "c3" }],
      balance: 0
    }));
    const other = doc(borrowerDb(), "users", LENDER, "loans", "loan2");
    await assertFails(updateDoc(other, { acknowledgements: [{ uid: BORROWER, kind: "change" }] }));
  });

  test("guarantor and collateral records are shared only with the stamped borrower", async () => {
    await link();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", LENDER, "guarantors", "g1"), { borrowerId: "b1", borrowerUid: BORROWER, name: "Ravi" });
      await setDoc(doc(ctx.firestore(), "users", LENDER, "collateral", "c1"), { borrowerId: "b2", name: "Gold chain" });
    });
    await assertSucceeds(getDoc(doc(borrowerDb(), "users", LENDER, "guarantors", "g1")));
    await assertFails(getDoc(doc(borrowerDb(), "users", LENDER, "collateral", "c1")));
    await assertFails(updateDoc(doc(borrowerDb(), "users", LENDER, "guarantors", "g1"), { name: "x" }));
  });
});

describe("storage", () => {
  const file = new Uint8Array([1, 2, 3]);
  const image = { contentType: "image/png" };

  test("lender uploads and reads own evidence; others cannot read", async () => {
    const lender = env.authenticatedContext(LENDER).storage();
    await assertSucceeds(uploadBytes(ref(lender, `users/${LENDER}/evidence/note.png`), file, image));
    const other = env.authenticatedContext(OTHER_LENDER).storage();
    await assertFails(getBytes(ref(other, `users/${LENDER}/evidence/note.png`)));
  });

  test("disallowed file types are rejected", async () => {
    const lender = env.authenticatedContext(LENDER).storage();
    await assertFails(uploadBytes(ref(lender, `users/${LENDER}/evidence/x.html`), file, { contentType: "text/html" }));
  });

  test("linked borrower can upload a payment screenshot; unlinked cannot", async () => {
    const path = `users/${LENDER}/evidence/payments/b1/shot.png`;
    const borrower = env.authenticatedContext(BORROWER, { phone_number: PHONE }).storage();
    await assertFails(uploadBytes(ref(borrower, path), file, image));
    await link();
    await assertSucceeds(uploadBytes(ref(borrower, path), file, image));
    await assertFails(uploadBytes(ref(borrower, `users/${LENDER}/evidence/payments/b2/shot.png`), file, image));
    await assertFails(getBytes(ref(borrower, `users/${LENDER}/evidence/note.png`)));
  });
});
