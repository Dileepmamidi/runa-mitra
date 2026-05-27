import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, IndianRupee, Plus, ReceiptText, TrendingUp, UserPlus } from "lucide-react";
import { Card, SectionTitle } from "../components/Card";
import { ChartBars } from "../components/ChartBars";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { monthlyCollections } from "../data/mockData";
import { currency } from "../utils/loanMath";

export function HomeDashboard() {
  const { t, borrowers, payments } = useApp();
  const totalPending = borrowers.reduce((sum, item) => sum + item.pendingAmount, 0);

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <section className="rounded-[8px] bg-leaf-600 p-5 text-white shadow-soft">
        <p className="text-sm font-bold text-leaf-100">Runa Mitra</p>
        <h1 className="mt-1 text-2xl font-black">మీ రుణాల డిజిటల్ లెక్కలు</h1>
        <p className="mt-2 text-sm font-semibold text-leaf-50">Weak internet ఉన్నా records phone లో ఉంటాయి, online వచ్చినప్పుడు sync అవుతాయి.</p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <MetricCard icon={IndianRupee} label={t.totalLent} value={currency(93000)} />
        <MetricCard icon={AlertTriangle} label={t.pending} value={currency(totalPending)} tone="red" />
        <MetricCard icon={ReceiptText} label={t.collected} value={currency(24000)} tone="soil" />
        <MetricCard icon={TrendingUp} label="Monthly interest" value={currency(6200)} />
        <MetricCard icon={CalendarClock} label={t.dueToday} value="1" tone="yellow" />
        <MetricCard icon={AlertTriangle} label={t.overdue} value="1" tone="red" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Link
          to="/borrowers/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-leaf-600 px-2 text-sm font-bold text-white shadow-soft active:bg-leaf-700"
        >
          <UserPlus size={18} /> Add
        </Link>
        <Link
          to="/loans/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-leaf-600 px-2 text-sm font-bold text-white shadow-soft active:bg-leaf-700"
        >
          <Plus size={18} /> Loan
        </Link>
        <Link
          to="/payments/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-white px-2 text-sm font-bold text-leaf-700 shadow-soft ring-1 ring-leaf-100"
        >
          <ReceiptText size={18} /> Pay
        </Link>
      </div>

      <Card className="mt-4">
        <SectionTitle title="Monthly collections" />
        <ChartBars data={monthlyCollections} />
      </Card>

      <Card className="mt-4">
        <SectionTitle title="Upcoming due payments" />
        <div className="grid gap-3">
          {borrowers.map((borrower) => (
            <div key={borrower.id} className="flex items-center justify-between gap-3 rounded-[8px] bg-slate-50 p-3">
              <div>
                <p className="font-black text-slate-950">{borrower.name}</p>
                <p className="text-sm font-semibold text-slate-500">{borrower.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-950">{currency(borrower.pendingAmount)}</p>
                <StatusBadge status={borrower.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle title="Recent payments" />
        {payments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
            <div>
              <p className="font-bold text-slate-950">{payment.borrowerName}</p>
              <p className="text-sm text-slate-500">{payment.method} · {payment.type}</p>
            </div>
            <p className="font-black text-leaf-700">{currency(payment.amount)}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
