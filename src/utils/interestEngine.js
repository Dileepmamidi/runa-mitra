// Runa Mitra interest engine.
//
// Single source of truth for every amount shown to lenders and borrowers.
// All money is integer paise; all interest arithmetic uses BigInt so results
// are exact and reproducible. Change ENGINE_VERSION whenever a rule changes so
// stored calculations can say which rules produced them.
//
// Rules (engine v1):
// - Monthly rates: time = whole calendar months + leftover days / 30.
//   (5 Jan -> 5 Mar is exactly 2 months; 5 Jan -> 20 Jan is 15/30 month.)
// - Yearly rates: time = actual days / 365.
// - Simple interest accrues only on outstanding principal. Unpaid interest is
//   NEVER charged interest under the simple method.
// - Compound interest: unpaid interest is added to the interest-bearing base
//   at each compounding boundary (weekly / monthly / yearly from the anchor).
// - Payments are applied interest first, then principal.
//   An "interest_only" payment is applied to interest only; any excess is
//   applied to principal and reported as a note.
// - Interest is rounded half-up to the nearest paisa per accrual segment.
// - Only payments that are verified (or legacy lender-recorded payments with no
//   status) count. Pending, rejected and reversed payments are ignored.
// - Agreed pauses ({ from, to }) stop interest for those dates.
// - A payment may carry an agreed effectiveDate (same-cycle adjustment); the
//   engine then treats it as paid on that date.
// - Missing or inconsistent terms produce status "needs_clarification" and no
//   definitive total.

export const ENGINE_VERSION = 1;

const DAY_MS = 86400000;

// ---------- money helpers ----------

