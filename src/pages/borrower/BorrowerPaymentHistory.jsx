import { useApp } from "../../context/AppContext";
import { currency } from "../../utils/loanMath";
import { Card } from "../../components/Card";
import { ArrowDownRight } from "lucide-react";

export function BorrowerPaymentHistory() {
  const { payments } = useApp();

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-3xl font-black text-slate-950 mb-6">చెల్లింపులు (History)</h2>
      
      {payments.length === 0 ? (
        <Card>
          <p className="text-lg font-bold text-slate-500 text-center py-6">No payments recorded yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map(payment => (
            <Card key={payment.id} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                <ArrowDownRight size={24} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-black text-slate-950">{currency(payment.amount)}</p>
                <p className="text-sm font-bold text-slate-500">{payment.paymentDate || new Date(payment.createdAt?.seconds * 1000).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Method</p>
                <p className="text-sm font-black text-slate-700">{payment.method || "Cash"}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
