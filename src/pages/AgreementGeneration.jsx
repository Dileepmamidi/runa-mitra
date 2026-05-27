import { FileSignature } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";

export function AgreementGeneration() {
  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Agreement Generation</h1>
      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Language"><SelectInput><option>Telugu agreement</option><option>English agreement</option></SelectInput></Field>
          <Field label="Witness name"><TextInput /></Field>
          <Field label="Borrower signature"><TextInput type="file" accept="image/*" /></Field>
          <Field label="Lender signature"><TextInput type="file" accept="image/*" /></Field>
        </div>
        <div className="mt-5 rounded-[8px] bg-soil-50 p-4">
          <SectionTitle title="Preview" />
          <p className="text-sm font-semibold leading-6 text-slate-700">
            ఈ ఒప్పందంలో అప్పుదారు వివరాలు, రుణ మొత్తం, వడ్డీ షరతులు, repayment terms, guarantor/collateral if available, timestamp, and GPS placeholder will be included.
          </p>
        </div>
        <ActionButton className="mt-5 w-full"><FileSignature size={18} /> Generate PDF</ActionButton>
      </Card>
    </div>
  );
}
