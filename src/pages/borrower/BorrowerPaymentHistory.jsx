import { HandCoins, HelpCircle, Printer, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { countsAsPaid, formatPaise, paiseToRupees, rupeesToPaise } from "../../utils/interestEngine";
import { generateReceipt } from "../../utils/receiptGenerator";
import { Badge, Button, Card, EmptyState, Notice, Screen, Section } from "../../ui";
import { dateKeyOf, principalPaiseOf, toMillis, useBorrowerLoans } from "./borrowerData";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerPaymentHistoryCopy } from "./BorrowerPaymentHistory.copy";

const amountOf = (p) => (Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount));
const isCancelled = (p) => Boolean(p.reversed || p.reversedBy) || p.status === "reversed";

export function BorrowerPaymentHistory() {
  const { borrowers } = useApp();
  const s = useCopy(borrowerPaymentHistoryCopy);
  const sh = useCopy(borrowerSharedCopy);
  const items = useBorrowerLoans();

  const tellButton = <Button size="lg" block icon={HandCoins} to="/payments/new">{s.tellLender}</Button>;

  if (items.length === 0) {
    return (
      <Screen title={s.title} subtitle={s.subtitle}>
        <EmptyState icon={Wallet} title={s.noLoansTitle} text={s.noLoansText} />
      </Screen>
    );
  }

  const printReceipt = (loan, row) => {
    const me = borrowers.find((b) => b.lenderUid === loan.lenderUid) || borrowers[0] || {};
    const principal = principalPaiseOf(loan);
    generateReceipt({
      paymentDate: row.date,
      borrowerName: me.name || "",
      principal: principal ? paiseToRupees(principal) : "",
      amountPaid: paiseToRupees(row.amountPaise),
      method: sh.method(row.method)
    });
  };

  return (
    <Screen title={s.title} subtitle={s.subtitle}>
      {tellButton}

      {items.map(({ loan, calc, payments }) => {
        const notCounted = payments
          .filter((p) => !countsAsPaid(p))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        const counted = payments.filter(countsAsPaid);

        return (
          <Section key={`${loan.lenderUid}_${loan.id}`} title={sh.loanFrom(loan.lenderName)}>
            <div className="grid gap-3">
              {calc.status !== "ok" && <Notice tone="warning" title={s.unclearTitle}>{s.unclearText}</Notice>}

              {calc.status === "ok" && calc.rows.length === 0 && (
                <Card><p className="text-[15px] font-medium text-ink-muted">{s.noPayments}</p></Card>
              )}

              {calc.status === "ok" && calc.rows.map((row, i) => (
                <Card key={row.paymentId || i}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-ink-soft">{sh.date(row.date)}</p>
                      <p className="tabular text-[28px] font-extrabold leading-tight text-ink">{formatPaise(row.amountPaise)}</p>
                      <p className="mt-0.5 text-[14px] font-semibold text-ink-muted">
                        {sh.method(row.method)} · {row.recordedBy === "borrower" ? sh.byYou : sh.byLender}
                      </p>
                    </div>
                    <Button variant="soft" size="sm" icon={Printer} onClick={() => printReceipt(loan, row)}>{s.receipt}</Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-[13px] font-bold text-amber-800">{s.toInterest}</p>
                      <p className="tabular text-[17px] font-extrabold text-ink">{formatPaise(row.toInterestPaise)}</p>
                    </div>
                    <div className="rounded-xl bg-brand-50 p-3">
                      <p className="text-[13px] font-bold text-brand-800">{s.toPrincipal}</p>
                      <p className="tabular text-[17px] font-extrabold text-ink">{formatPaise(row.toPrincipalPaise)}</p>
                    </div>
                  </div>
                  {row.excessPaise > 0 && (
                    <p className="mt-2 text-[14px] font-bold text-sky-800">{s.extra}: {formatPaise(row.excessPaise)}</p>
                  )}
                  <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
                    <span className="text-[14px] font-semibold text-ink-soft">{s.leftAfter}</span>
                    <span className="tabular text-[17px] font-extrabold text-ink">{formatPaise(row.outstandingAfterPaise)}</span>
                  </div>
                </Card>
              ))}

              {calc.status !== "ok" && (counted.length === 0 ? (
                <Card><p className="text-[15px] font-medium text-ink-muted">{s.noPayments}</p></Card>
              ) : (
                counted
                  .map((p) => ({ p, date: dateKeyOf(p.effectiveDate) || dateKeyOf(p.paymentDate) || dateKeyOf(p.createdAt) }))
                  .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                  .map(({ p, date }) => (
                    <Card key={p.id}>
                      <p className="text-[15px] font-bold text-ink-soft">{date ? sh.date(date) : sh.notRecorded}</p>
                      <p className="tabular text-[24px] font-extrabold text-ink">{Number.isFinite(amountOf(p)) ? formatPaise(amountOf(p)) : sh.notRecorded}</p>
                      <p className="text-[14px] font-semibold text-ink-muted">
                        {sh.method(p.method)} · {p.type === "borrower_submitted" ? sh.byYou : sh.byLender}
                      </p>
                    </Card>
                  ))
              ))}

              {notCounted.length > 0 && (
                <>
                  <p className="mt-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink-muted">{s.waitingTitle}</p>
                  {notCounted.map((p) => {
                    const date = dateKeyOf(p.paymentDate) || dateKeyOf(p.createdAt);
                    const rejected = p.status === "rejected";
                    const cancelled = isCancelled(p);
                    const reason = p.rejectionReason || p.rejectReason;
                    return (
                      <Card key={p.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[15px] font-bold text-ink-soft">{date ? sh.date(date) : sh.notRecorded}</p>
                          {cancelled
                            ? <Badge tone="ink">{s.cancelled}</Badge>
                            : rejected ? <Badge tone="rose">{s.rejected}</Badge> : <Badge tone="amber">{s.pending}</Badge>}
                        </div>
                        <p className="tabular text-[24px] font-extrabold text-ink">{Number.isFinite(amountOf(p)) ? formatPaise(amountOf(p)) : sh.notRecorded}</p>
                        <p className="text-[14px] font-semibold text-ink-muted">{sh.method(p.method)}</p>
                        {!cancelled && (
                          <p className="mt-2 text-[14px] font-medium text-ink-soft">{rejected ? s.rejectedText : s.pendingText}</p>
                        )}
                        {rejected && reason && (
                          <p className="mt-1 text-[14px] font-medium text-ink-soft"><span className="font-bold">{s.lenderReason}:</span> {reason}</p>
                        )}
                      </Card>
                    );
                  })}
                </>
              )}

              <Link
                to={`/help?loan=${loan.id}&topic=missing_payment`}
                className="flex min-h-12 items-center gap-2 px-1 text-[15px] font-bold text-brand-700"
              >
                <HelpCircle size={19} /> {s.reportMissing}
              </Link>
            </div>
          </Section>
        );
      })}
    </Screen>
  );
}
