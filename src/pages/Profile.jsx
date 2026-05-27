import { Link } from "react-router-dom";
import { BadgeCheck, Calculator, FileSignature, LogOut, ScanLine, Settings, Shield, UsersRound } from "lucide-react";
import { Card } from "../components/Card";
import { useApp } from "../context/AppContext";

export function Profile() {
  const { lender, logout, user } = useApp();

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

  const initials = lender.name
    ? lender.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.phoneNumber?.slice(-2) || "రా");

  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf-100 text-2xl font-black text-leaf-700">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-black">{lender.name || user?.phoneNumber || "Lender"}</h1>
            <p className="font-semibold text-slate-500">{lender.village} · {lender.businessType}</p>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-3">
        {links.map(([to, label, Icon]) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-14 items-center gap-3 rounded-[8px] bg-white p-4 font-bold text-slate-800 shadow-soft"
          >
            <Icon size={19} className="text-leaf-700" />
            {label}
          </Link>
        ))}
        <Link to="/backup" className="flex min-h-14 items-center gap-3 rounded-[8px] bg-white p-4 font-bold text-slate-800 shadow-soft">
          Backup & Restore
        </Link>
        <Link to="/family-access" className="flex min-h-14 items-center gap-3 rounded-[8px] bg-white p-4 font-bold text-slate-800 shadow-soft">
          Family Access
        </Link>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex min-h-14 w-full items-center gap-3 rounded-[8px] bg-red-50 p-4 font-bold text-red-600 shadow-soft hover:bg-red-100 active:bg-red-200"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </div>
  );
}
