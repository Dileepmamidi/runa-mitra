import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppFrame } from "./components/AppFrame";
import { BorrowerFrame } from "./components/BorrowerFrame";
import { AuthGuard } from "./components/AuthGuard";
import { LoadingScreen } from "./components/LoadingScreen";
import { NativeBridge } from "./components/NativeBridge";
import { useApp } from "./context/AppContext";

// Screens load on demand so the app starts faster on phones.
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));


// Lender Pages
const AddBorrower = page(() => import("./pages/AddBorrower"), "AddBorrower");
const AddLoan = page(() => import("./pages/AddLoan"), "AddLoan");
const EditLoan = page(() => import("./pages/EditLoan"), "EditLoan");
const AgreementGeneration = page(() => import("./pages/AgreementGeneration"), "AgreementGeneration");
const AadhaarVerification = page(() => import("./pages/AadhaarVerification"), "AadhaarVerification");
const Analytics = page(() => import("./pages/Analytics"), "Analytics");
const BackupRestore = page(() => import("./pages/BackupRestore"), "BackupRestore");
const BorrowerProfile = page(() => import("./pages/BorrowerProfile"), "BorrowerProfile");
const EditBorrower = page(() => import("./pages/EditBorrower"), "EditBorrower");
const BorrowersList = page(() => import("./pages/BorrowersList"), "BorrowersList");
const Collateral = page(() => import("./pages/Collateral"), "Collateral");
const Communication = page(() => import("./pages/Communication"), "Communication");
const DocumentsEvidence = page(() => import("./pages/DocumentsEvidence"), "DocumentsEvidence");
const FamilyAccess = page(() => import("./pages/FamilyAccess"), "FamilyAccess");
const Guarantor = page(() => import("./pages/Guarantor"), "Guarantor");
const HomeDashboard = page(() => import("./pages/HomeDashboard"), "HomeDashboard");
const InterestCalculator = page(() => import("./pages/InterestCalculator"), "InterestCalculator");
const LenderInbox = page(() => import("./pages/LenderInbox"), "LenderInbox");
const LoanDetails = page(() => import("./pages/LoanDetails"), "LoanDetails");
const PaymentEntry = page(() => import("./pages/PaymentEntry"), "PaymentEntry");
const Profile = page(() => import("./pages/Profile"), "Profile");
const ProfileSetup = page(() => import("./pages/ProfileSetup"), "ProfileSetup");
const RepaymentExtension = page(() => import("./pages/RepaymentExtension"), "RepaymentExtension");
const RiskAnalysis = page(() => import("./pages/RiskAnalysis"), "RiskAnalysis");
const ScanOldNote = page(() => import("./pages/ScanOldNote"), "ScanOldNote");
const Settings = page(() => import("./pages/Settings"), "Settings");
const MoreMenu = page(() => import("./pages/MoreMenu"), "MoreMenu");
const Plans = page(() => import("./pages/Plans"), "Plans");
const FamilyView = page(() => import("./pages/family/FamilyView"), "FamilyView");

// Borrower Pages
const BorrowerHome = page(() => import("./pages/borrower/BorrowerHome"), "BorrowerHome");
const BorrowerLoanDetails = page(() => import("./pages/borrower/BorrowerLoanDetails"), "BorrowerLoanDetails");
const BorrowerPaymentHistory = page(() => import("./pages/borrower/BorrowerPaymentHistory"), "BorrowerPaymentHistory");
const BorrowerDocuments = page(() => import("./pages/borrower/BorrowerDocuments"), "BorrowerDocuments");
const BorrowerExtensionRequest = page(() => import("./pages/borrower/BorrowerExtensionRequest"), "BorrowerExtensionRequest");
const BorrowerNotifications = page(() => import("./pages/borrower/BorrowerNotifications"), "BorrowerNotifications");
const BorrowerMakePayment = page(() => import("./pages/borrower/BorrowerMakePayment"), "BorrowerMakePayment");
const BorrowerMore = page(() => import("./pages/borrower/BorrowerMore"), "BorrowerMore");
const BorrowerHelp = page(() => import("./pages/borrower/BorrowerHelp"), "BorrowerHelp");

