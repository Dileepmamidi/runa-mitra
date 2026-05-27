import { Card } from "./Card";

export function MetricCard({ icon: Icon, label, value, tone = "leaf" }) {
  const tones = {
    leaf: "bg-leaf-100 text-leaf-700",
    yellow: "bg-marigold-100 text-yellow-800",
    red: "bg-danger-50 text-danger-500",
    soil: "bg-soil-100 text-soil-500"
  };

  return (
    <Card className="min-h-28">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[8px] ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </Card>
  );
}
