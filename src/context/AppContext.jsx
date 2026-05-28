import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { orderBy, where } from "firebase/firestore";
import { auth } from "../config/firebase";
import { getUserProfile, listUserCollection } from "../services/firebaseService";
import { labels } from "../data/translations";

const AppContext = createContext(null);

const defaultLender = {
  name: "",
  village: "",
  businessType: "Money Lender",
  mode: "Basic"
};

export function AppProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem("runa-language") || "te");
  const [appMode, setAppMode] = useState(localStorage.getItem("runa-mode") || "Basic");
  const [user, setUser] = useState(null);
  const [lender, setLender] = useState(defaultLender);
  const [authLoading, setAuthLoading] = useState(true);

  // Real Firestore data
  const [borrowers, setBorrowers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);

  const loadUserData = useCallback(async (uid) => {
    try {
      const [b, l, p, r] = await Promise.all([
        listUserCollection(uid, "borrowers"),
        listUserCollection(uid, "loans"),
        listUserCollection(uid, "payments", [orderBy("createdAt", "desc")]),
        listUserCollection(uid, "reminders")
      ]);
      setBorrowers(b);
      setLoans(l);
      setPayments(p);
      setReminders(r);
    } catch {
      // Firestore not ready yet — keep empty arrays
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile?.profile) {
            setLender({ ...defaultLender, ...profile.profile });
            if (profile.profile.preferredLanguage) setLanguage(profile.profile.preferredLanguage);
            if (profile.profile.appMode) setAppMode(profile.profile.appMode);
          }
        } catch {
          // first time user — profile not created yet
        }
        await loadUserData(firebaseUser.uid);
      } else {
        setLender(defaultLender);
        setBorrowers([]);
        setLoans([]);
        setPayments([]);
        setReminders([]);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, [loadUserData]);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("runa-language");
    localStorage.removeItem("runa-mode");
  };

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
      t: labels[language] || labels["te"],
      lender: { ...lender, mode: appMode },
      user,
      authLoading,
      logout,
      // Firestore collections (empty until loaded)
      borrowers,
      loans,
      payments,
      reminders,
      // Refresh data manually when needed
      refreshData: () => user && loadUserData(user.uid)
    }),
    [appMode, language, user, lender, authLoading, borrowers, loans, payments, reminders, loadUserData]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
