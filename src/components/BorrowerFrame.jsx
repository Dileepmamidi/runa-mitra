import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, Home, FileText, Activity } from "lucide-react";
import { useApp } from "../context/AppContext";

const navItems = [
  { to: "/home", label: "My Loans", telugu: "నా రుణాలు", icon: Home },
  { to: "/payments", label: "History", telugu: "చెల్లింపులు", icon: Activity },
  { to: "/documents", label: "Docs", telugu: "పత్రాలు", icon: FileText },
  { to: "/notifications", label: "Updates", telugu: "సూచనలు", icon: Bell }
];

export function BorrowerFrame() {
  const { borrowerLink, borrowers } = useApp();
  const location = useLocation();
  const showChrome = !["/", "/language", "/login"].includes(location.pathname);

  // If the borrower context isn't fully loaded yet but they are routed here
  const myProfile = borrowers.length > 0 ? borrowers[0] : { name: "Borrower" };

  if (!showChrome) return <Outlet />;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/90 px-4 py-3 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-bold text-leaf-700">Runa Mitra (Borrower)</p>
            <h1 className="text-lg font-black text-slate-950">నమస్కారం, {myProfile.name}</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-4 pb-28 pt-4 md:px-6">
        <Outlet />
      </main>
      
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="safe-bottom mx-auto grid max-w-md grid-cols-4 gap-1 pt-2 pb-2">
          {navItems.map(({ to, label, telugu, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 rounded-[12px] text-[12px] font-bold ${
                  isActive ? "bg-leaf-100 text-leaf-700" : "text-slate-500 hover:bg-slate-50"
                }`
              }
            >
              <Icon size={24} />
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[10px] uppercase opacity-70">{label}</span>
                <span className="text-[13px]">{telugu}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </nav>
      
      <aside className="fixed left-4 top-28 hidden w-56 rounded-[12px] bg-white p-3 shadow-soft md:block">
        {navItems.map(({ to, label, telugu, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `mb-2 flex min-h-14 items-center gap-4 rounded-[10px] px-4 text-base font-bold ${
                isActive ? "bg-leaf-100 text-leaf-700" : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            <Icon size={22} />
            <div className="flex flex-col leading-tight">
              <span>{telugu}</span>
              <span className="text-[11px] font-semibold opacity-60 uppercase">{label}</span>
            </div>
          </NavLink>
        ))}
      </aside>
    </div>
  );
}
