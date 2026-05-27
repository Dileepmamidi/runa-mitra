const statusMap = {
  Paid: "bg-leaf-100 text-leaf-700",
  Cleared: "bg-leaf-100 text-leaf-700",
  Active: "bg-leaf-100 text-leaf-700",
  "Due Today": "bg-marigold-100 text-yellow-800",
  Upcoming: "bg-marigold-100 text-yellow-800",
  Overdue: "bg-danger-50 text-danger-500",
  High: "bg-danger-50 text-danger-500",
  Medium: "bg-marigold-100 text-yellow-800",
  Low: "bg-leaf-100 text-leaf-700"
};

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusMap[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
