import { Card as UICard } from "../ui";

// Legacy wrappers — new code should use Card / Section from src/ui.
export function Card({ children, className = "" }) {
  return <UICard className={className}>{children}</UICard>;
}

export function SectionTitle({ title, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      {action}
    </div>
  );
}
