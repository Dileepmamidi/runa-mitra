import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { currency } from "../utils/loanMath";
import { StatusBadge } from "./StatusBadge";

export function BorrowerCard({ borrower }) {
  return (
    <Link
      to={`/borrowers/${borrower.id}`}
      className="flex gap-3 rounded-[8px] bg-white p-4 shadow-soft transition active:scale-[0.99]"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-lg font-black text-leaf-700">
        {borrower.photo}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="truncate text-base font-black text-slate-950">{borrower.name}</h3>
            <p className="text-sm text-slate-500">{borrower.occupation}</p>
          </div>
          <StatusBadge status={borrower.status} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-danger-500">{currency(borrower.pendingAmount)}</span>
          <span className="text-slate-500">{borrower.dueDate}</span>
          <Phone size={17} className="text-leaf-600" />
        </div>
      </div>
    </Link>
  );
}
