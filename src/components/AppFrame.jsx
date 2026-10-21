import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Inbox, LayoutGrid, Plus, UsersRound, Mail } from "lucide-react";
import { useApp } from "../context/AppContext";
import { IconButton } from "../ui";

function Tab({ to, label, icon: Icon, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] tracking-tight font-bold transition ${
          isActive ? "text-brand-700" : "text-ink-muted"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${isActive ? "bg-brand-100" : ""}`}>
            <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
          </span>
          <span className="max-w-full truncate">{label}</span>
          {badge ? (
            <span className="absolute right-3 top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[11px] leading-[18px] text-white">{badge}</span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function TopBar({ title, subtitle, children }) {
  return (
    <header className="safe-top sticky top-0 z-20 border-b border-line/70 bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-xl items-center gap-3 px-4">
        <img src="/logo.svg" alt="" className="h-9 w-9 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-extrabold leading-tight text-ink">{title}</p>
          {subtitle && <p className="truncate text-[13px] font-semibold text-ink-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}

export function TabBar({ children }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-white/95 shadow-bar backdrop-blur-md no-print">
      <div className="safe-bottom mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 pt-1.5">{children}</div>
    </nav>
  );
}

export function AppFrame() {
  const { t, lender, payments, messages, pendingInvites } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const showChrome = !["/", "/language", "/login", "/profile-setup"].includes(location.pathname);

  if (!showChrome) return <Outlet />;

  const inboxCount =
    payments.filter((p) => p.status === "pending_verification").length +
    messages.filter((m) => m.status === "pending").length;

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar title={lender.name || t.appName} subtitle={`${t.lenderMode}${lender.village ? ` · ${lender.village}` : ""}`}>
        {pendingInvites.length > 0 && (
          <IconButton icon={Mail} label={t.invitations} badge={pendingInvites.length} onClick={() => navigate("/invitations")} />
        )}
      </TopBar>
      <main className="mx-auto max-w-xl overflow-x-clip px-4 pb-32 pt-5">
        <Outlet />
      </main>
      <TabBar>
        <Tab to="/home" label={t.home} icon={Home} />
        <Tab to="/borrowers" label={t.borrowers} icon={UsersRound} />
        <NavLink to="/loans/new" aria-label={t.addLoan} className="flex flex-col items-center justify-center gap-1 text-[12px] font-bold text-brand-700">
          <span className="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lift active:scale-95">
            <Plus size={28} strokeWidth={2.5} />
          </span>
          <span className="truncate">{t.addLoan}</span>
        </NavLink>
        <Tab to="/inbox" label={t.inbox} icon={Inbox} badge={inboxCount} />
        <Tab to="/more" label={t.more} icon={LayoutGrid} />
      </TabBar>
    </div>
  );
}
