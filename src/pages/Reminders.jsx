import { MessageCircle, Phone } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { currency } from "../utils/loanMath";

export function Reminders() {
  const { reminders } = useApp();
  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">గుర్తింపులు</h1>
      <div className="mt-4 grid gap-3">
        {reminders.map((reminder) => (
          <Card key={reminder.id}>
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-lg font-black">{reminder.borrowerName}</h2><p className="text-sm font-semibold text-slate-500">{reminder.dueDate} · {currency(reminder.amount)}</p></div>
              <StatusBadge status={reminder.status} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <ActionButton variant="secondary"><Phone size={18} /></ActionButton>
              <ActionButton variant="secondary"><MessageCircle size={18} /></ActionButton>
              <ActionButton>Sent</ActionButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
