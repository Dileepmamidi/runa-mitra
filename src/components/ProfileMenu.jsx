import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, ChevronDown, LogOut, User } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Avatar } from "../ui";
import { profileMenuCopy } from "./ProfileMenu.copy";

// Right side of the header: the person's photo and name. Tapping opens a
// small menu with their profile, switching between roles and signing out.
export function ProfileMenu({ name, photoUrl, profilePath }) {
  const { user, userRole, availableRoles, switchRole, logout } = useApp();
  const s = useCopy(profileMenuCopy);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };
  const toRole = (role) => {
    setOpen(false);
    switchRole(role);
    navigate("/home");
  };
  const otherRoles = availableRoles.filter((r) => r !== userRole);
  const roleLabel = { lender: s.lenderView, borrower: s.borrowerView, family: s.familyView };
  const displayName = name || user?.phoneNumber || "";

  const item = "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-bold text-ink active:bg-ink/5 hover:bg-ink/5";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={s.open}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2 shadow-soft transition active:scale-95"
      >
        <Avatar name={displayName} src={photoUrl} size={34} />
        <span className="hidden max-w-[110px] truncate text-[14px] font-bold text-ink min-[380px]:block">{displayName}</span>
        <ChevronDown size={16} className={`text-ink-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-72 animate-scale-in rounded-2xl border border-line bg-surface p-2 shadow-lift" role="menu">
          <div className="flex items-center gap-3 px-2 pb-3 pt-2">
            <Avatar name={displayName} src={photoUrl} size={48} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-ink-muted">{s.signedInAs}</p>
              <p className="truncate text-[16px] font-extrabold text-ink">{displayName}</p>
              {user?.phoneNumber && name && <p className="truncate text-[13px] font-medium text-ink-muted">{user.phoneNumber}</p>}
            </div>
          </div>
          <div className="border-t border-line pt-1">
            {profilePath && (
              <button type="button" role="menuitem" className={item} onClick={() => go(profilePath)}>
                <User size={19} className="text-brand-700" /> {s.myProfile}
              </button>
            )}
            {otherRoles.map((role) => (
              <button key={role} type="button" role="menuitem" className={item} onClick={() => toRole(role)}>
                <ArrowLeftRight size={19} className="text-brand-700" /> {roleLabel[role]}
              </button>
            ))}
            {!confirming ? (
              <button type="button" role="menuitem" className={`${item} text-rose-600`} onClick={() => setConfirming(true)}>
                <LogOut size={19} /> {s.signOut}
              </button>
            ) : (
              <div className="m-1 rounded-xl bg-rose-50 p-3">
                <p className="text-[14px] font-bold text-ink">{s.confirmSignOut}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" className="min-h-11 rounded-xl border border-line bg-surface font-bold text-ink" onClick={() => setConfirming(false)}>
                    {s.cancel}
                  </button>
                  <button type="button" className="min-h-11 rounded-xl bg-rose-600 font-bold text-white" onClick={() => { setOpen(false); logout(); }}>
                    {s.yesSignOut}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
