import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormControls";

export function AddBorrower() {
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">అప్పుదారు జోడించండి</h1>
      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><TextInput placeholder="Borrower name" /></Field>
          <Field label="Father name"><TextInput placeholder="Father name" /></Field>
          <Field label="Mobile"><TextInput inputMode="numeric" placeholder="Mobile number" /></Field>
          <Field label="WhatsApp"><TextInput inputMode="numeric" placeholder="WhatsApp number" /></Field>
          <Field label="Village"><TextInput placeholder="Village" /></Field>
          <Field label="Occupation">
            <SelectInput>
              <option>Farmer</option><option>Employee</option><option>Shopkeeper</option><option>Business</option><option>Daily wage</option><option>Other</option>
            </SelectInput>
          </Field>
          <Field label="Address"><TextArea placeholder="Street, landmark, village" /></Field>
          <Field label="Nominee name"><TextInput placeholder="Nominee name" /></Field>
          <Field label="Nominee mobile"><TextInput inputMode="numeric" placeholder="Nominee mobile number" /></Field>
          <Field label="Guarantor name optional"><TextInput placeholder="Guarantor name" /></Field>
          <Field label="Guarantor mobile optional"><TextInput inputMode="numeric" placeholder="Guarantor mobile number" /></Field>
          <Field label="Family contact mobile"><TextInput inputMode="numeric" placeholder="Emergency family mobile" /></Field>
          <Field label="Photo upload optional"><TextInput type="file" accept="image/*" /></Field>
        </div>
        <ActionButton className="mt-5 w-full">Save Borrower</ActionButton>
      </Card>
    </div>
  );
}
