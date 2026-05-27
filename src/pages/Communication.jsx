import { MessageCircle, Phone, Send } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";

export function Communication() {
  const templates = ["Due reminder", "Payment received", "Extension approved"];
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Communication</h1>
      <Card className="mt-4">
        <div className="grid grid-cols-3 gap-3"><ActionButton><MessageCircle size={18} /></ActionButton><ActionButton variant="secondary"><Phone size={18} /></ActionButton><ActionButton variant="secondary"><Send size={18} /></ActionButton></div>
      </Card>
      <Card className="mt-4">
        <SectionTitle title="Templates" />
        {templates.map((template) => <div key={template} className="mb-3 rounded-[8px] bg-slate-50 p-3 font-bold">{template}</div>)}
      </Card>
    </div>
  );
}
