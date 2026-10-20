import { useState } from "react";
import { CheckCircle2, Gem, ShieldCheck, UserCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { addAcknowledgement } from "../../services/firebaseService";
import { formatPaise } from "../../utils/interestEngine";
import { Badge, Button, Card, DetailRow, Notice } from "../../ui";
import { amountPaiseOf, collateralState, dateKeyOf } from "./borrowerData";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerLoanRecordsCopy } from "./BorrowerLoanRecords.copy";

/** Small "You acknowledged on …" line. */
export function AcknowledgedLine({ ack }) {
  const s = useCopy(borrowerLoanRecordsCopy);
  const sh = useCopy(borrowerSharedCopy);
  const date = dateKeyOf(ack?.at);
  return (
    <p className="flex items-center gap-2 text-[16px] font-bold text-brand-700">
      <CheckCircle2 size={22} className="shrink-0" />
      {date ? s.acknowledgedOn(sh.date(date)) : s.acknowledged}
    </p>
  );
}

/**
 * Big "I agree" button that first explains what it records, then adds one
 * in-app acknowledgement { uid, kind, ...extra } on a loan or agreement.
 */
export function AcknowledgeButton({ label, lenderUid, collectionName, docId, extra, children }) {
  const { user, refreshData } = useApp();
  const s = useCopy(borrowerLoanRecordsCopy);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!user || !lenderUid || !docId) return;
    setSaving(true);
    setError("");
    try {
      await addAcknowledgement(lenderUid, collectionName, docId, { uid: user.uid, ...extra });
      setConfirming(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError(s.ackError);
    } finally {
      setSaving(false);
    }
  };

  if (!confirming) {
    return (
      <div className="grid gap-2">
        <Button size="lg" block icon={CheckCircle2} onClick={() => setConfirming(true)} disabled={!user}>{label}</Button>
        {children}
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      <Notice tone="info" title={s.ackConfirmTitle}>{s.ackConfirmText}</Notice>
      {error && <Notice tone="error">{error}</Notice>}
      <Button size="lg" block icon={CheckCircle2} loading={saving} onClick={save}>{saving ? s.ackSaving : s.ackYes}</Button>
      <Button size="lg" variant="secondary" block onClick={() => setConfirming(false)} disabled={saving}>{s.ackCancel}</Button>
    </div>
  );
}

/** Guarantor and collateral records for one loan. Renders nothing when there are none. */
export function LoanSecurityRecords({ guarantors = [], collateral = [] }) {
  const s = useCopy(borrowerLoanRecordsCopy);
  const sh = useCopy(borrowerSharedCopy);
  if (guarantors.length === 0 && collateral.length === 0) return null;

  return (
    <div className="grid gap-3">
      {guarantors.map((g, i) => {
        const paise = amountPaiseOf(g, "amountPaise", "amount") ?? amountPaiseOf(g, "guaranteeAmountPaise", "guaranteeAmount");
        const scope = g.guaranteeScope || g.scope || g.coverage || "";
        return (
          <Card key={g.id || `g${i}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><UserCheck size={22} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink-muted">{s.guarantors}</p>
                <p className="text-[18px] font-extrabold text-ink">{g.name || sh.notRecorded}</p>
              </div>
            </div>
            <div className="mt-2">
              {g.relationship && <DetailRow label={s.relationship} value={g.relationship} />}
              {paise ? <DetailRow label={s.amount} value={formatPaise(paise)} /> : null}
              {scope ? <DetailRow label={s.scope} value={scope === "full" ? s.fullLoan : scope} /> : null}
            </div>
            <p className="mt-2 text-[14px] font-medium text-ink-muted">{s.guarantorNotVerified}</p>
          </Card>
        );
      })}
      {collateral.map((c, i) => {
        const returned = collateralState(c) === "returned";
        const returnedKey = dateKeyOf(c.returnedAt || c.returnedDate);
        const typeKey = String(c.type || "").toLowerCase();
        const value = amountPaiseOf({ ...c, estimatedValuePaise: c.estimatedValuePaise ?? c.valuePaise }, "estimatedValuePaise", "value");
        return (
          <Card key={c.id || `c${i}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                {returned ? <ShieldCheck size={22} /> : <Gem size={22} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink-muted">{s.collateral}</p>
                <p className="text-[18px] font-extrabold text-ink">{c.description || s.noDescription}</p>
              </div>
              <Badge tone={returned ? "brand" : "amber"}>{returned ? s.returned : s.held}</Badge>
            </div>
            <div className="mt-2">
              {c.type && <DetailRow label={s.type} value={s.collateralTypes[typeKey] || c.type} />}
              {value ? <DetailRow label={s.value} value={formatPaise(value)} /> : null}
              <DetailRow label={s.status} value={returned ? (returnedKey ? s.returnedOn(sh.date(returnedKey)) : s.returned) : s.held} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
