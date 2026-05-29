import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormControls";
import { useApp } from "../context/AppContext";
import { buildMonthlyBreakdown, currency, getTotalPayable } from "../utils/loanMath";
import { addUserRecord, uploadEvidence } from "../services/firebaseService";

export function AddLoan() {
  const { user, borrowers, refreshData } = useApp();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [borrowerId, setBorrowerId] = useState(borrowers[0]?.id || "");
  const [securityType, setSecurityType] = useState("Trust only");
  const [principal, setPrincipal] = useState(50000);
  const [rate, setRate] = useState(24);
  const [interestType, setInterestType] = useState("Simple");
  const [cycle, setCycle] = useState("monthly");
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Security details
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorMobile, setGuarantorMobile] = useState("");
  const [guarantorFile, setGuarantorFile] = useState(null);

  const [collateralType, setCollateralType] = useState("");
  const [collateralValue, setCollateralValue] = useState("");
  const [collateralDesc, setCollateralDesc] = useState("");
  const [collateralFile, setCollateralFile] = useState(null);

  // Attachments
  const [voiceFile, setVoiceFile] = useState(null);
  const [noteFile, setNoteFile] = useState(null);
  const [signFile, setSignFile] = useState(null);

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
    if (!borrowerId) {
      setError("Please select a borrower. If list is empty, add a borrower first.");
      return;
    }

    try {
      setLoading(true);
      
      // Upload any attachments if present
      let gSignUrl = "", cPhotoUrl = "", voiceUrl = "", noteUrl = "", signUrl = "";
      
      if (securityType === "Guarantor" && guarantorFile) gSignUrl = await uploadEvidence(user.uid, guarantorFile);
      if (securityType === "Gold/Documents" && collateralFile) cPhotoUrl = await uploadEvidence(user.uid, collateralFile);
      
      if (voiceFile) voiceUrl = await uploadEvidence(user.uid, voiceFile);
      if (noteFile) noteUrl = await uploadEvidence(user.uid, noteFile);
      if (signFile) signUrl = await uploadEvidence(user.uid, signFile);

      // Construct loan object
      const loanData = {
        borrowerId,
        principal,
        interestRate: rate,
        interestType,
        cycle,
        loanDate,
        dueDate,
        securityType,
        notes,
        status: "active",
        balance: principal, // Initially, full principal is owed
        createdAt: new Date(),
        attachments: {
          voiceUrl,
          noteUrl,
          signUrl,
        }
      };

      if (securityType === "Guarantor") {
        loanData.guarantor = { name: guarantorName, mobile: guarantorMobile, signatureUrl: gSignUrl };
      } else if (securityType === "Gold/Documents") {
        loanData.collateral = { type: collateralType, value: collateralValue, description: collateralDesc, photoUrl: cPhotoUrl };
      }

      // Save to Firestore
      await addUserRecord(user.uid, "loans", loanData);

      // Update borrower pending amount (simplistic logic)
      const selectedBorrower = borrowers.find(b => b.id === borrowerId);
      if (selectedBorrower) {
        // Here we could update the borrower's total pending, 
        // but for now relying on loan balance is enough.
      }

      await refreshData();
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Failed to save loan. Please check internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">కొత్త రుణం</h1>
      <p className="mt-1 text-sm font-semibold text-slate-500">Trust-only lending is default. Guarantor and security are optional.</p>
      
      {error && (
        <div className="mt-4 rounded-[6px] bg-red-50 p-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <SectionTitle title="Loan Details" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Select borrower">
              <SelectInput value={borrowerId} onChange={e => setBorrowerId(e.target.value)}>
                {borrowers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Loan amount"><TextInput type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} /></Field>
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

          {securityType === "Guarantor" && (
            <div className="mt-5 rounded-[8px] bg-leaf-50 p-4">
              <SectionTitle title="Guarantor Form" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name"><TextInput value={guarantorName} onChange={e => setGuarantorName(e.target.value)} /></Field>
                <Field label="Mobile"><TextInput inputMode="numeric" value={guarantorMobile} onChange={e => setGuarantorMobile(e.target.value)} /></Field>
                <Field label="Signature Photo"><TextInput type="file" accept="image/*" capture="environment" onChange={e => setGuarantorFile(e.target.files[0])} /></Field>
              </div>
            </div>
          )}

          {securityType === "Gold/Documents" && (
            <div className="mt-5 rounded-[8px] bg-marigold-100 p-4">
              <SectionTitle title="Security submitted by borrower" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Type"><TextInput placeholder="Gold, document, vehicle paper" value={collateralType} onChange={e => setCollateralType(e.target.value)} /></Field>
                <Field label="Estimated value"><TextInput type="number" value={collateralValue} onChange={e => setCollateralValue(e.target.value)} /></Field>
                <Field label="Description"><TextArea value={collateralDesc} onChange={e => setCollateralDesc(e.target.value)} /></Field>
                <Field label="Scan Document (Camera)"><TextInput type="file" accept="image/*" capture="environment" onChange={e => setCollateralFile(e.target.files[0])} /></Field>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4">
            <Field label="Notes"><TextArea placeholder="Private lender note" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
            
            {/* Real inputs that open camera / microphone */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Record Voice Agreement">
                <TextInput type="file" accept="audio/*" capture="microphone" onChange={e => setVoiceFile(e.target.files[0])} className="text-xs" />
              </Field>
              <Field label="Scan Old Note">
                <TextInput type="file" accept="image/*" capture="environment" onChange={e => setNoteFile(e.target.files[0])} className="text-xs" />
              </Field>
              <Field label="Upload Signature">
                <TextInput type="file" accept="image/*" capture="environment" onChange={e => setSignFile(e.target.files[0])} className="text-xs" />
              </Field>
            </div>
            
            <ActionButton className="w-full" onClick={handleSave} disabled={loading}>
              {loading ? "Saving Loan & Uploading..." : "Save Loan"}
            </ActionButton>
          </div>
        </Card>

        <Card className="h-fit">
          <SectionTitle title="Auto calculation" />
          <p className="text-sm font-semibold text-slate-500">6 month total payable</p>
          <p className="mt-1 text-3xl font-black text-leaf-700">{currency(total)}</p>
          <div className="mt-4 grid gap-2">
            {breakdown.map((row) => (
              <div key={row.label} className="flex justify-between rounded-[8px] bg-slate-50 p-3 text-sm">
                <span className="font-bold">{row.label}</span>
                <span>{currency(row.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
