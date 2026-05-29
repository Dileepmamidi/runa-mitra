import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, IndianRupee, Plus, ReceiptText, TrendingUp, UserPlus } from "lucide-react";
import { Card, SectionTitle } from "../components/Card";
import { ChartBars } from "../components/ChartBars";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { currency } from "../utils/loanMath";

export function HomeDashboard() {
  const { t, borrowers, payments, loans } = useApp();

  // Calculate real metrics from Firestore data
  const totalLent = loans.reduce((sum, l) => sum + (l.principal || 0), 0);
  const totalPending = loans.reduce((sum, l) => sum + (l.balance || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const today = new Date().toISOString().split("T")[0];
  const dueToday = loans.filter(l => l.dueDate === today && l.status !== "closed").length;
  const overdue = loans.filter(l => l.dueDate && l.dueDate < today && l.status !== "closed").length;

  // Monthly interest estimate (sum of active loan monthly interest)
  const monthlyInterest = loans
    .filter(l => l.status !== "closed")
    .reduce((sum, l) => {
      if (l.interestType === "flat") return sum + ((l.principal || 0) * (l.interestRate || 0)) / 100;
      return sum + ((l.balance || 0) * (l.interestRate || 0)) / 100;
    }, 0);

  // Last 6 months chart data
  const monthlyChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthStr = d.toISOString().slice(0, 7); // "YYYY-MM"
    const label = d.toLocaleString("default", { month: "short" });
    const amount = payments
      .filter(p => (p.paymentDate || p.createdAt?.toDate?.()?.toISOString() || "").startsWith(monthStr))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return { label, amount };
  });

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <section className="rounded-[8px] bg-leaf-600 p-5 text-white shadow-soft">
        <p className="text-sm font-bold text-leaf-100">Runa Mitra</p>
        <h1 className="mt-1 text-2xl font-black">మీ రుణాల డిజిటల్ లెక్కలు</h1>
        <p className="mt-2 text-sm font-semibold text-leaf-50">
          Weak internet ఉన్నా records phone లో ఉంటాయి, online వచ్చినప్పుడు sync అవుతాయి.
        </p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <MetricCard icon={IndianRupee} label={t.totalLent} value={currency(totalLent)} />
        <MetricCard icon={AlertTriangle} label={t.pending} value={currency(totalPending)} tone="red" />
        <MetricCard icon={ReceiptText} label={t.collected} value={currency(totalCollected)} tone="soil" />
        <MetricCard icon={TrendingUp} label="Monthly interest" value={currency(monthlyInterest)} />
        <MetricCard icon={CalendarClock} label={t.dueToday} value={String(dueToday)} tone="yellow" />
        <MetricCard icon={AlertTriangle} label={t.overdue} value={String(overdue)} tone="red" />
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
        {monthlyChart.every(m => m.amount === 0) ? (
          <p className="py-4 text-center text-sm text-slate-400">No payments recorded yet</p>
        ) : (
          <ChartBars data={monthlyChart} />
        )}
      </Card>

      <Card className="mt-4">
        <SectionTitle title="Upcoming due payments" />
        {borrowers.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            No borrowers yet.{" "}
            <Link to="/borrowers/new" className="font-bold text-leaf-600 underline">
              Add your first borrower
            </Link>
          </p>
        ) : (
          <div className="grid gap-3">
            {borrowers
              .map(borrower => {
                const borrowerLoans = loans.filter(l => l.borrowerId === borrower.id);
                const totalBalance = borrowerLoans.reduce((sum, l) => sum + l.balance, 0);
                return { ...borrower, totalBalance };
              })
              .filter(b => b.totalBalance > 0)
              .map((borrower) => (
              <div key={borrower.id} className="flex items-center justify-between gap-3 rounded-[8px] bg-slate-50 p-3">
                <div>
                  <p className="font-black text-slate-950">{borrower.personalInfo?.name || borrower.name}</p>
                  <p className="text-sm font-semibold text-slate-500">{borrower.dueDate || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-950">{currency(borrower.totalBalance)}</p>
                  <StatusBadge status={borrower.status || "active"} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <SectionTitle title="Recent payments" />
        {payments.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No payments recorded yet</p>
        ) : (
          payments.slice(0, 5).map((payment) => (
            <div key={payment.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
              <div>
                <p className="font-bold text-slate-950">{payment.borrowerName || "—"}</p>
                <p className="text-sm text-slate-500">{payment.method} · {payment.paymentType}</p>
              </div>
              <p className="font-black text-leaf-700">{currency(payment.amount || 0)}</p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
