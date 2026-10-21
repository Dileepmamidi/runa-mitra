import { useCopy } from "../i18n/useCopy";
import { calculateLoan, formatPaise, toDateKey } from "../utils/interestEngine";
import { Avatar, Badge, ListRow } from "../ui";
import { borrowerCardCopy } from "./BorrowerCard.copy";

export const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";

// Outstanding for one borrower, from the interest engine only. Loans whose
// terms are incomplete are counted separately and never guessed.
export function borrowerOutstanding(borrowerId, loans, payments, asOf = toDateKey(new Date())) {
  let outstandingPaise = 0;
  let unclear = 0;
  let count = 0;
  for (const loan of loans) {
    if (loan.borrowerId !== borrowerId) continue;
    count += 1;
    const calc = calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), asOf);
    if (calc.status === "ok") outstandingPaise += calc.outstandingPaise;
    else unclear += 1;
  }
  return { outstandingPaise, unclear, count };
}

/** One borrower row for lists: avatar, village, engine outstanding, app access. */
export function BorrowerCard({ borrower, summary }) {
  const s = useCopy(borrowerCardCopy);
  const name = borrowerName(borrower) || s.unknown;
  const sub = [borrower.village, borrower.mobile].filter(Boolean).join(" · ");
  return (
    <ListRow
      to={`/borrowers/${borrower.id}`}
      avatar={<Avatar name={name} src={borrower.photoUrl || undefined} />}
      title={name}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          {sub && <span className="truncate">{sub}</span>}
          {borrower.linkedUid ? <Badge tone="brand">{s.usingApp}</Badge> : <Badge>{s.notInvited}</Badge>}
        </span>
      }
      trailing={
        summary ? (
          summary.count === 0 ? (
            <span className="text-sm font-semibold text-ink-muted">{s.noLoans}</span>
          ) : (
            <span className="flex flex-col items-end gap-1">
              <span className="tabular text-[16px] font-extrabold text-ink">{formatPaise(summary.outstandingPaise)}</span>
              {summary.unclear > 0 && <Badge tone="amber">{s.needsCheck}</Badge>}
            </span>
          )
        ) : null
      }
    />
  );
}
