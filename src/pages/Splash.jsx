import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { splashCopy } from "./Onboarding.copy";

export function Splash() {
  const navigate = useNavigate();
  const { user } = useApp();
  const s = useCopy(splashCopy);

  useEffect(() => {
    const chosen = localStorage.getItem("runa-language");
    const next = user ? "/home" : chosen ? "/login" : "/language";
    const timer = setTimeout(() => navigate(next, { replace: true }), 700);
    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-700 to-brand-950 px-6 text-center text-white">
      <img src="/logo.svg" alt="" className="h-24 w-24 rounded-[28px] shadow-lift ring-4 ring-white/10" />
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight">{s.name}</h1>
      <p className="mt-2 max-w-xs text-[17px] font-medium text-white/80">{s.tagline}</p>
    </main>
  );
}
