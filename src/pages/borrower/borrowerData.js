import { formatPaise as formatPaiseForLabel } from "../../utils/interestEngine";
// Shared data helpers for the borrower screens. Every amount comes from the
// interest engine; loan.balance is never shown as the amount owed.
import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { calculateLoan, daysBetween, rupeesToPaise, termsFromLoan, toDateKey } from "../../utils/interestEngine";

export const todayKey = () => toDateKey(new Date());

/** Milliseconds for Firestore Timestamps, Dates, {seconds} objects or date strings. */
export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && Number.isFinite(value.seconds)) return value.seconds * 1000;
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof value === "number") return value;
  return 0;
}

/** YYYY-MM-DD for any supported date value. */
export function dateKeyOf(value) {
  if (!value) return null;
  if (typeof value === "object" && !value.toDate && !(value instanceof Date) && Number.isFinite(value.seconds)) {
    return toDateKey(new Date(value.seconds * 1000));
  }
  return toDateKey(value);
}

/** Payments that belong to this loan (same lender, same loan id). */
export function paymentsForLoan(loan, payments) {
  return payments.filter((p) => p.loanId === loan.id && (!p.lenderUid || p.lenderUid === loan.lenderUid));
}

export function principalPaiseOf(loan) {
  const terms = termsFromLoan(loan);
  if (Number.isInteger(terms?.principalPaise) && terms.principalPaise > 0) return terms.principalPaise;
  const p = rupeesToPaise(loan?.principal);
  return Number.isFinite(p) && p > 0 ? p : null;
}

export function loanStartKey(loan) {
  return toDateKey(termsFromLoan(loan)?.startDate) || toDateKey(loan?.loanDate) || null;
}

/** Due-date status for an unsettled loan, or null when there is nothing due. */
export function dueInfo(loan, calc, today = todayKey()) {
  const due = toDateKey(loan?.dueDate);
  if (!due) return null;
  if (calc?.status === "ok" && calc.settled) return null;
  const days = daysBetween(today, due);
  return { date: due, days, overdue: days < 0, today: days === 0 };
}

/** Every visible loan with its own payments and engine result. */
export function useBorrowerLoans() {
  const { loans, payments } = useApp();
  return useMemo(() => {
    const today = todayKey();
    return loans
      .map((loan) => {
        const own = paymentsForLoan(loan, payments);
        const calc = calculateLoan(loan, own, today);
        return { loan, payments: own, calc, due: dueInfo(loan, calc, today) };
      })
      .sort((a, b) => (loanStartKey(b.loan) || "").localeCompare(loanStartKey(a.loan) || ""));
  }, [loans, payments]);
}

/** Loans the borrower may still act on (not fully settled, or unclear). */
export function openLoans(items) {
  return items.filter((x) => x.calc.status !== "ok" || !x.calc.settled);
}

/** Text for a due-date status object from dueInfo(). */
export function dueText(sh, due) {
  if (!due) return sh.noDueDate;
  if (due.today) return sh.dueToday;
  if (due.overdue) return sh.overdueDays(-due.days);
  if (due.days <= 30) return sh.dueInDays(due.days);
  return sh.dueOn(sh.date(due.date));
}

/** "pending" | "approved" | "rejected" | "other" for an extension request message. */
export function requestState(msg) {
  const st = String(msg?.status || "pending").toLowerCase();
  if (st === "pending") return "pending";
  if (["approved", "accepted", "agreed"].includes(st)) return "approved";
  if (["rejected", "declined", "denied"].includes(st)) return "rejected";
  return "other";
}

/** True once the lender has replied to or closed a question. */
export function isAnswered(msg) {
  return Boolean(msg?.response) || String(msg?.status || "pending").toLowerCase() !== "pending";
}

/** Newest-first sort key for a message. */
export const messageTime = (m) => toMillis(m.respondedAt || m.updatedAt || m.createdAt || m.requestedAt);

// ---------- acknowledgements, agreements, guarantors, collateral ----------

/** Stable key for a termsHistory entry: its changeId, else its changedAt. */
export function changeKey(entry) {
  const key = entry?.changeId || entry?.changedAt;
  if (!key) return null;
  return typeof key === "string" ? key : String(toMillis(key) || "") || null;
}

/** This user's own acknowledgement on a document matching `match`, or null. */
export function myAcknowledgement(doc, uid, match = () => true) {
  if (!uid || !Array.isArray(doc?.acknowledgements)) return null;
  return doc.acknowledgements.find((a) => a && a.uid === uid && match(a)) || null;
}

