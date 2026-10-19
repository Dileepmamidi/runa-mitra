import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IdCard, ImagePlus, Save, UserPlus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { updateUserRecord, uploadEvidence } from "../services/firebaseService";
import { Badge, Button, Card, DetailRow, EmptyState, Field, FilePicker, Input, Notice, Screen, Section, Select } from "../ui";
import { identityCopy } from "./AadhaarVerification.copy";

const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";

// The lender records identity details by hand. The app never verifies them,
// so the stored status is always "recorded_unverified".
export function AadhaarVerification() {
  const { t, user, borrowers, refreshData } = useApp();
  const s = useCopy(identityCopy);
  const [params] = useSearchParams();

  const [borrowerId, setBorrowerId] = useState(params.get("borrower") || "");
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [file, setFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const borrower = borrowers.find((b) => b.id === borrowerId);

  // Load what is already recorded for the chosen borrower.
  useEffect(() => {
    setName(borrower?.aadhaarName || "");
    setLast4(borrower?.aadhaarLast4 || "");
    setBirthYear(borrower?.aadhaarBirthYear || "");
    setFile(null);
    setConsent(false);
    setSaved(false);
    setError("");
  }, [borrowerId]);

  const hasRecord = Boolean(borrower?.aadhaarStatus || borrower?.aadhaarLast4);

  const save = async () => {
    setError("");
    setSaved(false);
    if (!user || !borrowerId) return;
    if (!/^\d{4}$/.test(last4)) return setError(s.last4Needed);
    if (!consent) return setError(s.consentNeeded);
    try {
      setSaving(true);
      const payload = {
        aadhaarStatus: "recorded_unverified",
        aadhaarLast4: last4,
        aadhaarName: name.trim(),
        aadhaarBirthYear: birthYear.trim(),
        aadhaarMethod: file ? "Masked Aadhaar upload" : "Manual check",
        aadhaarConsent: true,
        aadhaarConsentAt: new Date().toISOString()
      };
      if (file) payload.aadhaarFileUrl = await uploadEvidence(user.uid, file, ["aadhaar"]);
      await updateUserRecord(user.uid, "borrowers", borrowerId, payload);
      await refreshData();
      setFile(null);
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setSaving(false);
    }
  };

  if (borrowers.length === 0) {
    return (
      <Screen title={s.title} back>
        <EmptyState icon={UserPlus} title={s.noBorrowers} action={<Button to="/borrowers/new" icon={UserPlus}>{t.addBorrower}</Button>} />
      </Screen>
    );
  }

  return (
    <Screen title={s.title} subtitle={s.subtitle} back>
      <Notice tone="warning" title={s.notVerifiedTitle}>{s.notVerifiedText}</Notice>

      <Card>
        <Field label={s.borrower}>
          <Select value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}>
            <option value="">{s.chooseBorrower}</option>
            {borrowers.map((b) => <option key={b.id} value={b.id}>{borrowerName(b)}</option>)}
          </Select>
        </Field>
        {borrower && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[15px] font-medium text-ink-soft">{s.currentStatus}</span>
            <Badge tone={hasRecord ? "amber" : "ink"}>{hasRecord ? s.statusRecorded : s.statusNone}</Badge>
          </div>
        )}
      </Card>

      {borrower && (
        <>
          <Card>
            <div className="grid gap-4">
              <Field label={s.nameOnCard}>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              </Field>
              <Field label={s.last4} hint={s.last4Hint}>
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  value={last4}
                  autoComplete="off"
                  onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </Field>
              <Field label={s.birthYear}>
                <Input inputMode="numeric" maxLength={4} value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))} />
              </Field>
              <DetailRow label={s.masked} value={`XXXX XXXX ${last4 || "____"}`} />
            </div>
          </Card>

          <Notice tone="info">{s.privacy}</Notice>

          <Section title={s.fileTitle}>
            <div className="grid gap-3">
              <Notice tone="warning">{s.fileWarning}</Notice>
              <FilePicker label={s.fileTitle} accept="image/*,.pdf" file={file} onChange={setFile} icon={ImagePlus} placeholder={s.filePlaceholder} />
            </div>
          </Section>

          <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft">
            <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-brand-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span className="text-[15px] font-bold text-ink">{s.consent}</span>
          </label>

          {error && <Notice tone="error">{error}</Notice>}
          {saved && <Notice tone="success">{s.saved}</Notice>}

          <Button size="lg" block icon={saving ? undefined : Save} loading={saving} disabled={!consent || last4.length !== 4} onClick={save}>
            {s.save}
          </Button>
        </>
      )}
      {!borrower && <EmptyState icon={IdCard} title={s.chooseBorrower} />}
    </Screen>
  );
}
