import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Banknote, Camera, Landmark, Send, Smartphone, Wallet } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { addUserRecord, uploadEvidence } from "../../services/firebaseService";
import { formatPaise } from "../../utils/interestEngine";
import { Button, Card, EmptyState, Field, FilePicker, Input, Notice, Screen, Select } from "../../ui";
import { openLoans, principalPaiseOf, loanStartKey, useBorrowerLoans } from "./borrowerData";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerMakePaymentCopy } from "./BorrowerMakePayment.copy";

const MAX_BYTES = 15 * 1024 * 1024;
const METHODS = [
  { value: "UPI", icon: Smartphone },
  { value: "Bank Transfer", icon: Landmark },
  { value: "Cash", icon: Banknote }
];

export function BorrowerMakePayment() {
  const [searchParams] = useSearchParams();
  const { user, refreshData } = useApp();
  const navigate = useNavigate();
  const s = useCopy(borrowerMakePaymentCopy);
  const sh = useCopy(borrowerSharedCopy);

  const activeItems = openLoans(useBorrowerLoans());
  const initialLoanId = searchParams.get("loanId") || (activeItems.length === 1 ? activeItems[0].loan.id : "");

  const [chosenLoanId, setLoanId] = useState("");
  const loanId = chosenLoanId || initialLoanId;
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceId, setReferenceId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selected = activeItems.find((x) => x.loan.id === loanId);
  const selectedLoan = selected?.loan;

  const pickFile = (file) => {
    setError("");
    if (file && !file.type.startsWith("image/")) { setScreenshotFile(null); return setError(s.errImage); }
    if (file && file.size >= MAX_BYTES) { setScreenshotFile(null); return setError(sh.fileTooBig); }
    setScreenshotFile(file);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!selectedLoan) return setError(s.errLoan);
    if (!amount || Number(amount) <= 0) return setError(s.errAmount);
    // Cash handed over has no reference number; proof stays optional for it.
    if (paymentMethod !== "Cash" && !referenceId.trim() && !screenshotFile) return setError(s.errProof);

    try {
      setLoading(true);
      let screenshotUrl = "";
      if (screenshotFile) {
        screenshotUrl = await uploadEvidence(selectedLoan.lenderUid, screenshotFile, ["payments", selectedLoan._borrowerId]);
      }

      const paymentData = {
        borrowerId: selectedLoan._borrowerId,
        borrowerUid: user.uid,
        loanId,
        amount: Number(amount),
        method: paymentMethod,
        referenceId,
        screenshotUrl,
        paymentDate: new Date().toISOString().split("T")[0],
        status: "pending_verification", // the lender must approve it first
        createdAt: new Date(),
        type: "borrower_submitted"
      };

      // Saved in the lender's payments; the balance changes only after approval.
      await addUserRecord(selectedLoan.lenderUid, "payments", paymentData);

      setSuccess(s.success);
      await refreshData();
      setTimeout(() => navigate("/payments"), 2000);
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(sh.sendError);
    } finally {
      setLoading(false);
    }
  };

  if (activeItems.length === 0) {
    return (
      <Screen title={s.title} back>
        <EmptyState icon={Wallet} title={s.noLoansTitle} text={s.noLoansText} />
      </Screen>
    );
  }

  return (
    <Screen title={s.title} subtitle={s.subtitle} back>
      <Notice tone="info" title={s.howItWorks}>{s.howItWorksText}</Notice>

      <Card>
        <div className="grid gap-5">
          {activeItems.length > 1 || !selectedLoan ? (
            <Field label={sh.chooseLoan}>
              <Select value={loanId} onChange={(e) => setLoanId(e.target.value)}>
                <option value="">{sh.chooseLoanPlaceholder}</option>
                {activeItems.map(({ loan }) => (
                  <option key={`${loan.lenderUid}_${loan.id}`} value={loan.id}>
                    {sh.loanOption(loan.lenderName, principalPaiseOf(loan) ? formatPaise(principalPaiseOf(loan)) : "", loanStartKey(loan) ? sh.date(loanStartKey(loan)) : "")}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <p className="text-[17px] font-bold text-ink">{sh.loanFrom(selectedLoan.lenderName)}</p>
          )}
          {selected?.calc.status === "ok" && (
            <p className="-mt-2 text-[15px] font-semibold text-ink-soft">{s.owes(formatPaise(selected.calc.outstandingPaise))}</p>
          )}

          <Field label={s.amount}>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={s.amountPlaceholder}
              className="tabular min-h-[64px] text-[26px] font-extrabold"
            />
          </Field>

          <div>
            <p className="mb-1.5 text-[15px] font-bold text-ink">{s.method}</p>
            <div className="grid gap-2">
              {METHODS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  aria-pressed={paymentMethod === value}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left text-[16px] font-bold transition ${
                    paymentMethod === value ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-200" : "border-line bg-white text-ink"
                  }`}
                >
                  <Icon size={22} className="shrink-0" />
                  {s.methods[value]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-[17px] font-bold text-ink">{s.proof}</p>
        <p className="mt-1 text-[14px] font-medium text-ink-muted">{paymentMethod === "Cash" ? s.proofHintCash : s.proofHint}</p>
        <div className="mt-4 grid gap-4">
          {paymentMethod !== "Cash" && (
            <Field label={s.reference}>
              <Input value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder={s.referencePlaceholder} inputMode="text" />
            </Field>
          )}
          <FilePicker
            label={s.screenshot}
            accept="image/*"
            file={screenshotFile}
            onChange={pickFile}
            icon={Camera}
            placeholder={s.screenshotPlaceholder}
          />
        </div>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      <Button size="lg" block icon={Send} loading={loading} disabled={loading || Boolean(success)} onClick={handleSubmit}>
        {loading ? s.sending : s.submit}
      </Button>
    </Screen>
  );
}
