import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, QrCode, Upload, Receipt, ArrowLeft } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { currency } from "../../utils/loanMath";
import { Card, SectionTitle } from "../../components/Card";
import { Field, SelectInput, TextInput, TextArea } from "../../components/FormControls";
import { ActionButton } from "../../components/ActionButton";
import { addUserRecord, uploadEvidence } from "../../services/firebaseService";

export function BorrowerMakePayment() {
  const [searchParams] = useSearchParams();
  const initialLoanId = searchParams.get("loanId") || "";
  
  const { user, borrowerLink, loans, refreshData } = useApp();
  const navigate = useNavigate();

  const [loanId, setLoanId] = useState(initialLoanId);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceId, setReferenceId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeLoans = loans.filter(l => l.balance > 0);
  const selectedLoan = loans.find(l => l.id === loanId);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!loanId) return setError("Please select a loan.");
    if (!amount || Number(amount) <= 0) return setError("Please enter a valid amount.");
    if (!referenceId && !screenshotFile) return setError("Please provide a UPI reference ID or a screenshot of your payment.");
    
    try {
      setLoading(true);
      let screenshotUrl = "";
      
      if (screenshotFile) {
        screenshotUrl = await uploadEvidence(borrowerLink.lenderUid, screenshotFile, ["payments", borrowerLink.borrowerId]);
      }
      
      const paymentData = {
        borrowerId: borrowerLink.borrowerId,
        loanId,
        amount: Number(amount),
        method: paymentMethod,
        referenceId,
        screenshotUrl,
        paymentDate: new Date().toISOString().split("T")[0],
        status: "pending_verification", // Lender needs to approve this
        createdAt: new Date(),
        type: "borrower_submitted"
      };

      // Save to lender's payments collection
      await addUserRecord(borrowerLink.lenderUid, "payments", paymentData);
      
      // We do NOT instantly deduct the balance here. 
      // The lender must verify and approve it on their dashboard first.
      
      setSuccess("Payment details submitted! Awaiting lender confirmation.");
      await refreshData();
      setTimeout(() => navigate("/payments"), 2000);
      
    } catch (err) {
      console.error(err);
      setError("Failed to submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-black text-slate-950">చెల్లింపు (Make Payment)</h2>
      </div>
      
      {error && <div className="mb-4 rounded-[8px] bg-red-50 p-4 font-bold text-red-600">{error}</div>}
      {success && <div className="mb-4 rounded-[8px] bg-leaf-50 p-4 font-bold text-leaf-700">{success}</div>}

      <Card className="mb-4 bg-slate-800 text-white border-0 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400">Total Pending Balance</p>
            <p className="mt-1 text-3xl font-black text-white">
              {currency(activeLoans.reduce((sum, l) => sum + l.balance, 0))}
            </p>
          </div>
          <CreditCard size={32} className="text-slate-400 opacity-50" />
        </div>
      </Card>

      <Card>
        <SectionTitle title="Payment Details" />
        
        <div className="mt-4 grid gap-4">
          <Field label="Select Loan">
            <SelectInput value={loanId} onChange={e => setLoanId(e.target.value)}>
              <option value="">Select a loan</option>
              {activeLoans.map(l => (
                <option key={l.id} value={l.id}>Principal: ₹{l.principal} (Pending: ₹{l.balance})</option>
              ))}
            </SelectInput>
          </Field>
          
          <Field label="Amount you paid (₹)">
            <TextInput 
              type="number"
              inputMode="numeric"
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              placeholder="e.g. 5000"
            />
          </Field>
          
          <Field label="Payment Method">
            <SelectInput value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cash">Cash (Handed directly)</option>
            </SelectInput>
          </Field>
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle title="Verification (Proof of Payment)" />
        <p className="mt-1 text-sm font-semibold text-slate-500 mb-4">
          If you paid via UPI or Bank, please upload a screenshot or enter the reference number so the lender can verify.
        </p>

        <div className="grid gap-4">
          <Field label="Transaction ID / UPI Ref">
            <TextInput 
              value={referenceId} 
              onChange={e => setReferenceId(e.target.value)} 
              placeholder="e.g. 314159265358"
            />
          </Field>

          <Field label="Upload Screenshot (Camera / Gallery)">
            <TextInput 
              type="file" 
              accept="image/*"
              onChange={e => setScreenshotFile(e.target.files[0])} 
            />
          </Field>
        </div>
        
        <ActionButton onClick={handleSubmit} disabled={loading || !loanId || !amount} className="mt-6 w-full h-14 text-lg">
          {loading ? "Submitting..." : "Submit Payment Record"}
        </ActionButton>
      </Card>
      
      {/* Future UPI Placeholder */}
      <div className="mt-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Future Ready Architecture</p>
        <button disabled className="mx-auto flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 font-bold text-slate-400">
          <QrCode size={18} /> Direct UPI Integration Pending
        </button>
      </div>
    </div>
  );
}
