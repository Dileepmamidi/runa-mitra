import { Card, SectionTitle } from "../components/Card";
import { ModeGate } from "../components/ModeGate";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

export function RiskAnalysis() {
  const { borrowers } = useApp();
  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Risk Analysis</h1>
      <ModeGate min="Advanced" label="Risk analysis unlocks in Advanced mode">
        <div className="mt-4 grid gap-3">
          {borrowers.map((borrower) => (
            <Card key={borrower.id}>
              <div className="flex items-center justify-between">
                <div><h2 className="font-black">{borrower.name}</h2><p className="text-sm text-slate-500">{borrower.occupation}</p></div>
                <StatusBadge status={borrower.riskLevel} />
              </div>
              <SectionTitle title="Signals" />
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
                <div className="rounded-[8px] bg-slate-50 p-3">Delays</div>
                <div className="rounded-[8px] bg-slate-50 p-3">Guarantor</div>
                <div className="rounded-[8px] bg-slate-50 p-3">History</div>
              </div>
            </Card>
          ))}
        </div>
      </ModeGate>
    </div>
  );
}
