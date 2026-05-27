import { useMemo, useState } from "react";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { ChartBars } from "../components/ChartBars";
import { buildMonthlyBreakdown, currency } from "../utils/loanMath";

export function InterestCalculator() {
  const [principal, setPrincipal] = useState(30000);
  const [rate, setRate] = useState(24);
  const [type, setType] = useState("Simple");
  const rows = useMemo(() => buildMonthlyBreakdown({ principal, interestRate: rate, interestType: type, months: 6, cycle: "monthly" }), [principal, rate, type]);
  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Interest Calculator</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card>
          <div className="grid gap-4">
            <Field label="Amount"><TextInput type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} /></Field>
            <Field label="Interest %"><TextInput type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></Field>
            <Field label="Interest type"><SelectInput value={type} onChange={(e) => setType(e.target.value)}><option>Simple</option><option>Compound</option></SelectInput></Field>
            <Field label="Repayment style"><SelectInput><option>Monthly</option><option>Seasonal</option></SelectInput></Field>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Payment timeline" />
          <ChartBars data={rows.map((r) => ({ label: r.label.replace(" నెల", ""), value: r.total }))} color="bg-marigold-500" />
          <p className="mt-4 text-3xl font-black text-leaf-700">{currency(rows.at(-1)?.total)}</p>
        </Card>
      </div>
      <Card className="mt-4">
        <SectionTitle title="Monthly breakdown" />
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-3 border-b border-slate-100 py-3 text-sm last:border-0">
            <b>{row.label}</b><span>{currency(row.interest)} interest</span><b className="text-right">{currency(row.total)}</b>
          </div>
        ))}
      </Card>
    </div>
  );
}
