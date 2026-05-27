export function ChartBars({ data, color = "bg-leaf-600" }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="flex h-40 items-end gap-3 rounded-[8px] bg-soil-50 p-3">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full items-end">
            <div
              className={`w-full rounded-t-[8px] ${color}`}
              style={{ height: `${Math.max(16, (item.value / max) * 100)}%` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
