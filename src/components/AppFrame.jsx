import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, Home, PlusCircle, User, UsersRound } from "lucide-react";
import { useApp } from "../context/AppContext";

const navItems = [
  { to: "/home", labelKey: "home", icon: Home },
  { to: "/borrowers", labelKey: "borrowers", icon: UsersRound },
  { to: "/loans/new", labelKey: "addLoan", icon: PlusCircle },
  { to: "/inbox", labelKey: "inbox", icon: Bell },
  { to: "/profile", labelKey: "profile", icon: User }
];

export function AppFrame() {
  const { t, lender } = useApp();
  const location = useLocation();
  const showChrome = !["/", "/language", "/login", "/profile-setup"].includes(location.pathname);

  if (!showChrome) return <Outlet />;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-soil-50/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-bold text-leaf-700">{t.appName}</p>
            <h1 className="text-lg font-black text-slate-950">{lender.village} లెక్కలు</h1>
          </div>
          <div className="rounded-full bg-white px-3 py-2 text-xs font-bold text-leaf-700 shadow-soft">
            {lender.mode}
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-4 md:px-6">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="safe-bottom mx-auto grid max-w-md grid-cols-5 gap-1 pt-2">
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-[8px] text-[11px] font-bold ${
                  isActive ? "bg-leaf-100 text-leaf-700" : "text-slate-500"
                }`
              }
            >
              <Icon size={21} />
              <span>{t[labelKey]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <aside className="fixed left-4 top-28 hidden w-52 rounded-[8px] bg-white p-2 shadow-soft md:block">
        {navItems.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `mb-1 flex min-h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-bold ${
                isActive ? "bg-leaf-100 text-leaf-700" : "text-slate-600"
              }`
            }
          >
            <Icon size={18} />
            {t[labelKey]}
          </NavLink>
        ))}
      </aside>
    </div>
  );
}