export function rupeesToPaise(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export function paiseToRupees(paise) {
  return (paise || 0) / 100;
}

export function formatPaise(paise, { decimals } = {}) {
  const rupees = paiseToRupees(paise);
  const digits = decimals ?? (paise % 100 === 0 ? 0 : 2);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(rupees);
}

// Rate like 2.25 (%) -> 22500 (rate * 10^4) as BigInt, exact for up to 4 decimals.
function rateE4(ratePercent) {
  return BigInt(Math.round(Number(ratePercent) * 10000));
}

// Exact half-up division for non-negative BigInts.
function divRoundHalfUp(num, den) {
  return (num * 2n + den) / (den * 2n);
}

// ---------- date helpers (UTC, day precision) ----------

export function toDateKey(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  // Firestore Timestamp or Date
  const date = typeof value.toDate === "function" ? value.toDate() : value instanceof Date ? value : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
}

function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function keyToMs(key) {
  const { y, m, d } = parseKey(key);
  return Date.UTC(y, m - 1, d);
}

function msToKey(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((keyToMs(b) - keyToMs(a)) / DAY_MS);
}

export function addDays(key, n) {
  return msToKey(keyToMs(key) + n * DAY_MS);
}

// Adds calendar months, clamping to month end (31 Jan + 1 month = 28/29 Feb).
export function addMonths(key, n) {
  const { y, m, d } = parseKey(key);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return msToKey(Date.UTC(ny, nm, Math.min(d, lastDay)));
}

// Whole calendar months from a to b, plus leftover days. Requires a <= b.
export function monthsAndDays(a, b) {
  const pa = parseKey(a);
  const pb = parseKey(b);
  let months = (pb.y - pa.y) * 12 + (pb.m - pa.m);
  if (months > 0 && addMonths(a, months) > b) months -= 1;
  if (months < 0) months = 0;
  const anchor = addMonths(a, months);
  return { months, days: daysBetween(anchor, b) };
}

// ---------- terms ----------

const RATE_UNITS = ["month", "year"];
const METHODS = ["simple", "compound"];
const COMPOUNDING = ["weekly", "monthly", "yearly"];

// Builds engine terms from a loan document. New loans store `terms`; older
// loans only have the legacy fields written by the original AddLoan form,
// whose rate field was labelled "Interest rate (% per month)".
export function termsFromLoan(loan) {
  if (!loan) return null;
  if (loan.terms && typeof loan.terms === "object") {
    return { source: "terms", ...loan.terms };
  }
  const method = String(loan.interestType || "").toLowerCase();
  return {
    source: "legacy",
    principalPaise: rupeesToPaise(loan.principal),
    ratePercent: Number(loan.interestRate),
    rateUnit: "month",
    method: METHODS.includes(method) ? method : undefined,
    compounding: method === "compound" ? loan.cycle || undefined : undefined,
    startDate: toDateKey(loan.loanDate) || toDateKey(loan.createdAt),
    pauses: []
  };
}

export function validateTerms(terms) {
  const issues = [];
  if (!terms) return ["Loan terms are missing."];
  if (!Number.isInteger(terms.principalPaise) || terms.principalPaise <= 0) issues.push("Principal amount is missing or not positive.");
  if (!Number.isFinite(terms.ratePercent) || terms.ratePercent < 0) issues.push("Interest rate is missing or invalid.");
  if (!RATE_UNITS.includes(terms.rateUnit)) issues.push("It is not recorded whether the rate is per month or per year.");
  if (!METHODS.includes(terms.method)) issues.push("Interest method (simple or compound) is not recorded.");
  if (terms.method === "compound" && !COMPOUNDING.includes(terms.compounding)) issues.push("Compounding frequency is not recorded for a compound-interest loan.");
  if (!toDateKey(terms.startDate)) issues.push("The date the money was given is missing.");
  return issues;
}

// ---------- accrual ----------

function segmentInterest(basePaise, terms, from, to) {
  if (basePaise <= 0 || from >= to) return 0;
  const r = rateE4(terms.ratePercent);
  const base = BigInt(basePaise);
  if (terms.rateUnit === "month") {
    const { months, days } = monthsAndDays(from, to);
    const units = BigInt(months * 30 + days); // time measured in 1/30 months
    return Number(divRoundHalfUp(base * r * units, 100n * 10000n * 30n));
  }
  const days = BigInt(daysBetween(from, to));
  return Number(divRoundHalfUp(base * r * days, 100n * 10000n * 365n));
}

// Splits [from, to) around agreed pauses and accrues only active time.
function accrue(basePaise, terms, from, to) {
  const pauses = (terms.pauses || [])
    .map((p) => ({ from: toDateKey(p.from), to: toDateKey(p.to) }))
    .filter((p) => p.from && p.to && p.from < p.to)
    .sort((a, b) => (a.from < b.from ? -1 : 1));
  let total = 0;
  let cursor = from;
  for (const p of pauses) {
    if (p.to <= cursor || p.from >= to) continue;
    if (p.from > cursor) total += segmentInterest(basePaise, terms, cursor, p.from);
    cursor = p.to > cursor ? p.to : cursor;
    if (cursor >= to) return total;
  }
  total += segmentInterest(basePaise, terms, cursor, to);
  return total;
}

function nextBoundary(anchor, compounding, index) {
  if (compounding === "weekly") return addDays(anchor, 7 * index);
  if (compounding === "yearly") return addMonths(anchor, 12 * index);
  return addMonths(anchor, index);
}

export function countsAsPaid(payment) {
  const s = payment?.status;
  if (payment?.reversed || payment?.reversedBy) return false;
  return s === undefined || s === null || s === "" || s === "verified";
}

// ---------- main calculation ----------

/**
 * @param {object} loan    Firestore loan document (with id)
 * @param {object[]} payments  payments for this loan (any status)
 * @param {string} asOf    YYYY-MM-DD; defaults to today
 */
export function calculateLoan(loan, payments = [], asOf = toDateKey(new Date())) {
  const terms = termsFromLoan(loan);
  const issues = validateTerms(terms);
  const asOfKey = toDateKey(asOf);
  if (!asOfKey) issues.push("Calculation date is invalid.");

  const base = {
    engineVersion: ENGINE_VERSION,
    asOf: asOfKey,
    terms,
    issues,
    notes: [],
    rows: []
  };
  if (issues.length) return { ...base, status: "needs_clarification" };

  const start = toDateKey(terms.startDate);
  if (asOfKey < start) {
    return { ...base, status: "needs_clarification", issues: ["Calculation date is before the loan start date."] };
  }

  const counted = payments
    .filter(countsAsPaid)
    .map((p) => ({
      id: p.id,
      date: toDateKey(p.effectiveDate) || toDateKey(p.paymentDate) || toDateKey(p.createdAt),
      recordedDate: toDateKey(p.paymentDate),
      amountPaise: Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount),
      kind: p.paymentType === "interest_only" ? "interest_only" : "normal",
      method: p.method || "",
      recordedBy: p.type === "borrower_submitted" ? "borrower" : "lender"
    }));

  for (const p of counted) {
    if (!p.date) issues.push(`A payment (${p.id || "unknown"}) has no date.`);
    else if (p.date < start) issues.push(`A payment dated ${p.date} is before the loan start date.`);
    if (!Number.isInteger(p.amountPaise) || p.amountPaise <= 0) issues.push(`A payment (${p.id || "unknown"}) has an invalid amount.`);
  }
  if (issues.length) return { ...base, status: "needs_clarification" };

  counted.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const future = counted.filter((p) => p.date > asOfKey);
  const applied = counted.filter((p) => p.date <= asOfKey);
  if (future.length) base.notes.push(`${future.length} payment(s) dated after ${asOfKey} are not included.`);

  let principal = terms.principalPaise; // original principal still owed
  let capitalized = 0; // compound only: interest added to the base
  let accrued = 0; // unpaid interest not yet capitalized
  let interestAccruedTotal = 0;
  let cursor = start;
  let boundaryIndex = 1;
  const anchor = toDateKey(terms.cycleAnchorDate) || start;

  const accrueTo = (date) => {
    if (terms.method === "compound") {
      let boundary = nextBoundary(anchor, terms.compounding, boundaryIndex);
      while (boundary <= date) {
        if (boundary > cursor) {
          const i = accrue(principal + capitalized, terms, cursor, boundary);
          accrued += i;
          interestAccruedTotal += i;
          cursor = boundary;
        }
        capitalized += accrued;
        accrued = 0;
        boundaryIndex += 1;
        boundary = nextBoundary(anchor, terms.compounding, boundaryIndex);
      }
    }
    if (date > cursor) {
      const i = accrue(principal + capitalized, terms, cursor, date);
      accrued += i;
      interestAccruedTotal += i;
      cursor = date;
    }
  };

  let totalPaid = 0;
  let interestPaid = 0;
  let principalPaid = 0;
  let excessPaid = 0;

  for (const p of applied) {
    accrueTo(p.date);
    let left = p.amountPaise;
    totalPaid += left;

    const toAccrued = Math.min(left, accrued);
    accrued -= toAccrued;
    left -= toAccrued;
    // Capitalized interest is still interest from the borrower's point of view.
    const toCap = Math.min(left, capitalized);
    capitalized -= toCap;
    left -= toCap;
    const toInterest = toAccrued + toCap;

    if (p.kind === "interest_only" && left > 0) {
      base.notes.push(`Interest-only payment on ${p.date} was more than the interest due; the extra was applied to principal.`);
    }
    const toPrincipal = Math.min(left, principal);
    principal -= toPrincipal;
    left -= toPrincipal;
    if (left > 0) {
      excessPaid += left;
      base.notes.push(`Payment on ${p.date} was more than the amount owed by ${formatPaise(left)}.`);
    }
    interestPaid += toInterest;
    principalPaid += toPrincipal;

    base.rows.push({
      paymentId: p.id,
      date: p.date,
      recordedDate: p.recordedDate,
      amountPaise: p.amountPaise,
      method: p.method,
      recordedBy: p.recordedBy,
      toInterestPaise: toInterest,
      toPrincipalPaise: toPrincipal,
      excessPaise: left,
      outstandingAfterPaise: principal + capitalized + accrued
    });
  }

  accrueTo(asOfKey);

  const unpaidInterest = capitalized + accrued;
  return {
    ...base,
    status: "ok",
    principalPaise: terms.principalPaise,
    interestAccruedPaise: interestAccruedTotal,
    totalPaidPaise: totalPaid,
    interestPaidPaise: interestPaid,
    principalPaidPaise: principalPaid,
    excessPaidPaise: excessPaid,
    remainingPrincipalPaise: principal,
    unpaidInterestPaise: unpaidInterest,
    outstandingPaise: principal + unpaidInterest,
    settled: principal + unpaidInterest === 0
  };
}
