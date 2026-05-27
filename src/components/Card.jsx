export function Card({ children, className = "" }) {
  return <section className={`rounded-[8px] bg-white p-4 shadow-soft ${className}`}>{children}</section>;
}

export function SectionTitle({ title, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}
