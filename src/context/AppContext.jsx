import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { orderBy, where } from "firebase/firestore";
import { auth } from "../config/firebase";
import {
  acceptInvite as acceptInviteRecord,
  declineInvite as declineInviteRecord,
  getBorrowerAccess,
  getUserProfile,
  listMyInvites,
  listSharedRecords,
  listUserCollection,
  syncBorrowerSharing
} from "../services/firebaseService";
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
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const [appMode, setAppMode] = useState(localStorage.getItem("runa-mode") || "Basic");
  const [user, setUser] = useState(null);
  
  // Roles: "lender", "borrower", or null
  const [userRole, setUserRole] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [borrowerLink, setBorrowerLink] = useState(null); // [{ lenderUid, borrowerId, lenderName, borrowerName }]
  const [pendingInvites, setPendingInvites] = useState([]);

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
      // Share records with borrowers who accepted an invitation.
      syncBorrowerSharing(uid, b, { loans: l, payments: p, reminders: r, agreements: a, evidence: e, messages: m })
        .catch((err) => console.warn("Borrower sharing sync failed", err));
    } catch (err) {
      console.warn("Could not load lender data", err);
    }
  }, []);

  // Borrowers only ever query records stamped with their own uid; Firestore
  // rules reject anything else. The lender's borrower list (with private
  // notes) is never read from the borrower side.
  const loadBorrowerData = useCallback(async (links, borrowerUid) => {
    if (!Array.isArray(links) || links.length === 0 || !borrowerUid) return;

    const safe = async (fn) => { try { return await fn(); } catch (err) { console.warn(err); return []; } };
    const all = { loans: [], payments: [], reminders: [], agreements: [], evidence: [], messages: [] };
    const profiles = [];

    for (const link of links) {
      const { lenderUid, borrowerId } = link;
      if (!lenderUid || !borrowerId) continue;
      profiles.push({ id: borrowerId, name: link.borrowerName || "", lenderUid, lenderName: link.lenderName || "", _borrowerId: borrowerId });
      const results = await Promise.all(
        Object.keys(all).map((name) => safe(() => listSharedRecords(lenderUid, borrowerUid, name)))
      );
      Object.keys(all).forEach((name, i) => {
        all[name].push(
          ...results[i]
            .filter((doc) => doc.borrowerId === borrowerId)
            .map((doc) => ({ ...doc, lenderUid, lenderName: link.lenderName || "", _borrowerId: borrowerId }))
        );
      });
    }

    setBorrowers(profiles);
    setLoans(all.loans);
    setPayments(all.payments);
    setReminders(all.reminders);
    setAgreements(all.agreements);
    setEvidence(all.evidence);
    setMessages(all.messages);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Hold the loading screen until the role is known, so routing never
      // sees a signed-in user without a role (that used to bounce to /login).
      if (firebaseUser) setAuthLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Check both profiles
          const profile = await getUserProfile(firebaseUser.uid);
          const linksArray = await getBorrowerAccess(firebaseUser.uid).catch(() => []);
          const invites = await listMyInvites(firebaseUser.phoneNumber);
          const linkedKeys = new Set(linksArray.map((x) => `${x.lenderUid}_${x.borrowerId}`));
          setPendingInvites(
            invites.filter((i) => i.status === "pending" && !linkedKeys.has(`${i.lenderUid}_${i.borrowerId}`) && i.lenderUid !== firebaseUser.uid)
          );

          const roles = [];
          if (profile?.profile) roles.push("lender");
          if (linksArray.length > 0) roles.push("borrower");
          
          setAvailableRoles(roles);

          if (profile?.profile) {
            setLender({ ...defaultLender, ...profile.profile });
            if (profile.profile.preferredLanguage) setLanguage(profile.profile.preferredLanguage);
            if (profile.profile.appMode) setAppMode(profile.profile.appMode);
          }
          if (linksArray.length > 0) {
            setBorrowerLink(linksArray);
          }

          // Decide initial active role
          if (roles.includes("lender")) {
            setUserRole("lender");
            await loadLenderData(firebaseUser.uid);
          } else if (roles.includes("borrower")) {
            setUserRole("borrower");
            await loadBorrowerData(linksArray, firebaseUser.uid);
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
        setPendingInvites([]);
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
    if (userRole === "lender") {
      // Pick up profile edits (name, village, mode) without a reload.
      const profile = await getUserProfile(user.uid).catch(() => null);
      if (profile?.profile) {
        setLender({ ...defaultLender, ...profile.profile });
        setAvailableRoles((prev) => (prev.includes("lender") ? prev : ["lender", ...prev]));
      }
      await loadLenderData(user.uid);
    }
    if (userRole === "borrower" && borrowerLink?.length > 0) await loadBorrowerData(borrowerLink, user.uid);
  };

  // Borrower explicitly accepts or declines a lender's invitation.
  const respondToInvite = async (invite, accept) => {
    if (!user) return;
    if (accept) await acceptInviteRecord(user, invite);
    else await declineInviteRecord(user, invite);
    const links = await getBorrowerAccess(user.uid).catch(() => []);
    setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
    if (accept) {
      setBorrowerLink(links);
      setAvailableRoles((prev) => (prev.includes("borrower") ? prev : [...prev, "borrower"]));
      if (!availableRoles.includes("lender")) {
        setUserRole("borrower");
        await loadBorrowerData(links, user.uid);
      }
    }
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
    if (newRole === "borrower" && borrowerLink?.length > 0) await loadBorrowerData(borrowerLink, user.uid);
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
      pendingInvites,
      respondToInvite,
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
    [appMode, language, user, userRole, availableRoles, borrowerLink, pendingInvites, lender, authLoading, borrowers, loans, payments, reminders, agreements, evidence, messages]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
