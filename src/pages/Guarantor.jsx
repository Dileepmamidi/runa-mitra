import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, TextArea, TextInput } from "../components/FormControls";

export function Guarantor() {
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Guarantor Details</h1>
      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><TextInput /></Field>
          <Field label="Mobile"><TextInput inputMode="numeric" /></Field>
          <Field label="Relationship"><TextInput /></Field>
          <Field label="Photo"><TextInput type="file" accept="image/*" /></Field>
          <Field label="Address"><TextArea /></Field>
          <Field label="Signature"><TextInput type="file" accept="image/*" /></Field>
        </div>
        <ActionButton className="mt-4 w-full">Save Guarantor</ActionButton>
      </Card>
    </div>
  );
}
