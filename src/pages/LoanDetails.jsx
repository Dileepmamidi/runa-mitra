import { useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarClock, CheckCircle2, Circle, Gem, Lock, Pencil, Printer, ReceiptText, ShieldCheck, Undo2, User } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { LoanBreakdown, useLoanCalculation } from "../components/LoanBreakdown";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { updateUserRecord } from "../services/firebaseService";
import { countsAsPaid, formatPaise, paiseToRupees, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { generateReceipt } from "../utils/receiptGenerator";
import { Avatar, Badge, Button, Card, DetailRow, EmptyState, List, ListRow, MoneyHero, Notice, Screen, Section } from "../ui";
import { loanFormCopy } from "./AddLoan.copy";
import { ReturnCollateralForm } from "./Collateral";
import { collateralCopy } from "./Collateral.copy";
import { ChangeTable } from "./EditLoan";
import { editLoanCopy } from "./EditLoan.copy";
import { loanDetailsCopy } from "./LoanDetails.copy";

const paymentDateKey = (p) => toDateKey(p.paymentDate) || toDateKey(p.createdAt) || "";
const paymentPaise = (p) => (Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount) || 0);

// History values shown as text (pauses are stored as lists of { from, to }).
function displayChange(values) {
  const out = {};
  for (const [key, value] of Object.entries(values || {})) {
    out[key] = Array.isArray(value)
      ? value.map((p) => `${toDateKey(p?.from) || "?"} → ${toDateKey(p?.to) || "?"}`).join(", ")
      : value;
  }
  return out;
}

function historyKind(h) {
  if (h.kind) return h.kind;
  const keys = Object.keys(h.next || {});
  return keys.length === 1 && keys[0] === "dueDate" ? "due_date" : "terms";
}

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
              {toDateKey(p.effectiveDate) && <p className="mt-0.5 text-[13px] font-semibold text-ink-soft">{s.historyFields.effectiveDate}: {toDateKey(p.effectiveDate)}</p>}
              {row && <p className="mt-0.5 text-[13px] font-medium text-ink-muted">{s.split(formatPaise(row.toInterestPaise), formatPaise(row.toPrincipalPaise))}</p>}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge tone={tone}>{labels.paymentStatus[statusKey] || statusKey}</Badge>
                {p.paymentType === "interest_only" && <Badge>{labels.interestOnly}</Badge>}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className={`tabular text-[17px] font-extrabold ${counted ? "text-brand-700" : "text-ink-muted"}`}>
                {formatPaise(paymentPaise(p))}
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

function loanPaymentsAll(payments, loanId) {
  return payments.filter((p) => p.loanId === loanId);
}

