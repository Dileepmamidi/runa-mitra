import { createContext, useContext, useMemo, useState } from "react";
import { borrowers, lender, loans, payments, reminders } from "../data/mockData";
import { labels } from "../data/translations";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem("runa-language") || "te");
  const [appMode, setAppMode] = useState(localStorage.getItem("runa-mode") || lender.mode);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next) => {
        localStorage.setItem("runa-language", next);
        setLanguage(next);
      },
      appMode,
      setAppMode: (next) => {
        localStorage.setItem("runa-mode", next);
        setAppMode(next);
      },
      t: labels[language],
      lender: { ...lender, mode: appMode },
      borrowers,
      loans,
      payments,
      reminders
    }),
    [appMode, language]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
