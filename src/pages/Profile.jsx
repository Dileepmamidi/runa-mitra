import { ArrowLeftRight, BadgeCheck, Calculator, FileSignature, FolderOpen, LogOut, Pencil, Settings } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Avatar, Button, Card, DetailRow, List, ListRow, Screen, Section } from "../ui";
import { profileSetupCopy } from "./ProfileSetup.copy";
import { profileCopy } from "./Profile.copy";

export function Profile() {
  const { lender, logout, user, availableRoles, switchRole } = useApp();
  const s = useCopy(profileCopy);
  const setup = useCopy(profileSetupCopy);
  const name = lender.name || user?.phoneNumber || s.fallbackName;

  return (
    <Screen title={s.title}>
      <Card className="grid gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={name} src={lender.photoUrl || undefined} size={72} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[22px] font-extrabold text-ink">{name}</p>
          </div>
        </div>
        <div>
          <DetailRow label={s.phone} value={user?.phoneNumber || s.notSet} />
          <DetailRow label={s.village} value={lender.village || s.notSet} />
          <DetailRow label={s.work} value={setup.businessTypes[lender.businessType] || lender.businessType || s.notSet} />
        </div>
        <Button variant="soft" icon={Pencil} to="/profile-setup" block>{s.edit}</Button>
      </Card>

      <Section title={s.tools}>
        <List>
          <ListRow icon={Calculator} title={s.calculator} to="/calculator" />
          <ListRow icon={FileSignature} title={s.agreements} to="/agreements" />
          <ListRow icon={FolderOpen} title={s.documents} to="/documents" />
          <ListRow icon={BadgeCheck} title={s.aadhaar} to="/aadhaar-verification" />
          <ListRow icon={Settings} title={s.settings} to="/settings" />
        </List>
      </Section>

      <Section title={s.account}>
        <List>
          {availableRoles.includes("borrower") && (
            <ListRow icon={ArrowLeftRight} title={s.switchToBorrower} onClick={() => switchRole("borrower")} />
          )}
          <ListRow icon={LogOut} title={s.logout} onClick={logout} chevron={false} />
        </List>
      </Section>
    </Screen>
  );
}
