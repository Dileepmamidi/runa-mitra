import { Link } from "react-router-dom";
import { ArrowRight, Clock, FileText, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { currency } from "../../utils/loanMath";
import { Card } from "../../components/Card";

export function BorrowerHome() {
  const { loans, payments } = useApp();

  const totalPrincipal = loans.reduce((sum, loan) => sum + Number(loan.principal || 0), 0);
  const totalBalance = loans.reduce((sum, loan) => sum + Number(loan.balance || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const activeLoans = loans.filter(l => l.balance > 0);

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-3xl font-black text-slate-950 mb-6">సారాంశం (Overview)</h2>
      
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="bg-danger-50 border-danger-100">
          <p className="text-lg font-bold text-danger-700">మొత్తం బకాయి (Total Pending)</p>
          <p className="mt-2 text-4xl font-black text-danger-600">{currency(totalBalance)}</p>
        </Card>
        
        <Card className="bg-leaf-50 border-leaf-100">
          <p className="text-lg font-bold text-leaf-800">చెల్లించిన మొత్తం (Total Paid)</p>
          <p className="mt-2 text-4xl font-black text-leaf-700">{currency(totalPaid)}</p>
        </Card>
      </div>

      <h3 className="text-xl font-black text-slate-900 mb-4 mt-8">మీ రుణాలు (Your Loans)</h3>
      
      {activeLoans.length === 0 ? (
        <Card>
          <p className="text-lg font-bold text-slate-500 text-center py-6">మీకు ప్రస్తుతం ఎటువంటి అప్పులు లేవు.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activeLoans.map(loan => {
            const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date();
            const statusColor = isOverdue ? "bg-danger-100 text-danger-800" : "bg-warning-100 text-warning-800";
            
            return (
              <Card key={loan.id} className="relative overflow-hidden">
                <div className="absolute right-0 top-0 rounded-bl-xl px-4 py-1 text-xs font-black uppercase tracking-wider shadow-sm bg-leaf-100 text-leaf-800">
                  Active
                </div>
                
                <p className="text-sm font-bold text-slate-500 mb-1">Loan taken on {loan.loanDate}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-slate-950">{currency(loan.principal)}</p>
                  <p className="text-lg font-bold text-slate-500">@ {loan.interestRate}% {loan.interestType}</p>
                </div>
                
                <div className={`mt-4 rounded-xl p-4 flex items-center gap-3 ${statusColor}`}>
                  {isOverdue ? <AlertCircle size={24} /> : <Clock size={24} />}
                  <div>
                    <p className="font-bold text-base">Due Date: {loan.dueDate || "Not specified"}</p>
                    <p className="text-sm">{isOverdue ? "Payment is overdue!" : "Upcoming payment"}</p>
                  </div>
                </div>
                
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link to={`/loans/${loan.id}`} className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-4 font-black text-slate-700 hover:bg-slate-200">
                    <FileText size={20} /> వివరాలు (Details)
                  </Link>
                  <Link to={`/extensions/new?loanId=${loan.id}`} className="flex items-center justify-center gap-2 rounded-xl bg-leaf-600 py-4 font-black text-white shadow-soft hover:bg-leaf-700">
                     సమయం కోరండి (Request Time)
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
