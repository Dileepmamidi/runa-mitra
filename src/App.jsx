import { Navigate, Route, Routes } from "react-router-dom";
import { AppFrame } from "./components/AppFrame";
import { BorrowerFrame } from "./components/BorrowerFrame";
import { AuthGuard } from "./components/AuthGuard";
import { useApp } from "./context/AppContext";

// Lender Pages
import { AddBorrower } from "./pages/AddBorrower";
import { AddLoan } from "./pages/AddLoan";
import { AgreementGeneration } from "./pages/AgreementGeneration";
import { AadhaarVerification } from "./pages/AadhaarVerification";
import { Analytics } from "./pages/Analytics";
import { BackupRestore } from "./pages/BackupRestore";
import { BorrowerProfile } from "./pages/BorrowerProfile";
import { BorrowersList } from "./pages/BorrowersList";
import { Collateral } from "./pages/Collateral";
import { Communication } from "./pages/Communication";
import { DocumentsEvidence } from "./pages/DocumentsEvidence";
import { FamilyAccess } from "./pages/FamilyAccess";
import { Guarantor } from "./pages/Guarantor";
import { HomeDashboard } from "./pages/HomeDashboard";
import { InterestCalculator } from "./pages/InterestCalculator";
import { LoanDetails } from "./pages/LoanDetails";
import { PaymentEntry } from "./pages/PaymentEntry";
import { Profile } from "./pages/Profile";
import { ProfileSetup } from "./pages/ProfileSetup";
import { Reminders } from "./pages/Reminders";
import { RepaymentExtension } from "./pages/RepaymentExtension";
import { RiskAnalysis } from "./pages/RiskAnalysis";
import { ScanOldNote } from "./pages/ScanOldNote";
import { Settings } from "./pages/Settings";

// Borrower Pages
import { BorrowerHome } from "./pages/borrower/BorrowerHome";
import { BorrowerLoanDetails } from "./pages/borrower/BorrowerLoanDetails";
import { BorrowerPaymentHistory } from "./pages/borrower/BorrowerPaymentHistory";
import { BorrowerDocuments } from "./pages/borrower/BorrowerDocuments";
import { BorrowerExtensionRequest } from "./pages/borrower/BorrowerExtensionRequest";
import { BorrowerNotifications } from "./pages/borrower/BorrowerNotifications";

// Public Pages
import { LanguageSelection } from "./pages/LanguageSelection";
import { Login } from "./pages/Login";
import { Splash } from "./pages/Splash";

export default function App() {
  const { userRole, authLoading } = useApp();

  return (
    <Routes>
      {/* Public routes — no login needed */}
      <Route path="/" element={<Splash />} />
      <Route path="/language" element={<LanguageSelection />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes — must be logged in */}
      <Route element={<AuthGuard />}>
        
        {/* LENDER ROUTES */}
        {userRole === "lender" && (
          <Route element={<AppFrame />}>
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/home" element={<HomeDashboard />} />
            <Route path="/borrowers" element={<BorrowersList />} />
            <Route path="/borrowers/new" element={<AddBorrower />} />
            <Route path="/borrowers/:id" element={<BorrowerProfile />} />
            <Route path="/loans/new" element={<AddLoan />} />
            <Route path="/loans/:id" element={<LoanDetails />} />
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
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/backup" element={<BackupRestore />} />
            <Route path="/family-access" element={<FamilyAccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        )}

        {/* BORROWER ROUTES */}
        {userRole === "borrower" && (
          <Route element={<BorrowerFrame />}>
            <Route path="/home" element={<BorrowerHome />} />
            <Route path="/loans/:id" element={<BorrowerLoanDetails />} />
            <Route path="/payments" element={<BorrowerPaymentHistory />} />
            <Route path="/documents" element={<BorrowerDocuments />} />
            <Route path="/extensions/new" element={<BorrowerExtensionRequest />} />
            <Route path="/notifications" element={<BorrowerNotifications />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        )}

      </Route>
    </Routes>
  );
}
