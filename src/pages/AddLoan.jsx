import { useMemo, useState } from "react";
import { Mic, Upload } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormControls";
import { useApp } from "../context/AppContext";
import { buildMonthlyBreakdown, currency, getTotalPayable } from "../utils/loanMath";

export function AddLoan() {
  const { borrowers } = useApp();
  const [securityType, setSecurityType] = useState("Trust only");
  const [principal, setPrincipal] = useState(50000);
  const [rate, setRate] = useState(24);
  const [interestType, setInterestType] = useState("Simple");
  const [cycle, setCycle] = useState("monthly");
  const total = getTotalPayable({ principal, interestRate: rate, interestType, months: 6, cycle });
  const breakdown = useMemo(
    () => buildMonthlyBreakdown({ principal, interestRate: rate, interestType, months: 6, cycle }),
    [cycle, interestType, principal, rate]
  );

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">కొత్త రుణం</h1>
      <p className="mt-1 text-sm font-semibold text-slate-500">Trust-only lending is default. Guarantor and security are optional.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <SectionTitle title="Loan Details" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Select borrower">
              <SelectInput>{borrowers.map((b) => <option key={b.id}>{b.name}</option>)}</SelectInput>
            </Field>
            <Field label="Loan amount"><TextInput type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} /></Field>
            <Field label="Loan date"><TextInput type="date" defaultValue="2026-05-26" /></Field>
            <Field label="Interest rate %"><TextInput type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></Field>
            <Field label="Interest type">
              <SelectInput value={interestType} onChange={(e) => setInterestType(e.target.value)}><option>Simple</option><option>Compound</option></SelectInput>
            </Field>
            <Field label="Interest cycle">
              <SelectInput value={cycle} onChange={(e) => setCycle(e.target.value)}><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option></SelectInput>
            </Field>
            <Field label="Repayment type">
              <SelectInput><option>Monthly</option><option>Seasonal</option><option>Flexible</option><option>One-time settlement</option></SelectInput>
            </Field>
            <Field label="Security type">
              <SelectInput value={securityType} onChange={(e) => setSecurityType(e.target.value)}>
                <option>Trust only</option><option>Guarantor</option><option>Gold/Documents</option>
              </SelectInput>
            </Field>
            <Field label="Due date"><TextInput type="date" defaultValue="2026-11-26" /></Field>
            <Field label="Grace period"><TextInput placeholder="Example: 5 days" /></Field>
          </div>

          {securityType === "Guarantor" && (
            <div className="mt-5 rounded-[8px] bg-leaf-50 p-4">
              <SectionTitle title="Guarantor Form" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name"><TextInput /></Field>
                <Field label="Mobile"><TextInput inputMode="numeric" /></Field>
                <Field label="Relationship"><TextInput /></Field>
                <Field label="Signature"><TextInput type="file" accept="image/*" /></Field>
              </div>
            </div>
          )}

          {securityType === "Gold/Documents" && (
            <div className="mt-5 rounded-[8px] bg-marigold-100 p-4">
              <SectionTitle title="Security submitted by borrower" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Type"><TextInput placeholder="Gold, document, vehicle paper" /></Field>
                <Field label="Estimated value"><TextInput type="number" /></Field>
                <Field label="Description"><TextArea /></Field>
                <Field label="Photos"><TextInput type="file" multiple accept="image/*" /></Field>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4">
            <Field label="Notes"><TextArea placeholder="Private lender note" /></Field>
            <div className="grid grid-cols-3 gap-3">
              <ActionButton variant="secondary"><Mic size={18} /> Voice</ActionButton>
              <ActionButton variant="secondary"><Upload size={18} /> Note</ActionButton>
              <ActionButton variant="secondary"><Upload size={18} /> Sign</ActionButton>
            </div>
            <ActionButton className="w-full">Save Loan</ActionButton>
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
