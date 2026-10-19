import { useState } from "react";
import { Send } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { createBorrowerLink, saveUserProfile } from "../services/firebaseService";
import { Button, Card, Notice, Screen, Section, Segmented } from "../ui";
import { settingsCopy } from "./Settings.copy";

const MODES = ["Basic", "Regular", "Advanced"];
const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";

export function Settings() {
  const { t, user, lender, appMode, setAppMode, borrowers, language, setLanguage } = useApp();
  const s = useCopy(settingsCopy);
  const [saveError, setSaveError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { tone, text }

  const mode = appMode === "Simple" ? "Basic" : appMode;
  // Borrowers who already accepted are skipped, so their accepted invitation
  // is never reset to "pending".
  const toInvite = borrowers.filter((b) => b.mobile && !b.linkedUid);

  const saveProfile = async (fields) => {
    setSaveError("");
    try {
      if (user) await saveUserProfile(user.uid, fields);
    } catch {
      setSaveError(s.saveError);
    }
  };

  const changeLanguage = (next) => {
    setLanguage(next);
    saveProfile({ preferredLanguage: next });
  };

  const changeMode = (next) => {
    setAppMode(next);
    saveProfile({ appMode: next });
  };

  const sendInvites = async () => {
    setConfirming(false);
    setResult(null);
    if (!user) return;
    if (toInvite.length === 0) {
      setResult({ tone: "info", text: s.invitesNone });
      return;
    }
    setSending(true);
    try {
      let count = 0;
      for (const b of toInvite) {
        await createBorrowerLink(b.mobile, user.uid, b.id, { lenderName: lender.name, borrowerName: borrowerName(b) });
        count += 1;
      }
      setResult({ tone: "success", text: s.invitesDone(count) });
    } catch (err) {
      console.error(err);
      setResult({ tone: "error", text: s.invitesError });
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen title={s.title} back="/more">
      <Section title={s.language}>
        <Segmented
          value={language}
          onChange={changeLanguage}
          options={[{ value: "te", label: "తెలుగు" }, { value: "en", label: "English" }]}
        />
      </Section>

      <Section title={s.detail}>
        <Segmented value={mode} onChange={changeMode} options={MODES.map((m) => ({ value: m, label: s.modes[m] }))} />
        <Card className="mt-3">
          <p className="text-[15px] font-bold text-ink">{s.modes[mode] || mode}</p>
          <p className="mt-1 text-[15px] font-medium text-ink-soft">{s.modeText[mode] || ""}</p>
          <p className="mt-3 text-[13px] font-medium text-ink-muted">{s.detailHint}</p>
        </Card>
      </Section>

      {saveError && <Notice tone="warning">{saveError}</Notice>}

      <Section title={s.invitesTitle}>
        <Card>
          <p className="text-[15px] font-medium text-ink-soft">{s.invitesText}</p>
          <div className="mt-4 grid gap-3">
            {result && <Notice tone={result.tone}>{result.text}</Notice>}
            {confirming ? (
              <>
                <p className="text-[16px] font-bold text-ink">{s.invitesConfirm(toInvite.length)}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={() => setConfirming(false)}>{t.cancel}</Button>
                  <Button icon={Send} onClick={sendInvites}>{t.yes}</Button>
                </div>
              </>
            ) : (
              <Button
                icon={Send}
                block
                loading={sending}
                onClick={() => (toInvite.length ? setConfirming(true) : sendInvites())}
              >
                {sending ? s.invitesSending : s.invitesButton}
              </Button>
            )}
          </div>
        </Card>
      </Section>
    </Screen>
  );
}
