import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Eye, Mail, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Badge, Button, Card, DetailRow, EmptyState, Notice, Screen, Section } from "../ui";
import { invitationsCopy } from "./Invitations.copy";

export function Invitations() {
  const { pendingInvites, respondToInvite, pendingFamilyInvites = [], respondToFamilyInvite } = useApp();
  const navigate = useNavigate();
  const s = useCopy(invitationsCopy);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const respond = async (invite, accept) => {
    setError("");
    setMessage("");
    setBusy(invite.id);
    try {
      await respondToInvite(invite, accept);
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setBusy("");
    }
  };

  // Family access: read-only view of another lender's records.
  const respondFamily = async (invite, accept) => {
    setError("");
    setMessage("");
    setBusy(`family_${invite.lenderUid}`);
    try {
      await respondToFamilyInvite(invite, accept);
      if (accept) setMessage(s.familyAccepted);
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setBusy("");
    }
  };

  const nothing = pendingInvites.length === 0 && pendingFamilyInvites.length === 0;
  const showHeadings = pendingInvites.length > 0 && pendingFamilyInvites.length > 0;

  return (
    <div className="min-h-screen bg-canvas px-4 py-6">
      <Screen title={s.title} subtitle={pendingInvites.length > 0 || nothing ? s.intro : s.familyIntro}>
        {error && <Notice tone="error">{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}
        {nothing && <EmptyState icon={Mail} title={s.none} />}

        {pendingInvites.length > 0 && (
          <Section title={showHeadings ? s.loanSection : undefined}>
            <div className="grid gap-4">
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="grid gap-4">
                  <div>
                    <DetailRow label={s.from} value={invite.lenderName || s.unknown} />
                    <DetailRow label={s.as} value={invite.borrowerName || s.unknown} />
                  </div>
                  <div className="grid gap-2">
                    <Button size="lg" icon={Check} loading={busy === invite.id} disabled={Boolean(busy)} onClick={() => respond(invite, true)}>{s.accept}</Button>
                    <Button variant="secondary" icon={X} disabled={Boolean(busy)} onClick={() => respond(invite, false)}>{s.decline}</Button>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {pendingFamilyInvites.length > 0 && (
          <Section title={s.familySection}>
            <div className="grid gap-4">
              {showHeadings && <p className="px-1 text-[15px] font-medium text-ink-soft">{s.familyIntro}</p>}
              {pendingFamilyInvites.map((invite) => {
                const key = `family_${invite.lenderUid}`;
                return (
                  <Card key={key} className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Eye size={18} className="text-brand-700" />
                      <Badge tone="amber">{s.viewOnly}</Badge>
                    </div>
                    <div>
                      <DetailRow label={s.familyFrom} value={invite.lenderName || s.unknown} />
                      <DetailRow label={s.familyAs} value={invite.memberName || s.unknown} />
                    </div>
                    <div className="grid gap-2">
                      <Button size="lg" icon={Check} loading={busy === key} disabled={Boolean(busy)} onClick={() => respondFamily(invite, true)}>{s.familyAccept}</Button>
                      <Button variant="secondary" icon={X} disabled={Boolean(busy)} onClick={() => respondFamily(invite, false)}>{s.familyDecline}</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>
        )}

        <Button variant="ghost" block onClick={() => navigate("/home")}>{s.skip}</Button>
      </Screen>
    </div>
  );
}
