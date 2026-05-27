import { useParams } from "react-router-dom";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { buildMonthlyBreakdown, currency } from "../utils/loanMath";

export function LoanDetails() {
  const { id } = useParams();
  const { loans, payments } = useApp();
  const loan = loans.find((item) => item.id === id) || loans[0];
  const breakdown = buildMonthlyBreakdown({ principal: loan.principal, interestRate: loan.interestRate, interestType: loan.interestType, months: 4, cycle: loan.cycle });

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-950">{loan.borrowerName}</h1>
            <p className="font-semibold text-slate-500">{loan.securityType} · {loan.repaymentType}</p>
          </div>
          <StatusBadge status={loan.status} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[8px] bg-leaf-50 p-3"><p className="text-xs font-bold text-slate-500">Principal</p><p className="text-xl font-black">{currency(loan.principal)}</p></div>
          <div className="rounded-[8px] bg-danger-50 p-3"><p className="text-xs font-bold text-slate-500">Balance</p><p className="text-xl font-black">{currency(loan.balance)}</p></div>
        </div>
      </Card>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ActionButton>Add payment</ActionButton>
        <ActionButton variant="secondary">Extend repayment</ActionButton>
        <ActionButton variant="secondary">Generate receipt</ActionButton>
        <ActionButton variant="secondary">PDF agreement</ActionButton>
        <ActionButton variant="warning" className="col-span-2">Mark completed</ActionButton>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card><SectionTitle title="Payment History" />{payments.map((p) => <p key={p.id} className="border-b border-slate-100 py-2 text-sm">{p.date} · {p.borrowerName} · {currency(p.amount)}</p>)}</Card>
        <Card><SectionTitle title="Interest Calculations" />{breakdown.map((r) => <p key={r.label} className="flex justify-between py-2 text-sm"><span>{r.label}</span><b>{currency(r.total)}</b></p>)}</Card>
        <Card><SectionTitle title="Extension Requests" /><p className="text-sm font-semibold text-slate-500">No open request. History will show approved, rejected, and reason.</p></Card>
        <Card><SectionTitle title="Guarantor / Collateral" /><p className="text-sm font-semibold text-slate-500">{loan.securityType === "Trust only" ? "Trust-only loan. Optional details can be added later." : loan.securityType}</p></Card>
        <Card className="md:col-span-2"><SectionTitle title="Uploaded Evidence" /><p className="text-sm font-semibold text-slate-500">Loan notes, photos, voice recordings, and documents stored securely by user.</p></Card>
      </div>
    </div>
  );
}
