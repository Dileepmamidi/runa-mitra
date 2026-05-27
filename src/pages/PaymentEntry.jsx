import { useState } from "react";
import { MessageCircle, ReceiptText } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { currency } from "../utils/loanMath";

export function PaymentEntry() {
  const [amount, setAmount] = useState(5000);
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">చెల్లింపు నమోదు</h1>
      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Payment type"><SelectInput><option>Partial payment</option><option>Full payment</option><option>Interest-only payment</option></SelectInput></Field>
          <Field label="Amount paid"><TextInput type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field>
          <Field label="Payment date"><TextInput type="date" defaultValue="2026-05-26" /></Field>
          <Field label="Method"><SelectInput><option>Cash</option><option>UPI</option><option>Bank transfer</option></SelectInput></Field>
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-[8px] bg-marigold-100 p-3 text-sm font-bold text-slate-800">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-leaf-600" />
          Consider current month when delay is only a few days
        </label>
        <div className="mt-5 rounded-[8px] bg-leaf-50 p-4">
          <p className="text-sm font-bold text-slate-500">Updated balance preview</p>
          <p className="mt-1 text-3xl font-black text-leaf-700">{currency(28000 - amount)}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ActionButton><ReceiptText size={18} /> Receipt</ActionButton>
          <ActionButton variant="secondary"><MessageCircle size={18} /> WhatsApp</ActionButton>
        </div>
      </Card>
    </div>
  );
}