export function LoanDetails() {
  const { id } = useParams();
  const { user, language, loans, payments, borrowers, guarantors, collateral, refreshData } = useApp();
  const s = useCopy(loanDetailsCopy);
  const labels = useCopy(loanLabelsCopy);
  const f = useCopy(loanFormCopy);
  const e = useCopy(editLoanCopy);
  const cs = useCopy(collateralCopy);
  const [closeAsk, setCloseAsk] = useState(false);
  const [closing, setClosing] = useState(false);
  const [returning, setReturning] = useState(null);
  const [actionError, setActionError] = useState("");
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
      ? <Badge tone="brand">{loan.status === "closed" ? labels.loanStatus.closed : s.settled}</Badge>
      : <Badge tone="brand">{labels.loanStatus[loan.status] || labels.loanStatus.active}</Badge>;

  const loanPayments = payments
    .filter((p) => p.loanId === loan.id)
    .sort((a, b) => (paymentDateKey(a) < paymentDateKey(b) ? 1 : -1));

  const printReceipt = (p) =>
    generateReceipt({
      paymentDate: paymentDateKey(p) || "—",
      borrowerName: name,
      principal: loan.principal,
      amountPaid: paiseToRupees(paymentPaise(p)),
      method: labels.methods[p.method] || p.method,
      referenceId: p.id,
      recordedBy: p.type === "borrower_submitted" ? "borrower" : "lender",
      language
    });

  const lastPaidDate = ok && calc.rows.length ? calc.rows[calc.rows.length - 1].date : "";
  const printFinalReceipt = () =>
    generateReceipt({
      paymentDate: lastPaidDate || "—",
      borrowerName: name,
      principal: loan.principal,
      amountPaid: paiseToRupees(calc.totalPaidPaise),
      method: s.finalReceiptMethod,
      referenceId: loan.id,
      recordedBy: "lender",
      language
    });

  const closeLoan = async () => {
    if (!user) return;
    setActionError("");
    try {
      setClosing(true);
      await updateUserRecord(user.uid, "loans", loan.id, { status: "closed", closedAt: new Date().toISOString() });
      await refreshData();
      setCloseAsk(false);
    } catch (err) {
      console.error(err);
      setActionError(s.saveError);
    } finally {
      setClosing(false);
    }
  };

  const loanGuarantors = guarantors.filter((g) => g.loanId === loan.id);
  const loanCollateral = collateral.filter((c) => c.loanId === loan.id);
  const heldCollateral = loanCollateral.filter((c) => c.status !== "returned");
  const itemName = (c) => c.description || cs.types[c.type] || cs.types.other;
  const linked = Boolean(borrower?.linkedUid);
  const acks = Array.isArray(loan.acknowledgements) ? loan.acknowledgements : [];
  const ackFor = (h) => {
    const key = h.changeId || h.changedAt;
    return acks.find((a) => a?.kind === "change" && a.changeId === key);
  };
  const hs = { ...e, field: { ...e.field, ...s.historyFields } };
  const paymentById = new Map(loanPaymentsAll(payments, loan.id).map((p) => [p.id, p]));

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
        <Button variant="secondary" icon={CalendarClock} to={`/extensions/new?loan=${loan.id}`} className="col-span-2">{s.changeSchedule}</Button>
      </div>

      {ok && calc.settled && (
        <Section title={s.settleTitle}>
          <Card className="grid gap-3">
            <p className="text-[15px] font-medium text-ink-soft">{s.settleText}</p>
            {actionError && <Notice tone="error">{actionError}</Notice>}

            <div className="grid gap-2 rounded-xl bg-canvas p-3">
              {loan.status === "closed" ? (
                <p className="flex items-center gap-2 text-[15px] font-bold text-brand-700"><CheckCircle2 size={20} /> {s.closedOn(toDateKey(loan.closedAt) || "—")}</p>
              ) : closeAsk ? (
                <>
                  <p className="text-[15px] font-bold text-ink">{s.closeConfirm}</p>
                  <Button icon={Lock} onClick={closeLoan} loading={closing}>{closing ? s.closing : s.closeYes}</Button>
                  <Button variant="secondary" onClick={() => setCloseAsk(false)} disabled={closing}>{s.closeNo}</Button>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-[15px] font-bold text-ink"><Circle size={20} /> {s.stepClose}</p>
                  <Button icon={Lock} onClick={() => setCloseAsk(true)}>{s.stepClose}</Button>
                </>
              )}
            </div>

            {loanCollateral.map((c) => (
              <div key={c.id} className="grid gap-2 rounded-xl bg-canvas p-3">
                {c.status === "returned" ? (
                  <p className="flex items-center gap-2 text-[15px] font-bold text-brand-700"><CheckCircle2 size={20} /> {s.returnedOn(itemName(c), c.returnedAt || "—")}</p>
                ) : returning === c.id ? (
                  <ReturnCollateralForm item={c} onDone={() => setReturning(null)} onCancel={() => setReturning(null)} />
                ) : (
                  <>
                    <p className="flex items-center gap-2 text-[15px] font-bold text-ink"><Circle size={20} /> {s.stepReturn(itemName(c))}</p>
                    <Button icon={Undo2} onClick={() => setReturning(c.id)}>{cs.markReturned}</Button>
                  </>
                )}
              </div>
            ))}

            <div className="grid gap-2 rounded-xl bg-canvas p-3">
              <p className="text-[15px] font-bold text-ink">{s.stepReceipt}</p>
              <Button variant="secondary" icon={Printer} onClick={printFinalReceipt}>{s.finalReceipt}</Button>
            </div>
          </Card>
        </Section>
      )}

      <LoanBreakdown loan={loan} payments={payments} />

      <Section title={s.timeline}>
        <PaymentTimeline payments={loanPayments} calcRows={ok ? calc.rows : []} onReceipt={printReceipt} />
      </Section>

      <Section title={s.details}>
        <Card>
          <DetailRow label={s.dueDate} value={loan.dueDate || s.notSet} />
          <DetailRow label={s.security} value={labels.security[loan.securityType] || loan.securityType || labels.security["Trust only"]} />
          {loan.notes && (
            <div className="py-3">
              <p className="text-[15px] font-medium text-ink-soft">{s.notes}</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] font-semibold text-ink">{loan.notes}</p>
              <p className="mt-1 text-[13px] font-medium text-ink-muted">{s.notesHint}</p>
            </div>
          )}
        </Card>
      </Section>

      <Section title={s.guarantorsTitle} action={<Button size="sm" variant="ghost" to={`/guarantor?loan=${loan.id}`}>{s.manageGuarantors}</Button>}>
        {loanGuarantors.length === 0 && !loan.guarantor?.name ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.noGuarantors}</p></Card>
        ) : (
          <List>
            {loanGuarantors.map((g) => (
              <ListRow key={g.id} icon={ShieldCheck} title={g.name} subtitle={[g.relationship, g.mobile, s.notVerified].filter(Boolean).join(" · ")} to={`/guarantor?loan=${loan.id}`} />
            ))}
            {loan.guarantor?.name && (
              <ListRow icon={ShieldCheck} title={loan.guarantor.name} subtitle={[loan.guarantor.mobile, s.legacyNote, s.notVerified].filter(Boolean).join(" · ")} to={`/guarantor?loan=${loan.id}`} />
            )}
          </List>
        )}
      </Section>

      <Section title={s.collateralTitle} action={<Button size="sm" variant="ghost" to={`/collateral?loan=${loan.id}`}>{s.manageCollateral}</Button>}>
        {loanCollateral.length === 0 && !loan.collateral?.type ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.noCollateral}</p></Card>
        ) : (
          <List>
            {loanCollateral.map((c) => (
              <ListRow
                key={c.id}
                icon={Gem}
                title={itemName(c)}
                subtitle={cs.types[c.type] || cs.types.other}
                trailing={<Badge tone={c.status === "returned" ? "brand" : "amber"}>{s.collateralStatus[c.status === "returned" ? "returned" : "held"]}</Badge>}
                to={`/collateral?loan=${loan.id}`}
              />
            ))}
            {loan.collateral?.type && (
              <ListRow icon={Gem} title={loan.collateral.description || loan.collateral.type} subtitle={[loan.collateral.type, s.legacyNote].join(" · ")} to={`/collateral?loan=${loan.id}`} />
            )}
          </List>
        )}
      </Section>

      {history.length > 0 && (
        <Section title={s.history}>
          <div className="grid gap-3">
            {history.map((h, i) => {
              const ack = ackFor(h);
              const kind = historyKind(h);
              const pay = h.paymentId ? paymentById.get(h.paymentId) : null;
              const payAmount = Number.isInteger(h.paymentAmountPaise) ? h.paymentAmountPaise : pay ? paymentPaise(pay) : null;
              return (
                <Card key={`${h.changeId || h.changedAt}-${i}`} className="grid gap-3">
                  <div>
                    <p className="text-[15px] font-bold text-ink">{s.changedOn(toDateKey(h.changedAt) || h.changedAt)}</p>
                    <p className="text-[15px] font-semibold text-ink-soft">{s.kinds[kind] || s.kinds.terms}</p>
                    {kind === "same_cycle" && payAmount !== null && (
                      <p className="text-[13px] font-medium text-ink-muted">{s.paymentRef(formatPaise(payAmount), h.paymentDate || (pay ? paymentDateKey(pay) : "—"))}</p>
                    )}
                  </div>
                  <ChangeTable previous={displayChange(h.previous)} next={displayChange(h.next)} f={f} s={hs} />
                  {h.reason && <p className="text-[15px] font-medium text-ink-soft">{s.reason(h.reason)}</p>}
                  <div>
                    {ack ? (
                      <Badge tone="brand">{s.ackDone(toDateKey(ack.at) || "—")}</Badge>
                    ) : linked ? (
                      <Badge tone="amber">{s.ackWaiting}</Badge>
                    ) : (
                      <Badge>{s.ackNotOnApp}</Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}
    </Screen>
  );
}
