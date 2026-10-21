import { useMemo } from "react";
import { History } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { calculateLoan, countsAsPaid, daysBetween, formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { Avatar, Badge, Card, DetailRow, EmptyState, Notice, Screen } from "../ui";
import { repaymentHistoryCopy } from "./RiskAnalysis.copy";

const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";

// Per-borrower repayment facts. No scores and no risk labels.
export function RiskAnalysis() {
  const { borrowers, loans, payments } = useApp();
  const s = useCopy(repaymentHistoryCopy);
  const today = toDateKey(new Date());

  const rows = useMemo(
    () =>
      borrowers.map((b) => {
        const mine = payments.filter((p) => p.borrowerId === b.id);
        const counted = mine.filter(countsAsPaid);
        const waiting = mine.filter((p) => p.status === "pending_verification").length;
        const dates = counted.map((p) => toDateKey(p.paymentDate) || toDateKey(p.createdAt)).filter(Boolean).sort();
        const totalPaid = counted.reduce((sum, p) => sum + (rupeesToPaise(p.amount) || 0), 0);
        const loanRows = loans
          .filter((l) => l.borrowerId === b.id)
          .map((loan) => {
            const calc = calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), today);
            const due = toDateKey(loan.dueDate);
            const settled = calc.status === "ok" && calc.settled;
            const daysLate = !settled && due && due < today ? daysBetween(due, today) : 0;
            return { loan, calc, due, settled, daysLate };
          });
        return { b, count: counted.length, last: dates.at(-1), totalPaid, waiting, loanRows };
      }),
    [borrowers, loans, payments, today]
  );

  const loanStatus = ({ calc, due, settled, daysLate }) => {
    if (settled) return <Badge tone="brand">{s.settled}</Badge>;
    if (calc.status !== "ok") return <Badge tone="amber">{s.unclearTerms}</Badge>;
    if (!due) return <Badge>{s.noDueDate}</Badge>;
    if (daysLate > 0) return <Badge tone="rose">{s.pastDue(daysLate, due)}</Badge>;
    return <Badge>{s.dueOn(due)}</Badge>;
  };

  return (
    <Screen title={s.title} back="/more">
      <Notice tone="info">{s.factsOnly}</Notice>
      {rows.length === 0 ? (
        <EmptyState icon={History} title={s.noBorrowers} />
      ) : (
        rows.map((row) => (
          <Card key={row.b.id}>
            <Link to={`/borrowers/${row.b.id}`} className="flex items-center gap-3">
              <Avatar name={borrowerName(row.b)} />
              <span className="min-w-0 flex-1 truncate text-[17px] font-bold text-ink">{borrowerName(row.b)}</span>
            </Link>
            <div className="mt-2">
              <DetailRow label={s.verifiedPayments} value={row.count} />
              <DetailRow label={s.lastPayment} value={row.last || s.none} />
              <DetailRow label={s.totalPaid} value={formatPaise(row.totalPaid)} />
            </div>
            {row.waiting > 0 && <p className="mt-2 text-[13px] font-semibold text-amber-700">{s.waiting(row.waiting)}</p>}
            <div className="mt-3 grid gap-2">
              {row.loanRows.length === 0 ? (
                <p className="text-[14px] font-medium text-ink-muted">{s.noLoans}</p>
              ) : (
                row.loanRows.map((lr) => (
                  <Link key={lr.loan.id} to={`/loans/${lr.loan.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2.5 active:bg-line">
                    <span className="text-[14px] font-semibold text-ink">
                      {s.loanLine(formatPaise(rupeesToPaise(lr.loan.principal) || lr.calc.terms?.principalPaise || 0), toDateKey(lr.loan.loanDate))}
                    </span>
                    {loanStatus(lr)}
                  </Link>
                ))
              )}
            </div>
          </Card>
        ))
      )}
    </Screen>
  );
}