// Public Pages
const LanguageSelection = page(() => import("./pages/LanguageSelection"), "LanguageSelection");
const Login = page(() => import("./pages/Login"), "Login");
const Invitations = page(() => import("./pages/Invitations"), "Invitations");
const Splash = page(() => import("./pages/Splash"), "Splash");

export default function App() {
  const { userRole, authLoading, pendingInvites, pendingFamilyInvites, availableRoles } = useApp();
  // Let the opening logo animation play once at launch, even if sign-in
  // loads faster than that.
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 1300);
    return () => clearTimeout(timer);
  }, []);
  // A new user whose only connection is a pending invitation sees it first.
  const invitationsFirst = pendingInvites.length + pendingFamilyInvites.length > 0 && availableRoles.length === 0;

  if (authLoading || !introDone) {
    return (
      <LoadingScreen />
    );
  }

  return (
    <>
    <NativeBridge />
    <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* Public routes — no login needed */}
      <Route path="/" element={<Splash />} />
      <Route path="/language" element={<LanguageSelection />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes — must be logged in */}
      <Route element={<AuthGuard />}>
        <Route path="/invitations" element={<Invitations />} />
        {invitationsFirst && <Route path="*" element={<Navigate to="/invitations" replace />} />}

        {/* LENDER ROUTES */}
        {invitationsFirst ? null : userRole === "lender" ? (
          <Route element={<AppFrame />}>
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/home" element={<HomeDashboard />} />
            <Route path="/borrowers" element={<BorrowersList />} />
            <Route path="/borrowers/new" element={<AddBorrower />} />
            <Route path="/borrowers/edit/:id" element={<EditBorrower />} />
            <Route path="/borrowers/:id" element={<BorrowerProfile />} />
            <Route path="/loans/new" element={<AddLoan />} />
            <Route path="/loans/:id" element={<LoanDetails />} />
            <Route path="/loans/edit/:id" element={<EditLoan />} />
            <Route path="/payments/new" element={<PaymentEntry />} />
            <Route path="/extensions/new" element={<RepaymentExtension />} />
            <Route path="/calculator" element={<InterestCalculator />} />
            <Route path="/agreements" element={<AgreementGeneration />} />
            <Route path="/aadhaar-verification" element={<AadhaarVerification />} />
            <Route path="/documents" element={<DocumentsEvidence />} />
            <Route path="/scan-note" element={<ScanOldNote />} />
            <Route path="/guarantor" element={<Guarantor />} />
            <Route path="/collateral" element={<Collateral />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/risk" element={<RiskAnalysis />} />
            <Route path="/inbox" element={<LenderInbox />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/backup" element={<BackupRestore />} />
            <Route path="/family-access" element={<FamilyAccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/more" element={<MoreMenu />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        ) : userRole === "borrower" ? (
          <Route element={<BorrowerFrame />}>
            <Route path="/home" element={<BorrowerHome />} />
            <Route path="/loans/:id" element={<BorrowerLoanDetails />} />
            <Route path="/payments" element={<BorrowerPaymentHistory />} />
            <Route path="/payments/new" element={<BorrowerMakePayment />} />
            <Route path="/documents" element={<BorrowerDocuments />} />
            <Route path="/extensions/new" element={<BorrowerExtensionRequest />} />
            <Route path="/notifications" element={<BorrowerNotifications />} />
            <Route path="/more" element={<BorrowerMore />} />
            <Route path="/help" element={<BorrowerHelp />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        ) : userRole === "family" ? (
          <>
            <Route path="/home" element={<FamilyView />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Route>
    </Routes>
    </Suspense>
    </>
  );
}
