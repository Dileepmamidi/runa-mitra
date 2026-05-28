import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { currency } from "../../utils/loanMath";
import { Card, SectionTitle } from "../../components/Card";

export function BorrowerLoanDetails() {
  const { id } = useParams();
  const { loans, payments } = useApp();
  
  const loan = loans.find(l => l.id === id);
  const loanPayments = payments.filter(p => p.loanId === id);
  
  if (!loan) return <div className="p-8 text-center text-xl font-bold">Loan not found</div>;

  const totalPaid = loanPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const isCleared = loan.balance <= 0;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/home" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} className="mr-2" /> వెనుకకు (Back)
      </Link>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black text-slate-950">రుణ వివరాలు (Details)</h2>
        {isCleared ? (
          <div className="flex items-center gap-1 rounded-full bg-leaf-100 px-3 py-1 text-sm font-bold text-leaf-800">
            <CheckCircle2 size={16} /> Cleared
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-full bg-warning-100 px-3 py-1 text-sm font-bold text-warning-800">
            <AlertCircle size={16} /> Active
          </div>
        )}
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-sm font-bold text-slate-500">అసలు (Principal)</p>
            <p className="text-2xl font-black text-slate-950">{currency(loan.principal)}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">బకాయి (Pending)</p>
            <p className="text-2xl font-black text-danger-600">{currency(loan.balance)}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">వడ్డీ రేటు (Rate)</p>
            <p className="text-lg font-bold text-slate-900">{loan.interestRate}% {loan.interestType}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">గడువు తేదీ (Due Date)</p>
            <p className="text-lg font-bold text-slate-900">{loan.dueDate || "N/A"}</p>
          </div>
          <div>
             <p className="text-sm font-bold text-slate-500">చెల్లింపు విధానం</p>
             <p className="text-lg font-bold text-slate-900">{loan.cycle || "Monthly"}</p>
          </div>
          <div>
             <p className="text-sm font-bold text-slate-500">Total Paid</p>
             <p className="text-lg font-bold text-leaf-700">{currency(totalPaid)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="మార్పుల చరిత్ర (Change History)" />
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
           <div className="border-l-4 border-leaf-400 pl-4 py-2">
             <p className="text-sm font-bold text-slate-900">Loan Created</p>
             <p className="text-xs font-semibold text-slate-500">{new Date(loan.createdAt?.seconds * 1000).toLocaleString() || loan.loanDate}</p>
             <p className="mt-1 text-sm text-slate-700">Principal: {currency(loan.principal)}, Rate: {loan.interestRate}%</p>
           </div>
           
           {/* In the future, other modifications will be appended here based on a loanChangeHistory collection */}
           <p className="mt-4 text-xs font-bold text-slate-400 text-center">No other modifications recorded.</p>
        </div>
      </Card>
    </div>
  );
}
