import { ShieldCheck } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";

export function FamilyAccess() {
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Family Access</h1>
      <Card className="mt-4">
        <ShieldCheck size={42} className="text-leaf-700" />
        <p className="mt-3 text-sm font-semibold text-slate-500">Trusted family member can help understand records during emergency.</p>
        <div className="mt-5 grid gap-4">
          <Field label="Family member name"><TextInput /></Field>
          <Field label="Mobile"><TextInput inputMode="numeric" /></Field>
          <Field label="Permission"><SelectInput><option>View only</option><option>Emergency recovery</option></SelectInput></Field>
          <ActionButton>Save Trusted Access</ActionButton>
        </div>
      </Card>
    </div>
  );
}
