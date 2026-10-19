import { useParams } from "react-router-dom";
import { Pencil, Printer, ReceiptText, User } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { LoanBreakdown, useLoanCalculation } from "../components/LoanBreakdown";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { countsAsPaid, formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { generateReceipt } from "../utils/receiptGenerator";
import { Avatar, Badge, Button, Card, DetailRow, EmptyState, List, MoneyHero, Screen, Section } from "../ui";
import { loanFormCopy } from "./AddLoan.copy";
import { ChangeTable } from "./EditLoan";
import { editLoanCopy } from "./EditLoan.copy";
import { loanDetailsCopy } from "./LoanDetails.copy";

const paymentDateKey = (p) => toDateKey(p.paymentDate) || toDateKey(p.createdAt) || "";

export function PaymentTimeline({ payments, calcRows = [], onReceipt }) {
  const s = useCopy(loanDetailsCopy);
  const labels = useCopy(loanLabelsCopy);
  const rowsById = new Map(calcRows.map((r) => [r.paymentId, r]));
  if (payments.length === 0) {
    return <Card><p className="text-[15px] font-medium text-ink-muted">{s.noPayments}</p></Card>;
  }
  return (
    <List>
      {payments.map((p) => {
        const byBorrower = p.type === "borrower_submitted";
        const statusKey = p.status || "legacy";
        const tone = statusKey === "pending_verification" ? "amber" : statusKey === "rejected" ? "rose" : "brand";
        const row = rowsById.get(p.id);
        const counted = countsAsPaid(p);
        return (
          <div key={p.id} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold text-ink">{paymentDateKey(p) || "—"}</p>
              <p className="mt-0.5 text-sm font-medium text-ink-muted">
                {[labels.methods[p.method] || p.method, byBorrower ? labels.recordedByBorrower : labels.recordedByLender].filter(Boolean).join(" · ")}
              </p>
              {row && <p className="mt-0.5 text-[13px] font-medium text-ink-muted">{s.split(formatPaise(row.toInterestPaise), formatPaise(row.toPrincipalPaise))}</p>}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge tone={tone}>{labels.paymentStatus[statusKey] || statusKey}</Badge>
                {p.paymentType === "interest_only" && <Badge>{labels.interestOnly}</Badge>}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className={`tabular text-[17px] font-extrabold ${counted ? "text-brand-700" : "text-ink-muted"}`}>
                {formatPaise(Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount) || 0)}
              </span>
              {counted && onReceipt && (
                <Button size="sm" variant="secondary" icon={Printer} onClick={() => onReceipt(p)} aria-label={s.receiptLabel}>{s.receipt}</Button>
              )}
            </div>
          </div>
        );
      })}
    </List>
  );
}

export function LoanDetails() {
  const { id } = useParams();
  const { loans, payments, borrowers } = useApp();
  const s = useCopy(loanDetailsCopy);
  const labels = useCopy(loanLabelsCopy);
  const f = useCopy(loanFormCopy);
  const e = useCopy(editLoanCopy);
  const loan = loans.find((item) => item.id === id);
  const calc = useLoanCalculation(loan, payments);

  if (!loan) {
    return (
      <Screen title={s.title} back>
        <EmptyState title={s.notFound} />
      </Screen>
    );
  }

  const borrower = borrowers.find((b) => b.id === loan.borrowerId);
  const name = borrowerName(borrower) || loan.borrowerName || labels.unknownBorrower;
  const ok = calc?.status === "ok";
  const statusBadge = !ok
    ? <Badge tone="amber">{s.needsCheck}</Badge>
    : calc.settled
      ? <Badge tone="brand">{s.settled}</Badge>
      : <Badge tone="brand">{labels.loanStatus[loan.status] || labels.loanStatus.active}</Badge>;

  const loanPayments = payments
    .filter((p) => p.loanId === loan.id)
    .sort((a, b) => (paymentDateKey(a) < paymentDateKey(b) ? 1 : -1));

  const printReceipt = (p) =>
    generateReceipt({
      paymentDate: paymentDateKey(p) || "—",
      borrowerName: name,
      principal: loan.principal,
      amountPaid: p.amount,
      method: labels.methods[p.method] || p.method
    });

  const history = Array.isArray(loan.termsHistory) ? [...loan.termsHistory].sort((a, b) => (a.changedAt < b.changedAt ? 1 : -1)) : [];
  const startDate = calc?.terms?.startDate || loan.loanDate;

  return (
    <Screen
      title={name}
      subtitle={statusBadge}
      back
      actions={<Avatar name={name} src={borrower?.photoUrl || undefined} />}
    >
      {ok && (
        <MoneyHero
          label={s.outstanding}
          value={formatPaise(calc.outstandingPaise)}
          caption={s.outstandingCaption(formatPaise(calc.principalPaise), startDate)}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" icon={ReceiptText} to={`/payments/new?loan=${loan.id}`} className="col-span-2">{s.recordPayment}</Button>
        <Button variant="secondary" icon={Pencil} to={`/loans/edit/${loan.id}`}>{s.edit}</Button>
        <Button variant="secondary" icon={User} to={`/borrowers/${loan.borrowerId}`}>{s.viewBorrower}</Button>
      </div>

      <LoanBreakdown loan={loan} payments={payments} />

      <Section title={s.timeline}>
        <PaymentTimeline payments={loanPayments} calcRows={ok ? calc.rows : []} onReceipt={printReceipt} />
      </Section>

      <Section title={s.details}>
        <Card>
          <DetailRow label={s.dueDate} value={loan.dueDate || s.notSet} />
          <DetailRow label={s.security} value={labels.security[loan.securityType] || loan.securityType || labels.security["Trust only"]} />
          {loan.guarantor?.name && <DetailRow label={s.guarantor} value={[loan.guarantor.name, loan.guarantor.mobile].filter(Boolean).join(" · ")} />}
          {loan.collateral?.type && <DetailRow label={s.collateral} value={loan.collateral.type} />}
          {loan.notes && (
            <div className="py-3">
              <p className="text-[15px] font-medium text-ink-soft">{s.notes}</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] font-semibold text-ink">{loan.notes}</p>
              <p className="mt-1 text-[13px] font-medium text-ink-muted">{s.notesHint}</p>
            </div>
          )}
        </Card>
      </Section>

      {history.length > 0 && (
        <Section title={s.history}>
          <div className="grid gap-3">
            {history.map((h, i) => (
              <Card key={`${h.changedAt}-${i}`} className="grid gap-3">
                <p className="text-[15px] font-bold text-ink">{s.changedOn(toDateKey(h.changedAt) || h.changedAt)}</p>
                <ChangeTable previous={h.previous || {}} next={h.next || {}} f={f} s={e} />
                {h.reason && <p className="text-[15px] font-medium text-ink-soft">{s.reason(h.reason)}</p>}
              </Card>
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}
