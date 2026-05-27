import { useState } from "react";
import { BadgeCheck, FileCheck2, ShieldCheck, Upload } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

export function AadhaarVerification() {
  const { borrowers } = useApp();
  const [method, setMethod] = useState("Manual check");
  const [consent, setConsent] = useState(false);
  const [last4, setLast4] = useState("4321");

  const canVerify = consent && last4.length === 4;

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
              <SelectInput>
                {borrowers.map((borrower) => (
                  <option key={borrower.id}>{borrower.name}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Name as per Aadhaar">
              <TextInput placeholder="Borrower legal name" />
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
              <TextInput inputMode="numeric" placeholder="1985" />
            </Field>
            <Field label="Verification method">
              <SelectInput value={method} onChange={(event) => setMethod(event.target.value)}>
                <option>Manual check</option>
                <option>OTP KYC provider placeholder</option>
                <option>Masked Aadhaar upload</option>
              </SelectInput>
            </Field>
            <Field label="Masked Aadhaar file">
              <TextInput type="file" accept="image/*,.pdf" />
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
            <ActionButton disabled={!canVerify} className={!canVerify ? "opacity-50" : ""}>
              <BadgeCheck size={18} /> Mark Verified
            </ActionButton>
            <ActionButton variant="secondary">
              <Upload size={18} /> Save Draft
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

      <Card className="mt-4">
        <SectionTitle title="Verification history" />
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["మల్లేశ్", "XXXX XXXX 4321", "Verified", "Manual check"],
            ["సరోజ", "XXXX XXXX 9088", "Pending", "Masked Aadhaar upload"]
          ].map(([name, masked, status, source]) => (
            <div key={name} className="rounded-[8px] bg-white p-3 ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-slate-950">{name}</p>
                <FileCheck2 size={18} className={status === "Verified" ? "text-leaf-700" : "text-marigold-500"} />
              </div>
              <p className="mt-2 text-sm font-bold text-slate-600">{masked}</p>
              <p className="text-xs font-semibold text-slate-500">{status} · {source}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
