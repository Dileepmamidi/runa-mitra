import { Search } from "lucide-react";
import { BorrowerCard } from "../components/BorrowerCard";
import { inputClass } from "../components/FormControls";
import { useApp } from "../context/AppContext";

export function BorrowersList() {
  const { borrowers } = useApp();
  const filters = ["Active", "Cleared", "Overdue", "High risk"];
  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">అప్పుదారులు</h1>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input className={`${inputClass} pl-11`} placeholder="Search by name, village, phone" />
      </div>
      <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto">
        {filters.map((filter) => (
          <button key={filter} className="min-h-10 shrink-0 rounded-full bg-white px-4 text-sm font-bold text-slate-700 shadow-soft">
            {filter}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        {borrowers.map((borrower) => <BorrowerCard key={borrower.id} borrower={borrower} />)}
      </div>
    </div>
  );
}
