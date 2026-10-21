import { useMemo } from "react";
import { useCopy } from "../i18n/useCopy";
import { calculateLoan, formatPaise, toDateKey } from "../utils/interestEngine";
import { Card, DetailRow, Notice, Section } from "../ui";
import { loanBreakdownCopy } from "./LoanBreakdown.copy";

export function useLoanCalculation(loan, payments, asOf) {
  return useMemo(() => {
    if (!loan) return null;
    const loanPayments = payments.filter((p) => p.loanId === loan.id);
    return calculateLoan(loan, loanPayments, asOf || toDateKey(new Date()));
  }, [loan, payments, asOf]);
}

// The engine writes issues in English. Map each one to the screen language.
export function issueText(s, issue) {
  const i = String(issue || "");
  let m;
  if (/terms are missing/i.test(i)) return s.issues.missing;
  if (/Principal amount/i.test(i)) return s.issues.principal;
  if (/Interest rate/i.test(i)) return s.issues.rate;
  if (/per month or per year/i.test(i)) return s.issues.unit;
  if (/Interest method/i.test(i)) return s.issues.method;
  if (/Compounding frequency/i.test(i)) return s.issues.compounding;
  if (/date the money was given/i.test(i)) return s.issues.start;
  if (/Calculation date is invalid/i.test(i)) return s.issues.asOf;
  if (/Calculation date is before/i.test(i)) return s.issues.beforeStart;
  if (/has no date/i.test(i)) return s.issues.paymentNoDate;
  if ((m = /payment dated (\S+) is before/i.exec(i))) return s.issues.paymentBeforeStart(m[1]);
  if (/invalid amount/i.test(i)) return s.issues.paymentAmount;
  return s.issues.other;
}

export function noteText(s, note) {
  const n = String(note || "");
  let m;
  if ((m = /^(\d+) payment\(s\) dated after (\S+) are not included/.exec(n))) return s.notes.future(m[1], m[2]);
  if ((m = /^Interest-only payment on (\S+) was more/.exec(n))) return s.notes.interestOnlyExtra(m[1]);
  if ((m = /^Payment on (\S+) was more than the amount owed by (.+)\.$/.exec(n))) return s.notes.overpaid(m[1], m[2]);
  return null;
}

export function LoanBreakdown({ loan, payments }) {
  const s = useCopy(loanBreakdownCopy);
  const result = useLoanCalculation(loan, payments);
  if (!result) return null;

  const hasPending = payments.some((p) => p.loanId === loan.id && p.status === "pending_verification");

  if (result.status !== "ok") {
    const issues = [...new Set(result.issues.map((issue) => issueText(s, issue)))];
    return (
      <Notice tone="warning" title={s.clarify}>
        <p className="mt-1">{s.clarifyHelp}</p>
        <ul className="mt-2 list-disc pl-5">
          {issues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      </Notice>
    );
  }

  const t = result.terms;
  const rate = s.rate(t.ratePercent, t.rateUnit === "year" ? s.year : s.month, t.method === "compound" ? s.compound : s.simple);
  const notes = result.notes.map((note) => noteText(s, note)).filter(Boolean);

  return (
    <Section title={s.title} action={<span className="text-[13px] font-semibold text-ink-muted">{s.asOf(result.asOf)}</span>}>
      <Card>
        <DetailRow label={s.principal} value={formatPaise(result.principalPaise)} />
        <DetailRow label={s.interest} value={formatPaise(result.interestAccruedPaise)} />
        <DetailRow label={s.paid} value={<span className="text-brand-700">{formatPaise(result.totalPaidPaise)}</span>} />
        <DetailRow label={s.remainingPrincipal} value={formatPaise(result.remainingPrincipalPaise)} />
        <DetailRow label={s.unpaidInterest} value={formatPaise(result.unpaidInterestPaise)} />
        <DetailRow label={s.outstanding} value={formatPaise(result.outstandingPaise)} strong />
        <p className="mt-3 rounded-xl bg-brand-50 p-3 text-[15px] font-medium text-ink">
          {s.explain(t.startDate, formatPaise(result.principalPaise), rate, result.asOf, formatPaise(result.outstandingPaise))}
        </p>
        <p className="mt-2 text-[13px] font-medium text-ink-muted">{t.rateUnit === "year" ? s.rulesYear : s.rules}</p>
        {hasPending && <p className="mt-1 text-[13px] font-medium text-ink-muted">{s.pending}</p>}
        {notes.map((note) => <p key={note} className="mt-1 text-[13px] font-medium text-ink-muted">{note}</p>)}
      </Card>
    </Section>
  );
}