/** The borrower's acknowledgement of one loan change, or null. */
export function changeAcknowledgement(loan, entry, uid) {
  const key = changeKey(entry);
  if (!key) return null;
  return myAcknowledgement(loan, uid, (a) => a.kind === "change" && String(a.changeId) === key);
}

const sameLender = (doc, loan) => !doc.lenderUid || !loan.lenderUid || doc.lenderUid === loan.lenderUid;
const docTime = (d) => toMillis(d.generatedAt || d.createdAt || d.uploadedAt);

/**
 * Agreements for one loan, newest first, each with its version number,
 * whether a newer version replaced it, and the borrower's acknowledgement.
 */
export function agreementVersions(loan, agreements, uid) {
  const list = agreements
    .filter((a) => a.loanId === loan.id && sameLender(a, loan))
    .sort((a, b) => {
      const va = Number.isFinite(a.version) ? a.version : 0;
      const vb = Number.isFinite(b.version) ? b.version : 0;
      return va !== vb ? va - vb : docTime(a) - docTime(b);
    });
  const replacedIds = new Set(list.map((a) => a.supersedes).filter(Boolean));
  return list
    .map((agr, i) => {
      const version = Number.isFinite(agr.version) ? agr.version : i + 1;
      const latest = i === list.length - 1;
      const ack = myAcknowledgement(agr, uid, (a) => !a.kind || a.kind === "agreement");
      return { agr, version, replaced: !latest || replacedIds.has(agr.id), latest, ack };
    })
    .reverse();
}

/** Loan changes and current agreements still waiting for this borrower. */
export function pendingAcknowledgements(items, agreements, uid) {
  const out = [];
  for (const { loan } of items) {
    for (const entry of Array.isArray(loan.termsHistory) ? loan.termsHistory : []) {
      if (changeKey(entry) && !changeAcknowledgement(loan, entry, uid)) {
        out.push({ kind: "change", loan, entry, when: entry.changedAt });
      }
    }
    for (const v of agreementVersions(loan, agreements, uid)) {
      if (v.latest && !v.ack) out.push({ kind: "agreement", loan, agreement: v.agr, when: v.agr.generatedAt || v.agr.createdAt });
    }
  }
  return out;
}

export function guarantorsForLoan(loan, guarantors = []) {
  return guarantors.filter((g) => g.loanId === loan.id && sameLender(g, loan));
}

export function collateralForLoan(loan, collateral = []) {
  return collateral.filter((c) => c.loanId === loan.id && sameLender(c, loan));
}

/** "recorded" | "disputed" | "not_recorded" for a guarantor's acknowledgement. */
export function guarantorAckState(g) {
  const st = String(g?.acknowledgement?.status || "").toLowerCase();
  if (["recorded", "acknowledged", "agreed", "accepted"].includes(st)) return "recorded";
  if (["disputed", "declined", "refused", "rejected"].includes(st)) return "disputed";
  return "not_recorded";
}

/** "returned" | "held" for a collateral record. */
export function collateralState(c) {
  const st = String(c?.status || "").toLowerCase();
  return st === "returned" || c?.returnedAt || c?.returnedDate ? "returned" : "held";
}

/** Paise value of a stored amount (amountPaise preferred), or null. */
export function amountPaiseOf(record, paiseKey = "amountPaise", rupeesKey = "amount") {
  if (Number.isInteger(record?.[paiseKey]) && record[paiseKey] > 0) return record[paiseKey];
  const p = rupeesToPaise(record?.[rupeesKey]);
  return Number.isFinite(p) && p > 0 ? p : null;
}

/** Amount as words for speech: "12,500" plus paise when not whole rupees. */
export function spokenAmountParts(paise) {
  const n = Math.max(0, Math.round(Number(paise) || 0));
  return {
    rupees: new Intl.NumberFormat("en-IN").format(Math.floor(n / 100)),
    paise: n % 100
  };
}

/** Short label that tells two loans apart: "₹20,000 · 5 May 2026". `sh` is the shared borrower copy. */
export function loanLabel(loan, sh) {
  const paise = principalPaiseOf(loan);
  const start = loanStartKey(loan);
  return [paise ? formatPaiseForLabel(paise) : "", start ? sh.date(start) : ""].filter(Boolean).join(" · ");
}
