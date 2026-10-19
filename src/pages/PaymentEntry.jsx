import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Printer, Save } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { issueText } from "../components/LoanBreakdown";
import { loanBreakdownCopy, loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { recordLenderPayment } from "../services/firebaseService";
import { calculateLoan, formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { generateReceipt } from "../utils/receiptGenerator";
import { BottomAction, Button, Card, DetailRow, Field, Input, Notice, Screen, Section, Segmented, Select } from "../ui";
import { paymentEntryCopy } from "./PaymentEntry.copy";

const METHODS = ["Cash", "UPI", "Bank transfer"];
const PREVIEW_ID = "__new_payment__";

export function PaymentEntry() {
  const { user, borrowers, loans, payments, refreshData } = useApp();
  const s = useCopy(paymentEntryCopy);
  const labels = useCopy(loanLabelsCopy);
  const lb = useCopy(loanBreakdownCopy);
  const [params] = useSearchParams();
  const today = toDateKey(new Date());

  const initialLoan = loans.find((l) => l.id === params.get("loan"));
  const [borrowerId, setBorrowerId] = useState(initialLoan?.borrowerId || params.get("borrower") || "");
  const [loanId, setLoanId] = useState(initialLoan?.id || "");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [method, setMethod] = useState("Cash");
  const [paymentType, setPaymentType] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [confirming]);

  const selectedBorrower = borrowers.find((b) => b.id === borrowerId);

  // Open loans for the borrower: not settled by the engine, or terms unclear.
  const borrowerLoans = useMemo(() => {
    return loans
      .filter((l) => l.borrowerId === borrowerId)
      .map((loan) => ({ loan, calc: calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), today) }))
      .filter(({ loan, calc }) => calc.status !== "ok" || !calc.settled || loan.id === loanId);
  }, [loans, payments, borrowerId, loanId, today]);

  // Pick the only open loan automatically.
  useEffect(() => {
    if (!loanId && borrowerLoans.length === 1) setLoanId(borrowerLoans[0].loan.id);
  }, [borrowerLoans, loanId]);

  const selected = borrowerLoans.find((x) => x.loan.id === loanId);
  const selectedLoan = selected?.loan;

  const amountPaise = rupeesToPaise(amount);
  const amountValid = amount !== "" && Number.isInteger(amountPaise) && amountPaise > 0 && Math.abs(Number(amount) * 100 - amountPaise) < 1e-6;
  const dateKey = toDateKey(paymentDate);

  // Split preview from the interest engine with this payment added.
  const preview = useMemo(() => {
    if (!selectedLoan || !amountValid || !dateKey || dateKey > today) return null;
    const loanPayments = payments.filter((p) => p.loanId === selectedLoan.id);
    const before = calculateLoan(selectedLoan, loanPayments, dateKey);
    if (before.status !== "ok") return { ok: false, issues: before.issues };
    const synthetic = {
      id: PREVIEW_ID,
      amount: amountPaise / 100,
      amountPaise,
      paymentDate: dateKey,
      method,
      status: "verified",
      type: "lender_recorded",
      ...(paymentType === "interest_only" ? { paymentType: "interest_only" } : {})
    };
    const after = calculateLoan(selectedLoan, [...loanPayments, synthetic], today);
    if (after.status !== "ok") return { ok: false, issues: after.issues };
    const row = after.rows.find((r) => r.paymentId === PREVIEW_ID);
    if (!row) return null;
    return {
      ok: true,
      owedBefore: before.outstandingPaise,
      toInterest: row.toInterestPaise,
      toPrincipal: row.toPrincipalPaise,
      excess: row.excessPaise,
      owedAfter: after.outstandingPaise,
      interestOnlyExtra: paymentType === "interest_only" && row.toPrincipalPaise > 0
    };
  }, [selectedLoan, amountValid, amountPaise, dateKey, today, payments, method, paymentType]);

  const reset = () => {
    setSaved(null);
    setAmount("");
    setPaymentType("normal");
    setConfirming(false);
    setError("");
  };

  const touch = (fn) => (e) => {
    setConfirming(false);
    fn(e?.target ? e.target.value : e);
  };

  const review = () => {
    setError("");
    if (!user) return setError(s.errLogin);
    if (!borrowerId) return setError(s.errBorrower);
    if (!loanId || !selectedLoan) return setError(s.errLoan);
    if (!amountValid) return setError(s.errAmount);
    if (!dateKey) return setError(s.errDate);
    if (dateKey > today) return setError(s.errFuture);
    setConfirming(true);
  };

  const handleSave = async () => {
    setError("");
    try {
      setLoading(true);
      const paymentData = {
        borrowerId,
        loanId,
        amount: amountPaise / 100,
        method,
        paymentDate: dateKey,
        status: "verified", // the lender is recording money they received
        type: "lender_recorded",
        ...(paymentType === "interest_only" ? { paymentType: "interest_only" } : {})
      };
      // Saves the payment and updates the loan atomically.
      await recordLenderPayment(user.uid, loanId, paymentData);
      setSaved({ ...paymentData, borrowerName: borrowerName(selectedBorrower), principal: selectedLoan.principal });
      setConfirming(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError(s.saveError);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const methodLabel = (m) => labels.methods[m] || m;
  const typeLabel = paymentType === "interest_only" ? s.interestOnly : s.normal;

  if (saved) {
    return (
      <Screen title={s.title} back>
        <Notice tone="success" title={s.savedTitle}>
          <p>{s.savedText(formatPaise(rupeesToPaise(saved.amount)), saved.borrowerName)}</p>
          <p className="mt-1">{s.recordedByYou}</p>
        </Notice>
        <Button
          size="lg"
          variant="secondary"
          icon={Printer}
          onClick={() =>
            generateReceipt({
              paymentDate: saved.paymentDate,
              borrowerName: saved.borrowerName,
              principal: saved.principal,
              amountPaid: saved.amount,
              method: methodLabel(saved.method)
            })
          }
        >
          {s.printReceipt}
        </Button>
        <Button size="lg" variant="secondary" to={`/loans/${saved.loanId}`}>{s.seeLoan}</Button>
        <Button size="lg" onClick={reset}>{s.another}</Button>
      </Screen>
    );
  }

  return (
    <Screen title={s.title} subtitle={s.subtitle} back>
      <Card className="grid gap-4">
        <Field label={s.borrower}>
          <Select value={borrowerId} onChange={touch((v) => { setBorrowerId(v); setLoanId(""); })}>
            <option value="">{s.chooseBorrower}</option>
            {borrowers.map((b) => <option key={b.id} value={b.id}>{borrowerName(b)}{b.village ? ` · ${b.village}` : ""}</option>)}
          </Select>
        </Field>

        {borrowerId && (
          borrowerLoans.length === 0 ? (
            <Notice tone="info">{s.noLoans}</Notice>
          ) : (
            <Field label={s.loan}>
              <Select value={loanId} onChange={touch(setLoanId)}>
                <option value="">{s.chooseLoan}</option>
                {borrowerLoans.map(({ loan, calc }) => {
                  const principal = formatPaise(rupeesToPaise(loan.principal) || 0);
                  const date = calc.terms?.startDate || loan.loanDate || "—";
                  return (
                    <option key={loan.id} value={loan.id}>
                      {calc.status === "ok" ? s.loanOption(principal, date, loan.dueDate) : s.loanOptionUnclear(principal, date)}
                    </option>
                  );
                })}
              </Select>
            </Field>
          )
        )}

        <Field label={s.amount}>
          <Input type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={touch(setAmount)} />
        </Field>
        <Field label={s.date}>
          <Input type="date" max={today} value={paymentDate} onChange={touch(setPaymentDate)} />
        </Field>
        <div>
          <p className="mb-1.5 text-[15px] font-bold text-ink">{s.method}</p>
          <Segmented value={method} onChange={touch(setMethod)} options={METHODS.map((m) => ({ value: m, label: methodLabel(m) }))} />
        </div>
        <div>
          <p className="mb-1.5 text-[15px] font-bold text-ink">{s.type}</p>
          <Segmented
            value={paymentType}
            onChange={touch(setPaymentType)}
            options={[{ value: "normal", label: s.normal }, { value: "interest_only", label: s.interestOnly }]}
          />
          <p className="mt-1.5 text-[13px] font-medium text-ink-muted">{s.typeHelp}</p>
        </div>
      </Card>

      {selectedLoan && (
        <Section title={s.preview}>
          {!amountValid ? (
            <Card><p className="text-[15px] font-medium text-ink-muted">{s.previewNeedAmount}</p></Card>
          ) : preview?.ok ? (
            <Card>
              <DetailRow label={s.owedBefore} value={formatPaise(preview.owedBefore)} />
              <DetailRow label={s.toInterest} value={formatPaise(preview.toInterest)} />
              <DetailRow label={s.toPrincipal} value={formatPaise(preview.toPrincipal)} />
              <DetailRow label={s.owedAfter} value={formatPaise(preview.owedAfter)} strong />
              {preview.excess > 0 && <div className="mt-3"><Notice tone="warning">{s.extra(formatPaise(preview.excess))}</Notice></div>}
              {preview.interestOnlyExtra && <div className="mt-3"><Notice tone="info">{s.interestOnlyExtra}</Notice></div>}
            </Card>
          ) : preview && !preview.ok ? (
            <Notice tone="warning">
              <p>{s.previewUnclear}</p>
              <ul className="mt-2 list-disc pl-5">
                {[...new Set(preview.issues.map((i) => issueText(lb, i)))].map((i) => <li key={i}>{i}</li>)}
              </ul>
            </Notice>
          ) : null}
        </Section>
      )}

      <Notice tone="info">{s.recordedByYou}</Notice>

      {error && <Notice tone="error">{error}</Notice>}

      {confirming && (
        <div ref={confirmRef}>
          <Card className="grid gap-1 border-2 border-brand-500">
            <p className="mb-1 text-[17px] font-extrabold text-ink">{s.confirmTitle}</p>
            <DetailRow label={s.confirmBorrower} value={borrowerName(selectedBorrower)} />
            <DetailRow label={s.confirmAmount} value={formatPaise(amountPaise)} strong />
            <DetailRow label={s.confirmDate} value={dateKey} />
            <DetailRow label={s.confirmMethod} value={methodLabel(method)} />
            <DetailRow label={s.confirmType} value={typeLabel} />
            <div className="mt-3 grid gap-2">
              <Button size="lg" icon={Save} onClick={handleSave} loading={loading}>{loading ? s.saving : s.confirmYes}</Button>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>{s.confirmNo}</Button>
            </div>
          </Card>
        </div>
      )}

      {!confirming && (
        <BottomAction>
          <Button size="lg" block icon={CheckCircle2} onClick={review}>{s.review}</Button>
        </BottomAction>
      )}
    </Screen>
  );
}
