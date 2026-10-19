import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addMonths,
  calculateLoan,
  monthsAndDays,
  rupeesToPaise,
  termsFromLoan
} from "./interestEngine.js";

const loan = (terms) => ({ id: "L1", terms: { pauses: [], ...terms } });
const base = {
  principalPaise: 2000000, // ₹20,000
  ratePercent: 2,
  rateUnit: "month",
  method: "simple",
  startDate: "2026-01-05"
};

test("calendar month helpers", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  assert.deepEqual(monthsAndDays("2026-01-05", "2026-03-05"), { months: 2, days: 0 });
  assert.deepEqual(monthsAndDays("2026-01-05", "2026-03-20"), { months: 2, days: 15 });
  assert.deepEqual(monthsAndDays("2026-01-31", "2026-02-28"), { months: 1, days: 0 });
});

test("simple monthly interest: ₹20,000 at 2%/month for 3 months = ₹1,200", () => {
  const r = calculateLoan(loan(base), [], "2026-04-05");
  assert.equal(r.status, "ok");
  assert.equal(r.interestAccruedPaise, 120000);
  assert.equal(r.outstandingPaise, 2120000);
});

test("partial month uses days / 30", () => {
  // 1 month + 15 days = 1.5 months -> 20000 * 2% * 1.5 = 600
  const r = calculateLoan(loan(base), [], "2026-02-20");
  assert.equal(r.interestAccruedPaise, 60000);
});

test("no minimum interest period is invented: same-day is ₹0 interest", () => {
  const r = calculateLoan(loan(base), [], "2026-01-05");
  assert.equal(r.interestAccruedPaise, 0);
  assert.equal(r.outstandingPaise, 2000000);
});

test("annual rate uses actual days / 365", () => {
  // ₹1,00,000 at 24%/year for 73 days = 100000 * 0.24 * 73/365 = 4800
  const r = calculateLoan(loan({ ...base, principalPaise: 10000000, ratePercent: 24, rateUnit: "year" }), [], "2026-03-19");
  assert.equal(r.interestAccruedPaise, 480000);
});

test("monthly 2% is not the same as yearly 2%", () => {
  const m = calculateLoan(loan(base), [], "2027-01-05");
  const y = calculateLoan(loan({ ...base, rateUnit: "year" }), [], "2027-01-05");
  assert.equal(m.interestAccruedPaise, 480000); // 12 months * 400
  assert.equal(y.interestAccruedPaise, 40000); // 2% of 20000 for 365 days
});

test("partial payment: interest first, then principal; interest then runs on lower principal", () => {
  const payments = [{ id: "P1", amount: 5400, paymentDate: "2026-04-05", status: "verified" }];
  const r = calculateLoan(loan(base), payments, "2026-07-05");
  // 3 months interest = 1200; 5400 pays 1200 interest + 4200 principal -> 15800 left
  assert.equal(r.rows[0].toInterestPaise, 120000);
  assert.equal(r.rows[0].toPrincipalPaise, 420000);
  assert.equal(r.rows[0].outstandingAfterPaise, 1580000);
  // next 3 months on 15800 at 2% = 948
  assert.equal(r.unpaidInterestPaise, 94800);
  assert.equal(r.remainingPrincipalPaise, 1580000);
  assert.equal(r.outstandingPaise, 1674800);
  assert.equal(r.interestAccruedPaise, 120000 + 94800);
});

test("interest-only payment clears interest and leaves principal unchanged", () => {
  const payments = [{ id: "P1", amount: 400, paymentDate: "2026-02-05", paymentType: "interest_only" }];
  const r = calculateLoan(loan(base), payments, "2026-02-05");
  assert.equal(r.rows[0].toInterestPaise, 40000);
  assert.equal(r.rows[0].toPrincipalPaise, 0);
  assert.equal(r.outstandingPaise, 2000000);
});

test("simple interest never charges interest on unpaid interest", () => {
  const r = calculateLoan(loan(base), [], "2028-01-05"); // 24 months
  assert.equal(r.interestAccruedPaise, 2000000 * 0.02 * 24);
});

test("compound monthly: unpaid interest is added to the base each month", () => {
  const r = calculateLoan(loan({ ...base, method: "compound", compounding: "monthly" }), [], "2026-04-05");
  // 20000 -> 20400 -> 20808 -> 21224.16
  assert.equal(r.outstandingPaise, 2122416);
  assert.equal(r.remainingPrincipalPaise, 2000000);
  assert.equal(r.unpaidInterestPaise, 122416);
});

test("compound yearly with a monthly rate compounds once per 12 months", () => {
  const r = calculateLoan(loan({ ...base, method: "compound", compounding: "yearly" }), [], "2028-01-05");
  // year 1: 24% simple = 4800 -> base 24800; year 2: 24800 * 24% = 5952
  assert.equal(r.interestAccruedPaise, 480000 + 595200);
});

