import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, FileCheck2, ShieldCheck, Upload } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { updateUserRecord, uploadEvidence } from "../services/firebaseService";

export function AadhaarVerification() {
  const { user, borrowers, refreshData } = useApp();
  const navigate = useNavigate();

  const [borrowerId, setBorrowerId] = useState(borrowers[0]?.id || "");
  const [method, setMethod] = useState("Manual check");
  const [consent, setConsent] = useState(false);
  const [last4, setLast4] = useState("");
  const [nameAsPerAadhaar, setNameAsPerAadhaar] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canVerify = consent && last4.length === 4 && borrowerId;

  const handleVerify = async () => {
    setError("");
    if (!user) return setError("Must be logged in");
    if (!borrowerId) return setError("Select a borrower");

    try {
      setLoading(true);
      let fileUrl = "";
      if (file) {
        fileUrl = await uploadEvidence(user.uid, file, ["aadhaar"]);
      }

      const aadhaarData = {
        aadhaarStatus: "Verified",
        aadhaarLast4: last4,
        aadhaarName: nameAsPerAadhaar,
        aadhaarBirthYear: birthYear,
        aadhaarMethod: method,
        aadhaarFileUrl: fileUrl,
      };

      // Update the borrower's document with Aadhaar info
      await updateUserRecord(user.uid, "borrowers", borrowerId, aadhaarData);
      
      await refreshData();
      navigate(`/borrowers/${borrowerId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to verify. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Aadhaar Verification</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Optional identity check for borrower records.
          </p>
        </div>
        <StatusBadge status={canVerify ? "Low" : "Upcoming"} />
      </div>

      {error && (
        <div className="mt-4 rounded-[6px] bg-red-50 p-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <Card className="mt-4 border border-leaf-100 bg-leaf-50">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 shrink-0 text-leaf-700" size={24} />
          <div>
            <h2 className="font-black text-leaf-800">Privacy safe by default</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Store only consent, verification status, masked Aadhaar, and last 4 digits. Full Aadhaar number is not saved in this app.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <SectionTitle title="Borrower identity" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Borrower">
              <SelectInput value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}>
                <option value="">Select Borrower</option>
                {borrowers.map((borrower) => (
                  <option key={borrower.id} value={borrower.id}>{borrower.name}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Name as per Aadhaar">
              <TextInput value={nameAsPerAadhaar} onChange={(e) => setNameAsPerAadhaar(e.target.value)} placeholder="Borrower legal name" />
            </Field>
            <Field label="Aadhaar last 4 digits">
              <TextInput
                inputMode="numeric"
                maxLength={4}
                value={last4}
                onChange={(event) => setLast4(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
              />
            </Field>
            <Field label="Birth year">
              <TextInput value={birthYear} onChange={(e) => setBirthYear(e.target.value)} inputMode="numeric" placeholder="1985" />
            </Field>
            <Field label="Verification method">
              <SelectInput value={method} onChange={(event) => setMethod(event.target.value)}>
                <option>Manual check</option>
                <option>Masked Aadhaar upload</option>
              </SelectInput>
            </Field>
            <Field label="Masked Aadhaar file (Camera)">
              <TextInput type="file" accept="image/*,.pdf" capture="environment" onChange={(e) => setFile(e.target.files[0])} />
            </Field>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-[8px] bg-soil-50 p-3 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 accent-leaf-600"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            Borrower gave consent to record Aadhaar verification status for this loan notebook.
          </label>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ActionButton 
              disabled={!canVerify || loading} 
              className={!canVerify ? "opacity-50" : ""}
              onClick={handleVerify}
            >
              <BadgeCheck size={18} /> {loading ? "Saving..." : "Mark Verified"}
            </ActionButton>
          </div>
        </Card>

        <Card className="h-fit">
          <SectionTitle title="Verification preview" />
          <div className="rounded-[8px] bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">Masked Aadhaar</p>
            <p className="mt-1 text-2xl font-black text-slate-950">XXXX XXXX {last4 || "----"}</p>
          </div>
          <div className="mt-3 rounded-[8px] bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">Method</p>
            <p className="mt-1 font-black text-slate-950">{method}</p>
          </div>
          <div className="mt-3 rounded-[8px] bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">Status</p>
            <p className="mt-1 font-black text-leaf-700">{canVerify ? "Ready to verify" : "Consent needed"}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
