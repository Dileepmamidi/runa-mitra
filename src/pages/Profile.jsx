import { Link } from "react-router-dom";
import { BadgeCheck, Calculator, FileSignature, ScanLine, Settings, Shield, UsersRound } from "lucide-react";
import { Card } from "../components/Card";
import { useApp } from "../context/AppContext";

export function Profile() {
  const { lender } = useApp();
  const links = [
    ["/calculator", "Interest Calculator", Calculator],
    ["/agreements", "Agreements", FileSignature],
    ["/aadhaar-verification", "Aadhaar Verification", BadgeCheck],
    ["/documents", "Documents & Evidence", FileSignature],
    ["/scan-note", "Scan Old Note", ScanLine],
    ["/communication", "Communication", UsersRound],
    ["/guarantor", "Guarantor", UsersRound],
    ["/collateral", "Security Details", Shield],
    ["/analytics", "Analytics", UsersRound],
    ["/risk", "Risk Analysis", Shield],
    ["/settings", "Settings", Settings]
  ];
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf-100 text-2xl font-black text-leaf-700">రా</div>
          <div><h1 className="text-2xl font-black">{lender.name}</h1><p className="font-semibold text-slate-500">{lender.village} · {lender.businessType}</p></div>
        </div>
      </Card>
      <div className="mt-4 grid gap-3">
        {links.map(([to, label, Icon]) => (
          <Link key={to} to={to} className="flex min-h-14 items-center gap-3 rounded-[8px] bg-white p-4 font-bold text-slate-800 shadow-soft"><Icon size={19} className="text-leaf-700" />{label}</Link>
        ))}
        <Link to="/backup" className="flex min-h-14 items-center gap-3 rounded-[8px] bg-white p-4 font-bold text-slate-800 shadow-soft">Backup & Restore</Link>
        <Link to="/family-access" className="flex min-h-14 items-center gap-3 rounded-[8px] bg-white p-4 font-bold text-slate-800 shadow-soft">Family Access</Link>
      </div>
    </div>
  );
}
