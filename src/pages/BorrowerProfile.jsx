import { Link, useParams } from "react-router-dom";
import { BadgeCheck, MessageCircle, Phone, Plus, StickyNote, FileText, Download } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { currency } from "../utils/loanMath";
import { useEffect, useState } from "react";
import { listUserCollection } from "../services/firebaseService";

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
  const { user, borrowers, loans, payments } = useApp();
  const borrower = borrowers.find((item) => item.id === id) || borrowers[0];
  const borrowerLoans = loans.filter((loan) => loan.borrowerId === borrower.id);
  
  const [evidences, setEvidences] = useState([]);

  useEffect(() => {
    if (user && borrower) {
      listUserCollection(user.uid, "evidence").then((all) => {
        setEvidences(all.filter((e) => e.borrowerId === borrower.id));
      });
    }
  }, [user, borrower]);

  if (!borrower) return <div className="p-10 text-center">Loading borrower...</div>;

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <Card>
        <div className="flex items-center gap-4">
          {borrower.photoUrl ? (
            <img src={borrower.photoUrl} alt="Borrower" className="h-20 w-20 rounded-full object-cover shadow-soft" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf-100 text-2xl font-black text-leaf-700">
              {borrower.name?.charAt(0) || "U"}
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-slate-950">{borrower.name}</h1>
            <p className="font-semibold text-slate-500">{borrower.occupation} · {borrower.village}</p>
            <div className="mt-2"><StatusBadge status={borrower.riskLevel || "Unknown"} /></div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          <ActionButton variant="secondary"><Phone size={18} /></ActionButton>
          <ActionButton variant="secondary"><MessageCircle size={18} /></ActionButton>
          <ActionButton variant="secondary"><Link to="/loans/new"><Plus size={18} /></Link></ActionButton>
          <ActionButton variant="secondary"><Link to="/aadhaar-verification"><BadgeCheck size={18} /></Link></ActionButton>
          <ActionButton variant="secondary"><Link to="/documents"><StickyNote size={18} /></Link></ActionButton>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle title="Personal Info" />
          {[
            ["Phone", borrower.mobile],
            ["WhatsApp", borrower.whatsapp],
            ["Address", borrower.address],
            ["Father", borrower.fatherName],
            ["Aadhaar status", borrower.aadhaarStatus || "Not verified"],
            borrower.aadhaarLast4 ? ["Aadhaar last 4", `XXXX XXXX ${borrower.aadhaarLast4}`] : null,
          ].filter(Boolean).map(([label, value]) => (
            <p key={label} className="mb-2 text-sm"><b>{label}:</b> {value}</p>
          ))}
        </Card>
        
        <Card>
          <SectionTitle title="Trust Details" />
          <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-leaf-600" style={{ width: `${borrower.trustScore || 50}%` }} />
          </div>
          <p className="text-3xl font-black text-leaf-700">{borrower.trustScore || 50}/100</p>
        </Card>

        <Card>
          <SectionTitle title="Loan Summary" />
          <div className="grid grid-cols-2 gap-2 text-center">
            <div><p className="text-2xl font-black">{borrowerLoans.length}</p><p className="text-xs font-bold text-slate-500">Total Loans</p></div>
            <div><p className="text-2xl font-black">{borrowerLoans.filter(l => l.balance === 0).length}</p><p className="text-xs font-bold text-slate-500">Cleared</p></div>
          </div>
          <p className="mt-4 rounded-[8px] bg-danger-50 p-3 font-black text-danger-500">
            Pending {currency(borrowerLoans.reduce((sum, l) => sum + l.balance, 0))}
          </p>
        </Card>

        <Card>
          <SectionTitle title="Contacts" />
          <div className="grid gap-3">
            <ContactCallRow label="Nominee" name={borrower.nomineeName} phone={borrower.nomineeMobile} />
            <ContactCallRow label="Guarantor" name={borrower.guarantorName} phone={borrower.guarantorMobile} />
            <ContactCallRow label="Emergency contact" name="Family" phone={borrower.familyContact} />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle title="Uploaded Evidence" />
        <Link to="/documents" className="mb-4 inline-flex items-center text-sm font-bold text-leaf-600 underline">
          <Plus size={16} className="mr-1" /> Add Evidence
        </Link>
        <div className="grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
          {borrower.aadhaarFileUrl && (
            <a href={borrower.aadhaarFileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[8px] bg-slate-50 p-3 hover:bg-slate-100">
              <span className="truncate">Aadhaar (Masked)</span>
              <FileText size={16} className="shrink-0 text-leaf-600" />
            </a>
          )}
          {evidences.map((ev) => (
            <a key={ev.id} href={ev.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[8px] bg-slate-50 p-3 hover:bg-slate-100">
              <span className="truncate">{ev.category}</span>
              <FileText size={16} className="shrink-0 text-leaf-600" />
            </a>
          ))}
          {!borrower.aadhaarFileUrl && evidences.length === 0 && (
             <p className="col-span-2 text-sm text-slate-400">No documents uploaded.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
