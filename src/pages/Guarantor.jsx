import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ExternalLink, FileUp, Pencil, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { addUserRecord, deleteUserRecord, updateUserRecord, uploadEvidence } from "../services/firebaseService";
import { formatPaise, paiseToRupees, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { Badge, Button, Card, DetailRow, EmptyState, Field, FilePicker, Input, Notice, Screen, Section, Segmented, Select, TextArea } from "../ui";
import { guarantorCopy } from "./Guarantor.copy";

// ---------- shared with Collateral and LoanDetails ----------

const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** Evidence files must be images, audio or PDF and smaller than 15 MB. */
export function evidenceFileOk(file) {
  if (!file) return true;
  const type = String(file.type || "");
  const okType = type.startsWith("image/") || type.startsWith("audio/") || type === "application/pdf";
  return okType && file.size < MAX_FILE_BYTES;
}

/** Short label for a loan in a picker. */
export function loanOptionLabel(loan, fmt) {
  const amount = formatPaise(Number.isInteger(loan.terms?.principalPaise) ? loan.terms.principalPaise : rupeesToPaise(loan.principal) || 0);
  return fmt(amount, toDateKey(loan.terms?.startDate) || toDateKey(loan.loanDate) || "—");
}

/** Records in a collection that belong to the page's loan / borrower scope. */
export function scopeFilter(loanId, borrowerId) {
  return (item) => (loanId ? item.loanId === loanId : borrowerId ? item.borrowerId === borrowerId : true);
}

const ACK_STATUSES = ["not_recorded", "recorded", "disputed"];
const ACK_METHODS = ["paper_signature", "in_person", "phone_call", "other"];

const emptyForm = (borrowerId, loanId) => ({
  borrowerId: borrowerId || "",
  loanId: loanId || "",
  name: "",
  mobile: "",
  address: "",
  relationship: "",
  amount: "",
  guaranteeScope: "",
  agreementVersion: "",
  ackStatus: "not_recorded",
  ackMethod: "paper_signature",
  ackDate: "",
  evidenceUrl: "",
  notes: ""
});

const formFromDoc = (g) => ({
  borrowerId: g.borrowerId || "",
  loanId: g.loanId || "",
  name: g.name || "",
  mobile: g.mobile || "",
  address: g.address || "",
  relationship: g.relationship || "",
  amount: Number.isInteger(g.guaranteeAmountPaise) ? String(paiseToRupees(g.guaranteeAmountPaise)) : "",
  guaranteeScope: g.guaranteeScope || "",
  agreementVersion: g.agreementVersion || "",
  ackStatus: ACK_STATUSES.includes(g.acknowledgement?.status) ? g.acknowledgement.status : "not_recorded",
  ackMethod: ACK_METHODS.includes(g.acknowledgement?.method) ? g.acknowledgement.method : "paper_signature",
  ackDate: g.acknowledgement?.recordedAt || "",
  evidenceUrl: g.acknowledgement?.evidenceUrl || "",
  notes: g.notes || ""
});

/** Read-only card for one guarantor (Firestore record or legacy loan.guarantor). */
export function GuarantorCard({ g, legacy, actions }) {
  const s = useCopy(guarantorCopy);
  const ack = g.acknowledgement || {};
  const ackStatus = ACK_STATUSES.includes(ack.status) ? ack.status : "not_recorded";
  const evidence = ack.evidenceUrl || g.signatureUrl;
  return (
    <Card className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-[17px] font-extrabold text-ink">{g.name || s.notSet}</p>
        {legacy && <Badge>{s.legacy}</Badge>}
        <Badge tone="amber">{s.notVerified}</Badge>
      </div>
      <div>
        {g.mobile && <DetailRow label={s.rows.mobile} value={g.mobile} />}
        {g.relationship && <DetailRow label={s.rows.relationship} value={g.relationship} />}
        {g.address && <DetailRow label={s.rows.address} value={g.address} />}
        {Number.isInteger(g.guaranteeAmountPaise) && <DetailRow label={s.rows.amount} value={formatPaise(g.guaranteeAmountPaise)} />}
        {g.guaranteeScope && <DetailRow label={s.rows.scope} value={g.guaranteeScope} />}
        {g.agreementVersion && <DetailRow label={s.rows.agreement} value={g.agreementVersion} />}
        {!legacy && (
          <DetailRow
            label={s.rows.ack}
            value={ackStatus === "recorded" ? `${s.ackStatus.recorded} · ${s.rows.ackOn(s.methods[ack.method] || s.methods.other, ack.recordedAt)}` : s.ackStatus[ackStatus]}
          />
        )}
        {g.notes && <DetailRow label={s.rows.notes} value={g.notes} />}
      </div>
      {evidence && (
        <a href={evidence} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-bold text-brand-700">
          <ExternalLink size={18} /> {s.openEvidence}
        </a>
      )}
      {actions}
    </Card>
  );
}

function GuarantorForm({ initial, editingId, onDone, onCancel }) {
  const { user, borrowers, loans, refreshData } = useApp();
  const s = useCopy(guarantorCopy);
  const [v, setV] = useState(initial);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setV((prev) => ({ ...prev, [key]: e?.target ? e.target.value : e }));

  const borrowerLoans = loans.filter((l) => l.borrowerId === v.borrowerId);
  useEffect(() => {
    if (!v.loanId && borrowerLoans.length === 1) setV((prev) => ({ ...prev, loanId: borrowerLoans[0].id }));
  }, [borrowerLoans, v.loanId]);

  const save = async () => {
    setError("");
    if (!user) return;
    if (!v.borrowerId) return setError(s.errBorrower);
    if (!v.loanId) return setError(s.errLoan);
    if (!v.name.trim()) return setError(s.errName);
    const amountPaise = v.amount === "" ? null : rupeesToPaise(v.amount);
    if (amountPaise !== null && !(Number.isInteger(amountPaise) && amountPaise > 0)) return setError(s.errAmount);
    if (v.ackStatus === "recorded" && !toDateKey(v.ackDate)) return setError(s.errAckDate);
    if (!evidenceFileOk(file)) return setError(s.errFile);
    try {
      setLoading(true);
      const evidenceUrl = file ? await uploadEvidence(user.uid, file, ["guarantors", v.borrowerId]) : v.evidenceUrl || null;
      const recorded = v.ackStatus !== "not_recorded";
      const data = {
        borrowerId: v.borrowerId,
        loanId: v.loanId,
        name: v.name.trim(),
        mobile: v.mobile.trim(),
        address: v.address.trim(),
        relationship: v.relationship.trim(),
        guaranteeAmountPaise: amountPaise,
        guaranteeScope: v.guaranteeScope.trim(),
        agreementVersion: v.agreementVersion.trim(),
        acknowledgement: {
          status: v.ackStatus,
          method: recorded ? v.ackMethod : null,
          evidenceUrl,
          recordedAt: recorded ? toDateKey(v.ackDate) : null
        },
        verificationStatus: "unverified",
        notes: v.notes.trim()
      };
      if (editingId) await updateUserRecord(user.uid, "guarantors", editingId, data);
      else await addUserRecord(user.uid, "guarantors", data);
      await refreshData();
      onDone(s.saved);
    } catch (err) {
      console.error(err);
      setError(s.saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="grid gap-4 border-2 border-brand-500">
      <p className="text-[19px] font-extrabold text-ink">{editingId ? s.formTitleEdit : s.formTitleNew}</p>
      <Field label={s.borrower}>
        <Select value={v.borrowerId} onChange={(e) => setV((prev) => ({ ...prev, borrowerId: e.target.value, loanId: "" }))}>
          <option value="">{s.chooseBorrower}</option>
          {borrowers.map((b) => <option key={b.id} value={b.id}>{borrowerName(b)}</option>)}
        </Select>
      </Field>
      {v.borrowerId && (
        <Field label={s.loan}>
          <Select value={v.loanId} onChange={set("loanId")}>
            <option value="">{s.chooseLoan}</option>
            {borrowerLoans.map((l) => <option key={l.id} value={l.id}>{loanOptionLabel(l, s.loanOption)}</option>)}
          </Select>
        </Field>
      )}
      <Field label={s.name}><Input value={v.name} onChange={set("name")} /></Field>
      <Field label={`${s.mobile} (${s.optional})`}><Input inputMode="tel" value={v.mobile} onChange={set("mobile")} /></Field>
      <Field label={`${s.relationship} (${s.optional})`}><Input value={v.relationship} placeholder={s.relationshipPlaceholder} onChange={set("relationship")} /></Field>
      <Field label={`${s.address} (${s.optional})`}><TextArea value={v.address} onChange={set("address")} /></Field>
      <Field label={`${s.amount} (${s.optional})`} hint={s.amountHelp}>
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={v.amount} onChange={set("amount")} />
      </Field>
      <Field label={`${s.scope} (${s.optional})`}><Input value={v.guaranteeScope} placeholder={s.scopePlaceholder} onChange={set("guaranteeScope")} /></Field>
      <Field label={`${s.agreementVersion} (${s.optional})`}><Input value={v.agreementVersion} placeholder={s.agreementVersionPlaceholder} onChange={set("agreementVersion")} /></Field>

      <div className="grid gap-3 rounded-xl bg-canvas p-3">
        <p className="text-[15px] font-bold text-ink">{s.ackTitle}</p>
        <Select value={v.ackStatus} onChange={set("ackStatus")}>
          {ACK_STATUSES.map((k) => <option key={k} value={k}>{s.ackStatus[k]}</option>)}
        </Select>
        {v.ackStatus !== "not_recorded" && (
          <>
            <Field label={s.ackMethod}>
              <Select value={v.ackMethod} onChange={set("ackMethod")}>
                {ACK_METHODS.map((k) => <option key={k} value={k}>{s.methods[k]}</option>)}
              </Select>
            </Field>
            <Field label={v.ackStatus === "recorded" ? s.ackDate : `${s.ackDate} (${s.optional})`}>
              <Input type="date" value={v.ackDate} onChange={set("ackDate")} />
            </Field>
          </>
        )}
        <FilePicker label={`${s.evidence} (${s.optional})`} accept="image/*,audio/*,application/pdf" icon={FileUp} file={file} onChange={setFile} placeholder={s.evidencePick} />
        {v.evidenceUrl && !file && <p className="text-[13px] font-medium text-ink-muted">{s.evidenceSaved}</p>}
      </div>

      <Field label={`${s.notes} (${s.optional})`}><TextArea value={v.notes} onChange={set("notes")} /></Field>
      <Notice tone="warning" title={s.notVerified}>{s.notVerifiedHelp}</Notice>
      {error && <Notice tone="error">{error}</Notice>}
      <Button size="lg" onClick={save} loading={loading}>{loading ? s.saving : s.save}</Button>
      <Button variant="secondary" onClick={onCancel} disabled={loading}>{s.cancel}</Button>
    </Card>
  );
}

export function Guarantor() {
  const { user, borrowers, loans, guarantors, hasFeature, refreshData } = useApp();
  const s = useCopy(guarantorCopy);
  const labels = useCopy(loanLabelsCopy);
  const [params] = useSearchParams();
  const loanId = params.get("loan") || "";
  const scopedLoan = loans.find((l) => l.id === loanId);
  const borrowerId = scopedLoan?.borrowerId || params.get("borrower") || "";
  const canEdit = hasFeature("guarantors");

  const [editing, setEditing] = useState(null); // null | { id, initial }
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inScope = useMemo(() => scopeFilter(loanId, borrowerId), [loanId, borrowerId]);
  const items = guarantors.filter(inScope);
  const legacy = loans.filter((l) => inScope({ loanId: l.id, borrowerId: l.borrowerId }) && l.guarantor?.name);

  const borrower = borrowers.find((b) => b.id === borrowerId);
  const subtitle = borrower ? s.subtitleLoan(borrowerName(borrower) || labels.unknownBorrower) : undefined;
  const backTo = loanId ? `/loans/${loanId}` : "/more";

  const remove = async (g) => {
    if (!user) return;
    setError("");
    try {
      setBusy(true);
      await deleteUserRecord(user.uid, "guarantors", g.id);
      await refreshData();
      setDeleting(null);
      setMessage(s.deleted);
    } catch (err) {
      console.error(err);
      setError(s.saveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={s.title} subtitle={subtitle} back={backTo}>
      <Card>
        <p className="text-[17px] font-bold text-ink">{s.whoTitle}</p>
        <ul className="mt-2 grid list-disc gap-2 pl-5 text-[15px] font-medium text-ink">
          {s.whoPoints.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </Card>

      {!canEdit && (
        <Card className="grid gap-3 border-amber-200 bg-amber-50">
          <p className="text-[17px] font-extrabold text-ink">{s.upgradeTitle}</p>
          <p className="text-[15px] font-medium text-ink-soft">{s.upgradeText}</p>
          <Button to="/plans" icon={ShieldCheck}>{s.seePlans}</Button>
        </Card>
      )}

      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {editing ? (
        <GuarantorForm
          key={editing.id || "new"}
          initial={editing.initial}
          editingId={editing.id}
          onDone={(text) => { setEditing(null); setMessage(text); }}
          onCancel={() => setEditing(null)}
        />
      ) : canEdit ? (
        <Button size="lg" icon={UserPlus} onClick={() => { setMessage(""); setEditing({ id: null, initial: emptyForm(borrowerId, loanId) }); }}>{s.add}</Button>
      ) : null}

      <Section title={s.list}>
        {items.length === 0 && legacy.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={loanId ? s.empty : s.emptyAll} />
        ) : (
          <div className="grid gap-3">
            {items.map((g) => (
              <GuarantorCard
                key={g.id}
                g={g}
                actions={canEdit && !editing && (
                  deleting === g.id ? (
                    <div className="grid gap-2 rounded-xl bg-rose-50 p-3">
                      <p className="text-[15px] font-bold text-rose-800">{s.deleteConfirm(g.name)}</p>
                      <Button variant="danger" onClick={() => remove(g)} loading={busy}>{busy ? s.deleting : s.deleteYes}</Button>
                      <Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>{s.deleteNo}</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" icon={Pencil} onClick={() => { setMessage(""); setEditing({ id: g.id, initial: formFromDoc(g) }); }}>{s.edit}</Button>
                      <Button variant="ghost" icon={Trash2} onClick={() => setDeleting(g.id)}>{s.delete}</Button>
                    </div>
                  )
                )}
              />
            ))}
            {legacy.map((l) => <GuarantorCard key={`legacy-${l.id}`} g={l.guarantor} legacy />)}
          </div>
        )}
      </Section>
    </Screen>
  );
}
