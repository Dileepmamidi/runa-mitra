import { Camera, Crop, WandSparkles } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, TextInput } from "../components/FormControls";

export function ScanOldNote() {
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Scan Old Note</h1>
      <Card className="mt-4">
        <div className="flex min-h-56 flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-leaf-200 bg-leaf-50 text-center">
          <Camera size={44} className="text-leaf-700" />
          <p className="mt-3 font-black">Camera upload OCR-ready</p>
          <p className="text-sm font-semibold text-slate-500">Crop image and auto extract details later</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3"><ActionButton><Camera size={18} /> Camera</ActionButton><ActionButton variant="secondary"><Crop size={18} /> Crop</ActionButton></div>
      </Card>
      <Card className="mt-4">
        <SectionTitle title="Manual correction" />
        <div className="grid gap-4 md:grid-cols-2">
          {["Name", "Amount", "Interest", "Dates", "Witness names"].map((f) => <Field key={f} label={f}><TextInput /></Field>)}
        </div>
        <ActionButton className="mt-4"><WandSparkles size={18} /> Save Extracted Loan</ActionButton>
      </Card>
    </div>
  );
}