test("early settlement: full payment leaves nothing owed", () => {
  const payments = [{ id: "P1", amount: 20200, paymentDate: "2026-01-20" }];
  const r = calculateLoan(loan(base), payments, "2026-03-01");
  // 15 days = 0.5 month -> 200 interest
  assert.equal(r.rows[0].toInterestPaise, 20000);
  assert.equal(r.outstandingPaise, 0);
  assert.equal(r.settled, true);
});

test("overdue loan keeps accruing at the agreed rate (no invented penalty)", () => {
  const r = calculateLoan(loan({ ...base, dueDate: "2026-02-05" }), [], "2026-06-05");
  assert.equal(r.interestAccruedPaise, 200000); // 5 months
});

test("agreed interest pause stops interest for those dates", () => {
  const terms = { ...base, pauses: [{ from: "2026-02-05", to: "2026-03-05" }] };
  const r = calculateLoan(loan(terms), [], "2026-04-05");
  assert.equal(r.interestAccruedPaise, 80000); // 2 active months
});

test("same-cycle adjustment: agreed effective date is used instead of the late date", () => {
  const late = [{ id: "P1", amount: 5400, paymentDate: "2026-02-09" }];
  const adjusted = [{ id: "P1", amount: 5400, paymentDate: "2026-02-09", effectiveDate: "2026-02-05" }];
  const a = calculateLoan(loan(base), late, "2026-02-09");
  const b = calculateLoan(loan(base), adjusted, "2026-02-09");
  assert.equal(b.rows[0].date, "2026-02-05");
  assert.equal(b.rows[0].recordedDate, "2026-02-09");
  assert.ok(a.outstandingPaise > b.outstandingPaise);
  // 400 interest + 5000 principal on 5 Feb, then 4 days on 15000 = 40
  assert.equal(b.outstandingPaise, 1504000);
});

test("new cycle from agreed date moves compounding boundaries", () => {
  const terms = { ...base, method: "compound", compounding: "monthly", cycleAnchorDate: "2026-01-15" };
  const r = calculateLoan(loan(terms), [], "2026-02-15");
  // first boundary 15 Feb: 5 Jan -> 15 Feb = 1 month 10 days = 400 + 133.33
  assert.equal(r.unpaidInterestPaise, 53333);
});

test("pending, rejected and reversed payments are ignored", () => {
  const payments = [
    { id: "A", amount: 1000, paymentDate: "2026-02-05", status: "pending_verification" },
    { id: "B", amount: 1000, paymentDate: "2026-02-05", status: "rejected" },
    { id: "C", amount: 1000, paymentDate: "2026-02-05", status: "verified", reversedBy: "D" }
  ];
  const r = calculateLoan(loan(base), payments, "2026-02-05");
  assert.equal(r.totalPaidPaise, 0);
});

test("rounding is half-up to the paisa and money stays integer", () => {
  // 10000.01 paise base edge: ₹333.33 at 1.5%/month for 1 day
  const r = calculateLoan(loan({ ...base, principalPaise: 33333, ratePercent: 1.5 }), [], "2026-01-06");
  // 33333 * 1.5% / 30 = 16.6665 -> 17 paise
  assert.equal(r.interestAccruedPaise, 17);
  assert.ok(Number.isInteger(r.outstandingPaise));
  assert.equal(rupeesToPaise(0.1 + 0.2), 30);
});

test("missing or inconsistent terms -> needs clarification, no total", () => {
  const r1 = calculateLoan(loan({ ...base, rateUnit: undefined }), []);
  assert.equal(r1.status, "needs_clarification");
  assert.equal(r1.outstandingPaise, undefined);
  const r2 = calculateLoan(loan({ ...base, method: "compound" }), []);
  assert.equal(r2.status, "needs_clarification");
  const r3 = calculateLoan(loan(base), [{ id: "X", amount: 100, paymentDate: "2025-12-01" }], "2026-02-01");
  assert.equal(r3.status, "needs_clarification");
});

test("legacy loans map from the original form fields (rate was % per month)", () => {
  const legacy = { principal: 50000, interestRate: 2, interestType: "Simple", cycle: "monthly", loanDate: "2026-01-01", balance: 50000 };
  const t = termsFromLoan(legacy);
  assert.equal(t.rateUnit, "month");
  assert.equal(t.method, "simple");
  assert.equal(t.principalPaise, 5000000);
  const r = calculateLoan(legacy, [], "2026-02-01");
  assert.equal(r.interestAccruedPaise, 100000);
});

test("historical results are reproducible for a fixed as-of date", () => {
  const payments = [{ id: "P1", amount: 3000, paymentDate: "2026-03-01" }];
  const a = calculateLoan(loan(base), payments, "2026-05-01");
  const b = calculateLoan(loan(base), payments, "2026-05-01");
  assert.deepEqual(a, b);
});
