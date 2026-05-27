import { Link } from "react-router-dom";
import { BadgeCheck, Download, Eye, Upload } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";

export function DocumentsEvidence() {
  const docs = ["Handwritten note", "Borrower photo", "Voice promise", "ID proof", "Aadhaar verification", "Land document", "Gold photo"];
  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Documents & Evidence</h1>
      <Link
        to="/aadhaar-verification"
        className="mt-4 flex min-h-16 items-center justify-between gap-3 rounded-[8px] bg-leaf-600 p-4 font-bold text-white shadow-soft"
      >
        <span className="flex items-center gap-3"><BadgeCheck size={22} /> Aadhaar Verification</span>
        <span className="text-sm text-leaf-100">Optional</span>
      </Link>
      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Category"><SelectInput>{docs.map((d) => <option key={d}>{d}</option>)}</SelectInput></Field>
          <Field label="Upload file"><TextInput type="file" /></Field>
        </div>
        <ActionButton className="mt-4"><Upload size={18} /> Upload securely</ActionButton>
      </Card>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {docs.map((doc) => (
          <Card key={doc}>
            <SectionTitle title={doc} />
            <p className="text-sm font-semibold text-slate-500">Categorized evidence preview placeholder</p>
            <div className="mt-3 flex gap-2"><ActionButton variant="secondary"><Eye size={16} /></ActionButton><ActionButton variant="secondary"><Download size={16} /></ActionButton></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
