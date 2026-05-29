import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { orderBy, where } from "firebase/firestore";
import { auth } from "../config/firebase";
import { getUserProfile, listUserCollection, checkBorrowerLink } from "../services/firebaseService";
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
  
  // Roles: "lender", "borrower", or null
  const [userRole, setUserRole] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [borrowerLink, setBorrowerLink] = useState(null); // { lenderUid, borrowerId }

  const [lender, setLender] = useState(defaultLender);
  const [authLoading, setAuthLoading] = useState(true);

  // Real Firestore data
  const [borrowers, setBorrowers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [messages, setMessages] = useState([]);

  const loadLenderData = useCallback(async (uid) => {
    try {
      const [b, l, p, r, a, e, m] = await Promise.all([
        listUserCollection(uid, "borrowers"),
        listUserCollection(uid, "loans"),
        listUserCollection(uid, "payments", [orderBy("createdAt", "desc")]),
        listUserCollection(uid, "reminders"),
        listUserCollection(uid, "agreements"),
        listUserCollection(uid, "evidence"),
        listUserCollection(uid, "messages", [orderBy("createdAt", "desc")])
      ]);
      setBorrowers(b);
      setLoans(l);
      setPayments(p);
      setReminders(r);
      setAgreements(a);
      setEvidence(e);
      setMessages(m);
    } catch {
      // Firestore not ready yet — keep empty arrays
    }
  }, []);

  const loadBorrowerData = useCallback(async (link) => {
    const lenderUid = link.lenderUid;
    const myBorrowerId = link.borrowerId;
    if (!lenderUid || !myBorrowerId) return;

    const safe = async (fn) => { try { return await fn(); } catch { return []; } };

    const [b, l, p, r, a, e, m] = await Promise.all([
      safe(() => listUserCollection(lenderUid, "borrowers")),
      safe(() => listUserCollection(lenderUid, "loans", [where("borrowerId", "==", myBorrowerId)])),
      safe(() => listUserCollection(lenderUid, "payments", [where("borrowerId", "==", myBorrowerId)])),
      safe(() => listUserCollection(lenderUid, "reminders", [where("borrowerId", "==", myBorrowerId)])),
      safe(() => listUserCollection(lenderUid, "agreements", [where("borrowerId", "==", myBorrowerId)])),
      safe(() => listUserCollection(lenderUid, "evidence", [where("borrowerId", "==", myBorrowerId)])),
      safe(() => listUserCollection(lenderUid, "messages", [where("borrowerId", "==", myBorrowerId)])),
    ]);

    setBorrowers(b.filter(x => x.id === myBorrowerId));
    setLoans(l);
    setPayments(p);
    setReminders(r);
    setAgreements(a);
    setEvidence(e);
    setMessages(m);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Check both profiles
          const profile = await getUserProfile(firebaseUser.uid);
          const link = await checkBorrowerLink(firebaseUser.phoneNumber);
          
          const roles = [];
          if (profile?.profile) roles.push("lender");
          if (link) roles.push("borrower");
          
          setAvailableRoles(roles);

          if (profile?.profile) {
            setLender({ ...defaultLender, ...profile.profile });
            if (profile.profile.preferredLanguage) setLanguage(profile.profile.preferredLanguage);
            if (profile.profile.appMode) setAppMode(profile.profile.appMode);
          }
          if (link) {
            setBorrowerLink(link);
          }

          // Decide initial active role
          if (roles.includes("lender")) {
            setUserRole("lender");
            await loadLenderData(firebaseUser.uid);
          } else if (roles.includes("borrower")) {
            setUserRole("borrower");
            await loadBorrowerData(link);
          } else {
            // New user with no profile and no link. Default to Lender creation path.
            setUserRole("lender");
            await loadLenderData(firebaseUser.uid);
          }
        } catch (error) {
          console.error("Auth routing error:", error);
        }
      } else {
        setUserRole(null);
        setAvailableRoles([]);
        setBorrowerLink(null);
        setLender(defaultLender);
        setBorrowers([]);
        setLoans([]);
        setPayments([]);
        setReminders([]);
        setAgreements([]);
        setEvidence([]);
        setMessages([]);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, [loadLenderData, loadBorrowerData]);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("runa-language");
    localStorage.removeItem("runa-mode");
  };

  const refreshData = async () => {
    if (!user) return;
    if (userRole === "lender") await loadLenderData(user.uid);
    if (userRole === "borrower" && borrowerLink) await loadBorrowerData(borrowerLink);
  };

  const switchRole = async (newRole) => {
    if (!user) return;
    // Clear stale data immediately before loading new role's data
    setBorrowers([]);
    setLoans([]);
    setPayments([]);
    setReminders([]);
    setAgreements([]);
    setEvidence([]);
    setMessages([]);
    setUserRole(newRole);
    if (newRole === "lender") await loadLenderData(user.uid);
    if (newRole === "borrower" && borrowerLink) await loadBorrowerData(borrowerLink);
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
      userRole,
      availableRoles,
      borrowerLink,
      authLoading,
      logout,
      // Firestore collections (empty until loaded)
      borrowers,
      loans,
      payments,
      reminders,
      agreements,
      evidence,
      messages,
      refreshData,
      switchRole
    }),
    [appMode, language, user, userRole, availableRoles, borrowerLink, lender, authLoading, borrowers, loans, payments, reminders, agreements, evidence, messages]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
