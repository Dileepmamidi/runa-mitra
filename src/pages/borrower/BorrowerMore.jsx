import { ArrowLeftRight, HelpCircle, LogOut, Mail } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { Badge, List, ListRow, Notice, Screen, Section, Segmented } from "../../ui";
import { borrowerMoreCopy } from "./BorrowerMore.copy";

export function BorrowerMore() {
  const { language, setLanguage, availableRoles, switchRole, logout, pendingInvites } = useApp();
  const s = useCopy(borrowerMoreCopy);
  const isLender = availableRoles.includes("lender");

  return (
    <Screen title={s.title}>
      <Section title={s.language}>
        {/* Language is stored on this phone only. Saving it to the user profile
            would create a lender profile for a borrower, so we do not. */}
        <Segmented
          value={language}
          onChange={setLanguage}
          options={[{ value: "te", label: "తెలుగు" }, { value: "en", label: "English" }]}
        />
      </Section>

      <List>
        {pendingInvites.length > 0 && (
          <ListRow
            icon={Mail}
            title={s.invitations}
            to="/invitations"
            trailing={<Badge tone="amber">{s.invitationsCount(pendingInvites.length)}</Badge>}
          />
        )}
        <ListRow icon={HelpCircle} title={s.help} to="/help" />
        <ListRow
          icon={ArrowLeftRight}
          title={isLender ? s.lenderView : s.startLending}
          subtitle={isLender ? undefined : s.startLendingHint}
          onClick={() => switchRole("lender")}
        />
        <ListRow icon={LogOut} title={s.logout} onClick={logout} chevron={false} />
      </List>

      <Notice tone="info" title={s.privacyTitle}>
        {s.privacyText}
      </Notice>
    </Screen>
  );
}
