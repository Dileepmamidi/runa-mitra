// Simple bar chart. `data` = [{ label, value, display? }]. The tallest bar is
// labelled with its value; every bar has an accessible title.
export function ChartBars({ data }) {
  const max = Math.max(...data.map((item) => item.value), 0);
  return (
    <div className="flex h-44 items-end gap-2" role="img" aria-label={data.map((d) => `${d.label}: ${d.display ?? d.value}`).join(", ")}>
      {data.map((item) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="tabular text-[11px] font-bold text-ink-muted">{item.value > 0 && item.value === max ? item.display ?? item.value : ""}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-lg ${item.value > 0 ? "bg-brand-500" : "bg-line"}`}
                style={{ height: `${item.value > 0 ? Math.max(6, pct) : 3}%` }}
                title={`${item.label}: ${item.display ?? item.value}`}
              />
            </div>
            <span className="text-[12px] font-bold text-ink-muted">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
