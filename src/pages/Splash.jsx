import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function Splash() {
  const navigate = useNavigate();
  const { t } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/language"), 900);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <img src="/logo.svg" alt="Runa Mitra" className="mx-auto h-24 w-24 rounded-[24px] shadow-soft" />
        <h1 className="mt-6 text-3xl font-black text-leaf-700">{t.appName}</h1>
        <p className="mt-2 text-lg font-bold text-slate-700">{t.tagline}</p>
        <div className="mx-auto mt-8 h-2 w-44 overflow-hidden rounded-full bg-leaf-100">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-leaf-600" />
        </div>
      </div>
    </main>
  );
}
