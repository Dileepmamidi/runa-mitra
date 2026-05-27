import { Link, useParams } from "react-router-dom";
import { BadgeCheck, MessageCircle, Phone, Plus, StickyNote } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { currency } from "../utils/loanMath";

function ContactCallRow({ label, name, phone }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] bg-slate-50 p-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="truncate font-black text-slate-950">{name || "Optional / not added"}</p>
        <p className="text-sm font-semibold text-slate-600">{phone || "No mobile number"}</p>
      </div>
      {phone ? (
        <a
          href={`tel:${phone}`}
          aria-label={`Call ${label}`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-leaf-600 text-white shadow-soft"
        >
          <Phone size={18} />
        </a>
      ) : (
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-slate-100 text-slate-400">
          <Phone size={18} />
        </div>
      )}
    </div>
  );
}

export function BorrowerProfile() {
  const { id } = useParams();
  const { borrowers, loans, payments } = useApp();
  const borrower = borrowers.find((item) => item.id === id) || borrowers[0];
  const borrowerLoans = loans.filter((loan) => loan.borrowerId === borrower.id);

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf-100 text-2xl font-black text-leaf-700">{borrower.photo}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-slate-950">{borrower.name}</h1>
            <p className="font-semibold text-slate-500">{borrower.occupation} · {borrower.village}</p>
            <div className="mt-2"><StatusBadge status={borrower.riskLevel} /></div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          <ActionButton variant="secondary"><Phone size={18} /></ActionButton>
          <ActionButton variant="secondary"><MessageCircle size={18} /></ActionButton>
          <ActionButton variant="secondary"><Link to="/loans/new"><Plus size={18} /></Link></ActionButton>
          <ActionButton variant="secondary"><Link to="/aadhaar-verification"><BadgeCheck size={18} /></Link></ActionButton>
          <ActionButton variant="secondary"><StickyNote size={18} /></ActionButton>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle title="Personal Info" />
          {[
            ["Phone", borrower.phone],
            ["WhatsApp", borrower.whatsapp],
            ["Address", borrower.address],
            ["Father", borrower.fatherName],
            ["Aadhaar last 4", borrower.aadhaarLast4 ? `XXXX XXXX ${borrower.aadhaarLast4}` : "Optional"],
            ["Aadhaar status", borrower.aadhaarStatus || "Not verified"]
          ].map(([label, value]) => (
            <p key={label} className="mb-2 text-sm"><b>{label}:</b> {value}</p>
          ))}
        </Card>
        <Card>
          <SectionTitle title="Trust Details" />
          <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-leaf-600" style={{ width: `${borrower.trustScore}%` }} />
          </div>
          <p className="text-3xl font-black text-leaf-700">{borrower.trustScore}/100</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{borrower.notes}</p>
        </Card>
        <Card>
          <SectionTitle title="Loan Summary" />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-2xl font-black">{borrower.totalLoans}</p><p className="text-xs font-bold text-slate-500">Total</p></div>
            <div><p className="text-2xl font-black">{borrower.totalLoans - borrower.clearedLoans}</p><p className="text-xs font-bold text-slate-500">Active</p></div>
            <div><p className="text-2xl font-black">{borrower.clearedLoans}</p><p className="text-xs font-bold text-slate-500">Cleared</p></div>
          </div>
          <p className="mt-4 rounded-[8px] bg-danger-50 p-3 font-black text-danger-500">Pending {currency(borrower.pendingAmount)}</p>
        </Card>
        <Card>
          <SectionTitle title="Contacts" />
          <div className="grid gap-3">
            <ContactCallRow label="Nominee" name={borrower.nominee} phone={borrower.nomineePhone} />
            <ContactCallRow label="Guarantor" name={borrower.guarantor} phone={borrower.guarantorPhone} />
            <ContactCallRow label="Family contact" name="Emergency contact" phone={borrower.familyContactPhone} />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle title="Timeline" />
        {[...borrowerLoans, ...payments.slice(0, 2)].map((item, index) => (
          <div key={`${item.id}-${index}`} className="border-l-4 border-leaf-100 py-3 pl-4">
            <p className="font-bold text-slate-950">{item.principal ? "Loan added" : "Payment received"}</p>
            <p className="text-sm text-slate-500">{item.date} · {currency(item.principal || item.amount || 0)}</p>
          </div>
        ))}
      </Card>

      <Card className="mt-4">
        <SectionTitle title="Uploaded Evidence" />
        <div className="grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
          {["Loan notes", "Photos", "Voice recordings", "Documents", "Aadhaar verification"].map((item) => (
            <div key={item} className="rounded-[8px] bg-slate-50 p-3">{item}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
