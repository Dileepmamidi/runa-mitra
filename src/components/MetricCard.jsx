import { Stat } from "../ui";

const toneMap = { leaf: "brand", yellow: "amber", red: "rose", soil: "ink" };

// Legacy wrapper — new code should use Stat from src/ui.
export function MetricCard({ icon, label, value, tone = "leaf" }) {
  return <Stat icon={icon} label={label} value={value} tone={toneMap[tone] || "ink"} />;
}
