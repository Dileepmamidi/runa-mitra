import { useNavigate } from "react-router-dom";
import { Languages } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ActionButton } from "../components/ActionButton";

export function LanguageSelection() {
  const { setLanguage, language } = useApp();
  const navigate = useNavigate();

  const choose = (next) => {
    setLanguage(next);
    navigate("/login");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <Languages className="mb-5 text-leaf-600" size={44} />
      <h1 className="text-3xl font-black text-slate-950">భాష ఎంచుకోండి</h1>
      <p className="mt-2 text-base font-semibold text-slate-600">Choose your preferred language</p>
      <div className="mt-8 grid gap-4">
        <button
          onClick={() => choose("te")}
          className={`rounded-[8px] bg-white p-5 text-left shadow-soft ring-2 ${
            language === "te" ? "ring-leaf-600" : "ring-transparent"
          }`}
        >
          <p className="text-2xl font-black text-slate-950">తెలుగు</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Default for Telangana and Andhra Pradesh</p>
        </button>
        <button
          onClick={() => choose("en")}
          className={`rounded-[8px] bg-white p-5 text-left shadow-soft ring-2 ${
            language === "en" ? "ring-leaf-600" : "ring-transparent"
          }`}
        >
          <p className="text-2xl font-black text-slate-950">English</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Simple English labels</p>
        </button>
      </div>
      <ActionButton className="mt-8" onClick={() => navigate("/login")}>
        Continue
      </ActionButton>
    </main>
  );
}
