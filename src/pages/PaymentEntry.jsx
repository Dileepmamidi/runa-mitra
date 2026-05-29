import { useState } from "react";
import { MessageCircle, ReceiptText } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { currency } from "../utils/loanMath";
import { useApp } from "../context/AppContext";
import { addUserRecord, updateUserRecord } from "../services/firebaseService";

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
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .receipt { border: 2px dashed #ccc; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { font-size: 24px; font-weight: bold; text-align: center; margin-top: 20px; color: #166534; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>Runa Mitra Receipt</h2>
              <p>Date: ${paymentDate}</p>
            </div>
            <div class="row"><span>Borrower:</span> <strong>${selectedBorrower.name}</strong></div>
            <div class="row"><span>Loan Principal:</span> <strong>₹${selectedLoan.principal}</strong></div>
            <div class="row"><span>Method:</span> <strong>${method}</strong></div>
            <div class="total">Amount Paid: ₹${amount}</div>
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">Thank you for your payment!</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
