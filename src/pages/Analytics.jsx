import { Card, SectionTitle } from "../components/Card";
import { ChartBars } from "../components/ChartBars";
import { ModeGate } from "../components/ModeGate";
import { monthlyCollections, occupationInsights } from "../data/mockData";

export function Analytics() {
  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Analytics</h1>
      <ModeGate min="Regular" label="Analytics unlocks in Regular mode">
        <div className="mt-4 grid gap-4">
          <Card><SectionTitle title="Monthly collection" /><ChartBars data={monthlyCollections} /></Card>
          <Card><SectionTitle title="Occupation-wise repayment trends" />{occupationInsights.map((item) => <div key={item.label} className="py-3"><div className="flex justify-between"><b>{item.label}</b><span>{item.value}%</span></div><p className="text-sm text-slate-500">{item.note}</p></div>)}</Card>
          <Card><SectionTitle title="Seasonal payment behavior" /><p className="text-sm font-semibold text-slate-500">Farmers show stronger repayments after crop sales and market cycles.</p></Card>
        </div>
      </ModeGate>
    </div>
  );
}
