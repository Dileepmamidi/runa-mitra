// Seeds the LOCAL Firebase emulators with demo data (never a real project).
// Usage: npm run emulators   (in one terminal)
//        npm run seed:emulator
// Then: npm run dev:emulator and sign in with one of the demo phones below.
// The SMS code is shown in the emulator log / at
// http://127.0.0.1:9099/emulator/v1/projects/demo-runa-mitra/verificationCodes
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, Timestamp } from "firebase/firestore";

const PROJECT = "demo-runa-mitra";
const AUTH = "http://127.0.0.1:9099";

export const DEMO = {
  lender: { uid: "demo-lender", phone: "+919999900001" },
  borrower: { uid: "demo-borrower", phone: "+919999900002" },
  invited: { phone: "+919999900003" }
};

async function createAuthUser(uid, phoneNumber) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ localId: uid, phoneNumber })
  });
  if (!res.ok && !(await res.text()).includes("DUPLICATE")) throw new Error(`Auth user ${uid} failed`);
}

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const monthsAgo = (n, dayOfMonth = 5) => {
  const d = new Date();
  d.setDate(dayOfMonth);
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};
const terms = (principal, rate, start, method = "simple", compounding) => ({
  principalPaise: principal * 100,
  ratePercent: rate,
  rateUnit: "month",
  method,
  ...(compounding ? { compounding } : {}),
  startDate: start,
  allocation: "interest_first",
  pauses: [],
  engineVersion: 1
});

const L = DEMO.lender.uid;
const B = DEMO.borrower.uid;
const now = Timestamp.now();

const data = {
  [`users/${L}`]: { profile: { name: "Ramaiah", village: "Kondapur", businessType: "Money Lender", preferredLanguage: "te", appMode: "Regular" } },
  [`users/${L}/borrowers/b1`]: { name: "Lakshmi Devi", mobile: "9999900002", village: "Kondapur", occupation: "Tailor", status: "active", linkedUid: B, notes: "Private lender note — must never reach the borrower", createdAt: now },
  [`users/${L}/borrowers/b2`]: { name: "Suresh Reddy", mobile: "9999900004", village: "Peddapalli", occupation: "Farmer", status: "active", createdAt: now },
  [`users/${L}/borrowers/b3`]: { name: "Anitha", mobile: "9999900003", village: "Kondapur", occupation: "Teacher", status: "active", createdAt: now },
  [`users/${L}/loans/loan1`]: { borrowerId: "b1", borrowerUid: B, principal: 20000, interestRate: 2, interestType: "Simple", cycle: "monthly", loanDate: monthsAgo(5), dueDate: day(-3), securityType: "Trust only", status: "active", balance: 15000, terms: terms(20000, 2, monthsAgo(5)), createdAt: now },
  [`users/${L}/loans/loan2`]: { borrowerId: "b2", principal: 50000, interestRate: 1.5, interestType: "Simple", cycle: "monthly", loanDate: monthsAgo(8, 12), dueDate: day(0), securityType: "Guarantor", status: "active", balance: 50000, terms: terms(50000, 1.5, monthsAgo(8, 12)), createdAt: now },
  [`users/${L}/loans/loan3`]: { borrowerId: "b3", principal: 10000, interestRate: 2, interestType: "Compound", cycle: "monthly", loanDate: monthsAgo(3, 20), dueDate: day(20), securityType: "Trust only", status: "active", balance: 10000, terms: terms(10000, 2, monthsAgo(3, 20), "compound", "monthly"), createdAt: now },
  // Legacy-shaped loan (no `terms`), as created by older app versions.
  [`users/${L}/loans/loan4`]: { borrowerId: "b1", borrowerUid: B, principal: 5000, interestRate: 3, interestType: "Simple", cycle: "monthly", loanDate: monthsAgo(2, 1), dueDate: day(40), securityType: "Trust only", status: "active", balance: 5000, createdAt: now },
  [`users/${L}/payments/p1`]: { borrowerId: "b1", borrowerUid: B, loanId: "loan1", amount: 5000, method: "Cash", paymentDate: monthsAgo(3), status: "verified", type: "lender_recorded", createdAt: now },
  [`users/${L}/payments/p2`]: { borrowerId: "b1", borrowerUid: B, loanId: "loan1", amount: 1600, method: "UPI", paymentDate: monthsAgo(1), status: "verified", type: "lender_recorded", paymentType: "interest_only", createdAt: now },
  [`users/${L}/payments/p3`]: { borrowerId: "b2", loanId: "loan2", amount: 3000, method: "Cash", paymentDate: monthsAgo(2, 15), status: "verified", type: "lender_recorded", createdAt: now },
  [`users/${L}/payments/p4`]: { borrowerId: "b1", borrowerUid: B, loanId: "loan1", amount: 2000, method: "UPI", referenceId: "UPI123456", paymentDate: day(-1), status: "pending_verification", type: "borrower_submitted", createdAt: now },
  [`users/${L}/messages/m1`]: { borrowerId: "b1", borrowerUid: B, loanId: "loan1", type: "extension_request", reason: "Waiting for my salary", requestedDays: 7, status: "pending", requestedAt: now, createdAt: now },
  [`users/${L}/evidence/e1`]: { borrowerId: "b1", borrowerUid: B, loanId: "loan1", category: "Handwritten note", fileUrl: "", notes: "Front side of the original note", createdAt: now },
  [`borrowerAccess/${B}`]: { links: [{ lenderUid: L, borrowerId: "b1", lenderName: "Ramaiah", borrowerName: "Lakshmi Devi" }] },
  [`borrowerLinks/${DEMO.invited.phone}/invites/${L}_b3`]: { lenderUid: L, borrowerId: "b3", lenderName: "Ramaiah", borrowerName: "Anitha", status: "pending", createdAt: now }
};

async function main() {
  await createAuthUser(DEMO.lender.uid, DEMO.lender.phone);
  await createAuthUser(DEMO.borrower.uid, DEMO.borrower.phone);
  const env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { host: "127.0.0.1", port: 8080 } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [path, value] of Object.entries(data)) await setDoc(doc(db, path), value);
  });
  console.log(`Seeded ${Object.keys(data).length} documents.`);
  console.log(`Lender phone:   ${DEMO.lender.phone}`);
  console.log(`Borrower phone: ${DEMO.borrower.phone}`);
  console.log(`Invited phone:  ${DEMO.invited.phone} (new user with a pending invitation)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
