import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Button } from "../ui";
import { Logo } from "../components/Logo";
import { languageCopy } from "./Onboarding.copy";

function LanguageOption({ selected, title, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[84px] items-center gap-4 rounded-2xl border-2 bg-surface px-5 animate-fade-up text-left shadow-soft transition active:scale-[0.99] ${
        selected ? "border-brand-600" : "border-transparent"
      }`}
    >
      <span className="flex-1">
        <span className="block text-[26px] font-extrabold text-ink">{title}</span>
        <span className="block text-sm font-semibold text-ink-muted">{hint}</span>
      </span>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${selected ? "bg-brand-600 text-white" : "border-2 border-line"}`}>
        {selected && <Check size={18} strokeWidth={3} />}
      </span>
    </button>
  );
}

export function LanguageSelection() {
  const { setLanguage, language } = useApp();
  const navigate = useNavigate();
  const s = useCopy(languageCopy);

  return (
    <main className="safe-top mx-auto flex min-h-screen max-w-md flex-col bg-canvas px-5 pb-8">
      <div className="flex-1 pt-16">
        <Logo size={72} animated />
        <h1 className="mt-6 text-[30px] font-extrabold leading-tight text-ink">{s.title}</h1>
        <p className="mt-2 text-[16px] font-medium text-ink-soft">{s.subtitle}</p>
        <div className="mt-8 grid gap-3">
          <LanguageOption selected={language === "te"} title="తెలుగు" hint={s.teluguHint} onClick={() => setLanguage("te")} />
          <LanguageOption selected={language === "en"} title="English" hint={s.englishHint} onClick={() => setLanguage("en")} />
        </div>
      </div>
      <Button size="lg" block onClick={() => { setLanguage(language); navigate("/login"); }}>
        {s.continue}
      </Button>
    </main>
  );
}
