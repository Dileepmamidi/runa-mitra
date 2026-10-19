import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Mail, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Button, Card, DetailRow, EmptyState, Notice, Screen } from "../ui";
import { invitationsCopy } from "./Invitations.copy";

export function Invitations() {
  const { pendingInvites, respondToInvite } = useApp();
  const navigate = useNavigate();
  const s = useCopy(invitationsCopy);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const respond = async (invite, accept) => {
    setError("");
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

  return (
    <div className="min-h-screen bg-canvas px-4 py-6">
      <Screen title={s.title} subtitle={s.intro}>
        {error && <Notice tone="error">{error}</Notice>}
        {pendingInvites.length === 0 && <EmptyState icon={Mail} title={s.none} />}
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
        <Button variant="ghost" block onClick={() => navigate("/home")}>{s.skip}</Button>
      </Screen>
    </div>
  );
}
