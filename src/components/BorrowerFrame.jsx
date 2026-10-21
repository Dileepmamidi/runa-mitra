import { Outlet, useLocation } from "react-router-dom";
import { Bell, FileText, Home, LayoutGrid, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { TabBar, TopBar } from "./AppFrame";

function Tab({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold tracking-tight ${isActive ? "text-brand-700" : "text-ink-muted"}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex h-8 w-14 items-center justify-center rounded-full ${isActive ? "bg-brand-100" : ""}`}>
            <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
          </span>
          <span className="max-w-full truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function BorrowerFrame() {
  const { t, borrowers } = useApp();
  const location = useLocation();
  const showChrome = !["/", "/language", "/login"].includes(location.pathname);
  const name = borrowers[0]?.name || "";

  if (!showChrome) return <Outlet />;

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar title={name || t.appName} subtitle={t.borrowerMode} />
      <main className="mx-auto max-w-xl overflow-x-clip px-4 pb-32 pt-5">
        <Outlet />
      </main>
      <TabBar>
        <Tab to="/home" label={t.home} icon={Home} />
        <Tab to="/payments" label={t.payments} icon={Wallet} />
        <Tab to="/documents" label={t.documents} icon={FileText} />
        <Tab to="/notifications" label={t.updates} icon={Bell} />
        <Tab to="/more" label={t.more} icon={LayoutGrid} />
      </TabBar>
    </div>
  );
}
