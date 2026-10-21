import { useState } from "react";
import {
  ArrowLeftRight, Crown, Eye, BarChart3, Calculator, CalendarClock, Camera, Cloud, FileSignature, FolderOpen,
  Gem, History, IdCard, LogOut, MessageCircle, ReceiptText, Settings as SettingsIcon, ShieldCheck, User, UsersRound
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { ThemePicker } from "../components/ThemePicker";
import { saveUserProfile } from "../services/firebaseService";
import { List, ListRow, Notice, Screen, Section, Segmented } from "../ui";
import { moreMenuCopy } from "./MoreMenu.copy";

export function MoreMenu() {
  const { t, user, plan, language, setLanguage, availableRoles, switchRole, logout } = useApp();
  const s = useCopy(moreMenuCopy);
  const [error, setError] = useState("");

  const changeLanguage = async (next) => {
    setLanguage(next);
    setError("");
    try {
      if (user) await saveUserProfile(user.uid, { preferredLanguage: next });
    } catch {
      setError(s.languageSaveError);
    }
  };

  return (
    <Screen title={s.title}>
      <Section title={s.language}>
        <Segmented
          value={language}
          onChange={changeLanguage}
          options={[{ value: "te", label: "తెలుగు" }, { value: "en", label: "English" }]}
        />
        {error && <div className="mt-2"><Notice tone="warning">{error}</Notice></div>}
      </Section>

      <ThemePicker />

      <Section title={s.plan}>
        <List>
          <ListRow icon={Crown} title={s.planName(s.planNames[plan.id])} subtitle={s.planHint} to="/plans" />
        </List>
      </Section>

      <Section title={s.money}>
        <List>
          <ListRow icon={ReceiptText} title={s.recordPayment} to="/payments/new" />
          <ListRow icon={Calculator} title={s.calculator} to="/calculator" />
          <ListRow icon={CalendarClock} title={s.extensions} to="/extensions/new" />
        </List>
      </Section>

      <Section title={s.records}>
        <List>
          <ListRow icon={FileSignature} title={s.agreements} to="/agreements" />
          <ListRow icon={FolderOpen} title={s.documents} to="/documents" />
          <ListRow icon={Camera} title={s.scanNote} to="/scan-note" />
          <ListRow icon={UsersRound} title={s.guarantor} to="/guarantor" />
          <ListRow icon={Gem} title={s.collateral} to="/collateral" />
          <ListRow icon={IdCard} title={s.aadhaar} to="/aadhaar-verification" />
        </List>
      </Section>

      <Section title={s.insights}>
        <List>
          <ListRow icon={BarChart3} title={s.analytics} to="/analytics" />
          <ListRow icon={History} title={s.risk} to="/risk" />
          <ListRow icon={MessageCircle} title={s.communication} to="/communication" />
        </List>
      </Section>

      <Section title={s.account}>
        <List>
          <ListRow icon={User} title={s.profile} to="/profile" />
          <ListRow icon={SettingsIcon} title={s.settings} to="/settings" />
          <ListRow icon={Cloud} title={s.backup} to="/backup" />
          <ListRow icon={ShieldCheck} title={s.family} to="/family-access" />
          {availableRoles.includes("family") && (
            <ListRow icon={Eye} title={s.familyView} onClick={() => switchRole("family")} />
          )}
          {availableRoles.includes("borrower") && (
            <ListRow icon={ArrowLeftRight} title={t.switchToBorrower} onClick={() => switchRole("borrower")} />
          )}
          <ListRow icon={LogOut} title={t.logout} onClick={logout} chevron={false} />
        </List>
      </Section>
    </Screen>
  );
}
