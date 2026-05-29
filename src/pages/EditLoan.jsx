import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormControls";
import { useApp } from "../context/AppContext";
import { buildMonthlyBreakdown, currency, getTotalPayable } from "../utils/loanMath";
import { updateUserRecord } from "../services/firebaseService";

export function EditLoan() {
  const { id } = useParams();
  const { user, borrowers, loans, refreshData } = useApp();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [borrowerId, setBorrowerId] = useState("");
  const [securityType, setSecurityType] = useState("Trust only");
  const [principal, setPrincipal] = useState(0);
  const [rate, setRate] = useState(0);
  const [interestType, setInterestType] = useState("Simple");
  const [cycle, setCycle] = useState("monthly");
  const [loanDate, setLoanDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const loan = loans.find(l => l.id === id);
    if (loan) {
      setBorrowerId(loan.borrowerId || "");
      setSecurityType(loan.securityType || "Trust only");
      setPrincipal(loan.principal || 0);
      setRate(loan.interestRate || 0);
      setInterestType(loan.interestType || "Simple");
      setCycle(loan.cycle || "monthly");
      setLoanDate(loan.loanDate || "");
      setDueDate(loan.dueDate || "");
      setNotes(loan.notes || "");
      setBalance(loan.balance || loan.principal || 0);
    }
  }, [id, loans]);

  const total = getTotalPayable({ principal, interestRate: rate, interestType, months: 6, cycle });
  const breakdown = useMemo(
    () => buildMonthlyBreakdown({ principal, interestRate: rate, interestType, months: 6, cycle }),
    [cycle, interestType, principal, rate]
  );

  const handleSave = async () => {
    setError("");
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    
    // Check if borrower exists
    const b = borrowers.find(x => x.id === borrowerId);
    if (!b) return setError("Borrower not found.");

    try {
      setLoading(true);
      
      const updates = {
        borrowerId,
        borrowerName: b.name,
        principal,
        balance, // Allow them to manually adjust balance if they changed principal
        interestRate: rate,
        interestType,
        cycle,
        loanDate,
        dueDate,
        securityType,
        notes,
        updatedAt: new Date()
      };

      await updateUserRecord(user.uid, "loans", id, updates);
      
      await refreshData();
      navigate(`/loans/${id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to update loan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">అప్పు సవరించండి (Edit Loan)</h1>
      <p className="mt-1 text-sm font-semibold text-slate-500">Update loan terms or recalculate details.</p>
      
      {error && (
        <div className="mt-4 rounded-[6px] bg-red-50 p-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <SectionTitle title="Loan Details" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Borrower">
              <SelectInput value={borrowerId} onChange={e => setBorrowerId(e.target.value)} disabled>
                {borrowers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Principal amount"><TextInput type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} /></Field>
            <Field label="Current Balance"><TextInput type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} /></Field>
            <Field label="Loan date"><TextInput type="date" value={loanDate} onChange={(e) => setLoanDate(e.target.value)} /></Field>
            <Field label="Interest rate (% per month)"><TextInput type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></Field>
            <Field label="Interest type">
              <SelectInput value={interestType} onChange={(e) => setInterestType(e.target.value)}><option>Simple</option><option>Compound</option></SelectInput>
            </Field>
            <Field label="Interest cycle">
              <SelectInput value={cycle} onChange={(e) => setCycle(e.target.value)}><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option></SelectInput>
            </Field>
            <Field label="Security type">
              <SelectInput value={securityType} onChange={(e) => setSecurityType(e.target.value)}>
                <option>Trust only</option><option>Guarantor</option><option>Gold/Documents</option>
              </SelectInput>
            </Field>
            <Field label="Due date"><TextInput type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
          </div>

          <div className="mt-5 grid gap-4">
            <Field label="Notes"><TextArea placeholder="Private lender note" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
            <div className="flex gap-2">
              <ActionButton variant="secondary" className="flex-1" onClick={() => navigate(-1)}>Cancel</ActionButton>
              <ActionButton className="flex-1" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</ActionButton>
            </div>
          </div>
        </Card>

        <div className="grid content-start gap-4">
          <Card className="bg-slate-900 text-white">
            <p className="text-sm font-bold text-slate-400">Total payable (6m estimate)</p>
            <p className="mt-1 text-3xl font-black">{currency(total)}</p>
            <div className="mt-4 rounded-[6px] bg-slate-800 p-3 text-sm">
              <p className="flex justify-between py-1 text-slate-300"><span>Principal</span> <b>{currency(principal)}</b></p>
              <p className="flex justify-between py-1 text-slate-300"><span>Est. Interest</span> <b>{currency(total - principal)}</b></p>
            </div>
          </Card>
          
          <Card>
            <SectionTitle title="Calculation Preview" />
            <div className="mt-2 text-sm">
              {breakdown.map((r, i) => (
                <div key={i} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-bold text-slate-950">{currency(r.total)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
