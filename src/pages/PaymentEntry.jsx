import { useState } from "react";
import { MessageCircle, ReceiptText } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { currency } from "../utils/loanMath";
import { useApp } from "../context/AppContext";
import { addUserRecord, updateUserRecord } from "../services/firebaseService";
import { generateReceipt } from "../utils/receiptGenerator";

export function PaymentEntry() {
  const { user, borrowers, loans, refreshData } = useApp();
  
  const [borrowerId, setBorrowerId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  
  const selectedBorrower = borrowers.find(b => b.id === borrowerId);
  const borrowerLoans = loans.filter(l => l.borrowerId === borrowerId && l.balance > 0);
  const selectedLoan = borrowerLoans.find(l => l.id === loanId);
  
  const handleSave = async () => {
    if (!user || !borrowerId || !loanId || !amount || Number(amount) <= 0) return;
    
    try {
      setLoading(true);
      const paymentData = {
        borrowerId,
        loanId,
        amount: Number(amount),
        method,
        paymentDate,
        status: "verified", // Lender is entering it directly, so it's verified
        createdAt: new Date(),
        type: "lender_recorded"
      };

      await addUserRecord(user.uid, "payments", paymentData);
      
      if (selectedLoan) {
        const newBalance = Math.max(0, selectedLoan.balance - Number(amount));
        await updateUserRecord(user.uid, "loans", selectedLoan.id, { balance: newBalance });
      }
      
      setSuccess("Payment saved successfully!");
      await refreshData();
      
      setAmount("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save payment.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!selectedBorrower || !selectedLoan || !amount) return;
    generateReceipt({
      paymentDate,
      borrowerName: selectedBorrower.name,
      principal: selectedLoan.principal,
      amountPaid: amount,
      method
    });
  };

  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">చెల్లింపు నమోదు (Record Payment)</h1>
      <Card className="mt-4">
        {success && <div className="mb-4 rounded-[8px] bg-leaf-50 p-3 font-bold text-leaf-700">{success}</div>}
        
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Select Borrower">
            <SelectInput value={borrowerId} onChange={e => { setBorrowerId(e.target.value); setLoanId(""); }}>
              <option value="">Select Borrower</option>
              {borrowers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </SelectInput>
          </Field>
          
          <Field label="Select Loan">
            <SelectInput value={loanId} onChange={e => setLoanId(e.target.value)} disabled={!borrowerId}>
              <option value="">Select Loan</option>
              {borrowerLoans.map(l => <option key={l.id} value={l.id}>Bal: ₹{l.balance} (Prin: ₹{l.principal})</option>)}
            </SelectInput>
          </Field>
          
          <Field label="Amount Paid">
            <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          
          <Field label="Payment Date">
            <TextInput type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
          </Field>
          
          <Field label="Method">
            <SelectInput value={method} onChange={e => setMethod(e.target.value)}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank transfer</option>
            </SelectInput>
          </Field>
        </div>
        
        {selectedLoan && amount && (
          <div className="mt-5 rounded-[8px] bg-leaf-50 p-4">
            <p className="text-sm font-bold text-slate-500">Updated balance preview</p>
            <p className="mt-1 text-3xl font-black text-leaf-700">
              {currency(Math.max(0, selectedLoan.balance - Number(amount)))}
            </p>
          </div>
        )}
        
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ActionButton onClick={handleSave} disabled={loading || !loanId || !amount}>
            {loading ? "Saving..." : "Save Payment"}
          </ActionButton>
          <ActionButton variant="secondary" onClick={handlePrintReceipt} disabled={!loanId || !amount}>
            <ReceiptText size={18} /> Print Receipt
          </ActionButton>
        </div>
      </Card>
    </div>
  );
}
