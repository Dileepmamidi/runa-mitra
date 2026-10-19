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
