import { useState, useRef } from "react";
import { FileSignature, Printer } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { useApp } from "../context/AppContext";
import { addUserRecord, uploadEvidence } from "../services/firebaseService";

export function AgreementGeneration() {
  const { user, borrowers, loans, refreshData } = useApp();
  
  const [borrowerId, setBorrowerId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [language, setLanguage] = useState("te");
  const [witnessName, setWitnessName] = useState("");
  
  const [borrowerSignFile, setBorrowerSignFile] = useState(null);
  const [lenderSignFile, setLenderSignFile] = useState(null);
  const [witnessSignFile, setWitnessSignFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Printable area reference
  const printRef = useRef(null);

  const selectedBorrower = borrowers.find(b => b.id === borrowerId);
  const selectedLoan = loans.find(l => l.id === loanId);
  const borrowerLoans = loans.filter(l => l.borrowerId === borrowerId);

  const handleGenerate = async () => {
    setError("");
    setSuccess("");
    if (!user) return setError("Must be logged in.");
    if (!borrowerId || !loanId) return setError("Please select a borrower and a loan.");
    
    try {
      setLoading(true);
      
      let borrowerSignUrl = "";
      let lenderSignUrl = "";
      
      if (borrowerSignFile) {
        borrowerSignUrl = await uploadEvidence(user.uid, borrowerSignFile, ["agreements", loanId, "borrower"]);
      }
      
      if (lenderSignFile) {
        lenderSignUrl = await uploadEvidence(user.uid, lenderSignFile, ["agreements", loanId, "lender"]);
      }

      let witnessSignUrl = "";
      if (witnessSignFile) {
        witnessSignUrl = await uploadEvidence(user.uid, witnessSignFile, ["agreements", loanId, "witness"]);
      }

      const agreementData = {
        borrowerId,
        loanId,
        language,
        witnessName,
        borrowerSignUrl,
        lenderSignUrl,
        witnessSignUrl,
        generatedAt: new Date().toISOString(),
      };

      await addUserRecord(user.uid, "agreements", agreementData);
      setSuccess("Agreement securely saved to database!");
      await refreshData();
      
      // Trigger browser print
      setTimeout(() => {
        window.print();
      }, 500);

    } catch (err) {
      console.error(err);
      setError("Failed to generate and save agreement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      {/* Hide this entire wrapper when printing */}
      <div className="print:hidden">
        <h1 className="text-2xl font-black text-slate-950">Agreement Generation</h1>
        
        {error && <div className="mt-4 rounded-[6px] bg-red-50 p-3 text-sm font-bold text-red-600">{error}</div>}
        {success && <div className="mt-4 rounded-[6px] bg-leaf-50 p-3 text-sm font-bold text-leaf-700">{success}</div>}

        <Card className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Borrower">
              <SelectInput value={borrowerId} onChange={(e) => { setBorrowerId(e.target.value); setLoanId(""); }}>
                <option value="">Select Borrower</option>
                {borrowers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </SelectInput>
            </Field>

            <Field label="Loan">
              <SelectInput value={loanId} onChange={(e) => setLoanId(e.target.value)} disabled={!borrowerId}>
                <option value="">Select Loan</option>
                {borrowerLoans.map(l => (
                  <option key={l.id} value={l.id}>₹{l.principal} on {l.loanDate}</option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Language">
              <SelectInput value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="te">Telugu</option>
                <option value="en">English</option>
              </SelectInput>
            </Field>
            
            <Field label="Witness name">
              <TextInput value={witnessName} onChange={e => setWitnessName(e.target.value)} />
            </Field>
            
            <Field label="Borrower signature (Camera)">
              <TextInput type="file" accept="image/*" capture="environment" onChange={e => setBorrowerSignFile(e.target.files[0])} />
            </Field>
            
            <Field label="Lender signature (Camera)">
              <TextInput type="file" accept="image/*" capture="environment" onChange={e => setLenderSignFile(e.target.files[0])} />
            </Field>

            <Field label="Witness signature (Camera)">
              <TextInput type="file" accept="image/*" capture="environment" onChange={e => setWitnessSignFile(e.target.files[0])} />
            </Field>
          </div>
          
          <div className="mt-5 rounded-[8px] bg-soil-50 p-4">
            <SectionTitle title="Preview" />
            <p className="text-sm font-semibold leading-6 text-slate-700">
              This will save the signatures to the cloud, create a digital agreement record, and immediately open the PDF print view so you can save or share it.
            </p>
          </div>
          
          <ActionButton className="mt-5 w-full" onClick={handleGenerate} disabled={loading || !borrowerId || !loanId}>
            {loading ? "Saving & Generating..." : <><Printer size={18} /> Save & Generate PDF</>}
          </ActionButton>
        </Card>
      </div>

      {/* This area is ONLY visible when printing (via CSS print media queries) */}
      <div className="hidden print:block" ref={printRef}>
        {selectedBorrower && selectedLoan && (
          <div className="p-8 border-2 border-slate-900 rounded-lg">
            <h1 className="text-3xl font-black text-center mb-8 uppercase">
              {language === "te" ? "రుణ ఒప్పంద పత్రం" : "LOAN AGREEMENT"}
            </h1>
            
            <p className="mb-4 text-lg leading-relaxed">
              {language === "te" 
                ? `ఈ రోజు ${new Date().toLocaleDateString('te-IN')} న, అప్పుదారుడైన ${selectedBorrower.name} (${selectedBorrower.village} గ్రామం, తండ్రి: ${selectedBorrower.fatherName}), అప్పు ఇచ్చేవారి వద్ద నుండి రూ. ${selectedLoan.principal}/- (వడ్డీ రేటు: ${selectedLoan.interestRate}%, పద్ధతి: ${selectedLoan.interestType}) రుణంగా తీసుకున్నానని అంగీకరిస్తున్నాను.`
                : `This agreement is made on ${new Date().toLocaleDateString()} between the Borrower ${selectedBorrower.name} (from ${selectedBorrower.village}, D/o or S/o: ${selectedBorrower.fatherName}) and the Lender. The Borrower acknowledges receiving a loan of ₹${selectedLoan.principal}/- at an interest rate of ${selectedLoan.interestRate}% (${selectedLoan.interestType}).`}
            </p>

            <p className="mb-8 text-lg leading-relaxed">
              {language === "te"
                ? `ఈ రుణాన్ని గడువు తేదీ (${selectedLoan.dueDate || "N/A"}) లోగా తిరిగి చెల్లించడానికి నేను బాధ్యుడిని. సాక్షి ${witnessName || "________"} సమక్షంలో ఈ ఒప్పందం కుదుర్చుకున్నాము.`
                : `The Borrower agrees to repay this loan by the due date (${selectedLoan.dueDate || "N/A"}). This agreement is witnessed by ${witnessName || "________"}.`}
            </p>

            <div className="mt-16 grid grid-cols-2 gap-8 pt-8">
              <div className="text-center">
                <div className="h-24 flex items-end justify-center border-b-2 border-slate-300 mb-2 pb-2">
                  {borrowerSignFile ? (
                    <img src={URL.createObjectURL(borrowerSignFile)} alt="Borrower Signature" className="max-h-20 object-contain" />
                  ) : (
                    <span className="text-slate-400 italic">Signature digitally attached</span>
                  )}
                </div>
                <p className="font-bold">{language === "te" ? "అప్పుదారు సంతకం" : "Borrower Signature"}</p>
                <p className="text-sm">{selectedBorrower.name}</p>
              </div>
              
              <div className="text-center">
                <div className="h-24 flex items-end justify-center border-b-2 border-slate-300 mb-2 pb-2">
                  {lenderSignFile ? (
                    <img src={URL.createObjectURL(lenderSignFile)} alt="Lender Signature" className="max-h-20 object-contain" />
                  ) : (
                    <span className="text-slate-400 italic">Signature digitally attached</span>
                  )}
                </div>
                <p className="font-bold">{language === "te" ? "లెంట్దారు సంతకం" : "Lender Signature"}</p>
              </div>
            </div>
            
            {witnessName && (
               <div className="mt-12 text-left w-1/2">
                <div className="h-24 flex items-end justify-start border-b-2 border-slate-300 mb-2 pb-2">
                  {witnessSignFile ? (
                    <img src={URL.createObjectURL(witnessSignFile)} alt="Witness Signature" className="max-h-20 object-contain" />
                  ) : (
                    <span className="text-slate-400 italic">Signature digitally attached</span>
                  )}
                </div>
                <p className="font-bold">{language === "te" ? "సాక్షి సంతకం" : "Witness Signature"}</p>
                <p className="text-sm">{witnessName}</p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
