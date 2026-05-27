import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormControls";

export function Collateral() {
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Security submitted by borrower</h1>
      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type"><TextInput /></Field>
          <Field label="Estimated value"><TextInput type="number" /></Field>
          <Field label="Description"><TextArea /></Field>
          <Field label="Photos"><TextInput type="file" accept="image/*" multiple /></Field>
          <Field label="Documents"><TextInput type="file" multiple /></Field>
          <Field label="Returned status"><SelectInput><option>Not returned</option><option>Returned</option></SelectInput></Field>
          <Field label="Return date"><TextInput type="date" /></Field>
        </div>
        <ActionButton className="mt-4 w-full">Save Security Details</ActionButton>
      </Card>
    </div>
  );
}
