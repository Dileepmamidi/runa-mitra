import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormControls";

export function RepaymentExtension() {
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Repayment Extension</h1>
      <Card className="mt-4">
        <div className="grid gap-4">
          <Field label="New due date"><TextInput type="date" /></Field>
          <Field label="Reason"><TextArea placeholder="Borrower requested more time because..." /></Field>
          <Field label="Interest handling">
            <SelectInput><option>Continue normally</option><option>Pause temporarily</option><option>Same month adjustment</option></SelectInput>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <ActionButton>Approve</ActionButton>
            <ActionButton variant="danger">Reject</ActionButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
