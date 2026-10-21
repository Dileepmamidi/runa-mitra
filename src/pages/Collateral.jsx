import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, ExternalLink, Gem, Pencil, PackageCheck, Plus, Trash2, Undo2 } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { addUserRecord, deleteUserRecord, updateUserRecord, uploadEvidence } from "../services/firebaseService";
import { formatPaise, paiseToRupees, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { Badge, Button, Card, DetailRow, EmptyState, Field, FilePicker, Input, Notice, Screen, Section, Select, TextArea } from "../ui";
import { collateralCopy } from "./Collateral.copy";
import { loanOptionLabel, scopeFilter } from "./Guarantor";

const TYPES = ["gold", "land_documents", "vehicle_documents", "other"];
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const photoOk = (file) => String(file?.type || "").startsWith("image/") && file.size < MAX_FILE_BYTES;

const emptyForm = (borrowerId, loanId) => ({
  borrowerId: borrowerId || "",
  loanId: loanId || "",
  type: "gold",
  description: "",
  identifiers: "",
  value: "",
  photoUrls: [],
  receivedAt: toDateKey(new Date()),
  custodyNote: ""
});

const formFromDoc = (c) => ({
  borrowerId: c.borrowerId || "",
  loanId: c.loanId || "",
  type: TYPES.includes(c.type) ? c.type : "other",
  description: c.description || "",
  identifiers: c.identifiers || "",
  value: Number.isInteger(c.estimatedValuePaise) ? String(paiseToRupees(c.estimatedValuePaise)) : "",
  photoUrls: Array.isArray(c.photoUrls) ? c.photoUrls : [],
  receivedAt: c.receivedAt || "",
  custodyNote: c.custodyNote || ""
});

/** Inline "give back" flow with a confirmation step. Used here and in LoanDetails. */
export function ReturnCollateralForm({ item, onDone, onCancel }) {
  const { user, refreshData } = useApp();
  const s = useCopy(collateralCopy);
  const [returnedAt, setReturnedAt] = useState(toDateKey(new Date()));
  const [returnNote, setReturnNote] = useState("");
  const [ack, setAck] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const label = item.description || s.types[item.type] || s.types.other;

  const review = () => {
    setError("");
    const key = toDateKey(returnedAt);
    if (!key || key > toDateKey(new Date())) return setError(s.errDate);
    setConfirming(true);
  };

  const save = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await updateUserRecord(user.uid, "collateral", item.id, {
        status: "returned",
        returnedAt: toDateKey(returnedAt),
        returnNote: returnNote.trim(),
        borrowerAcknowledgedReturn: ack
      });
      await refreshData();
      onDone?.(s.returnSaved);
    } catch (err) {
      console.error(err);
      setError(s.saveError);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-xl border-2 border-brand-500 bg-surface p-3">
      <p className="text-[17px] font-extrabold text-ink">{s.returnTitle}</p>
      {!confirming ? (
        <>
          <Field label={s.returnedAt}>
            <Input type="date" max={toDateKey(new Date())} value={returnedAt} onChange={(e) => setReturnedAt(e.target.value)} />
          </Field>
          <Field label={`${s.returnNote} (${s.optional})`}>
            <TextArea value={returnNote} placeholder={s.returnNotePlaceholder} onChange={(e) => setReturnNote(e.target.value)} />
          </Field>
          <label className="flex items-start gap-3 rounded-xl bg-canvas p-3">
            <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-brand-600" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>
              <span className="block text-[15px] font-bold text-ink">{s.borrowerAckLabel}</span>
              <span className="block text-[13px] font-medium text-ink-muted">{s.borrowerAckHelp}</span>
            </span>
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <Button size="lg" icon={Undo2} onClick={review}>{s.markReturned}</Button>
          <Button variant="secondary" onClick={onCancel}>{s.cancel}</Button>
        </>
      ) : (
        <>
          <p className="text-[15px] font-semibold text-ink">{s.returnConfirm(label, toDateKey(returnedAt))}</p>
          {error && <Notice tone="error">{error}</Notice>}
          <Button size="lg" icon={PackageCheck} onClick={save} loading={loading}>{loading ? s.saving : s.returnYes}</Button>
          <Button variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>{s.returnNo}</Button>
        </>
      )}
    </div>
  );
}

/** Read-only card for one item (Firestore record or legacy loan.collateral). */
export function CollateralCard({ c, legacy, actions }) {
  const s = useCopy(collateralCopy);
  const photos = legacy ? [c.photoUrl].filter(Boolean) : Array.isArray(c.photoUrls) ? c.photoUrls : [];
  const returned = c.status === "returned";
  const value = legacy
    ? (Number(c.value) > 0 ? formatPaise(rupeesToPaise(c.value)) : "")
    : Number.isInteger(c.estimatedValuePaise) ? formatPaise(c.estimatedValuePaise) : "";
  const typeLabel = legacy ? c.type : s.types[c.type] || s.types.other;
  return (
    <Card className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-[17px] font-extrabold text-ink">{c.description || typeLabel || s.notSet}</p>
        {legacy ? <Badge>{s.legacy}</Badge> : <Badge tone={returned ? "brand" : "amber"}>{s.status[returned ? "returned" : "held"]}</Badge>}
      </div>
      <div>
        {typeLabel && <DetailRow label={s.rows.type} value={typeLabel} />}
        {c.identifiers && <DetailRow label={s.rows.identifiers} value={c.identifiers} />}
        {value && <DetailRow label={s.rows.value} value={value} />}
        {c.receivedAt && <DetailRow label={s.rows.receivedAt} value={c.receivedAt} />}
        {c.custodyNote && <DetailRow label={s.rows.custody} value={c.custodyNote} />}
        {returned && (
          <>
            <DetailRow label={s.rows.returnedAt} value={c.returnedAt || s.notSet} />
            {c.returnNote && <DetailRow label={s.rows.returnNote} value={c.returnNote} />}
            <DetailRow label={s.rows.borrowerAck} value={c.borrowerAcknowledgedReturn ? s.rows.yesByYou : s.rows.notRecorded} />
          </>
        )}
      </div>
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-[15px] font-bold text-brand-700">
              <ExternalLink size={16} /> {s.openPhoto(i + 1)}
            </a>
          ))}
        </div>
      )}
      {actions}
    </Card>
  );
}

function CollateralForm({ initial, editingId, onDone, onCancel }) {
  const { user, borrowers, loans, refreshData } = useApp();
  const s = useCopy(collateralCopy);
  const [v, setV] = useState(initial);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setV((prev) => ({ ...prev, [key]: e?.target ? e.target.value : e }));

  const borrowerLoans = loans.filter((l) => l.borrowerId === v.borrowerId);
  useEffect(() => {
    if (!v.loanId && borrowerLoans.length === 1) setV((prev) => ({ ...prev, loanId: borrowerLoans[0].id }));
  }, [borrowerLoans, v.loanId]);

  const addFile = (file) => {
    if (!file) return;
    if (!photoOk(file)) return setError(s.errFile);
    setError("");
    setFiles((prev) => [...prev, file]);
  };

  const save = async () => {
    setError("");
    if (!user) return;
    if (!v.borrowerId) return setError(s.errBorrower);
    if (!v.loanId) return setError(s.errLoan);
    if (!v.description.trim()) return setError(s.errDescription);
    const valuePaise = v.value === "" ? null : rupeesToPaise(v.value);
    if (valuePaise !== null && !(Number.isInteger(valuePaise) && valuePaise > 0)) return setError(s.errValue);
    if (v.receivedAt && !toDateKey(v.receivedAt)) return setError(s.errDate);
    try {
      setLoading(true);
      const uploaded = [];
      for (const file of files) uploaded.push(await uploadEvidence(user.uid, file, ["collateral", v.borrowerId]));
      const data = {
        borrowerId: v.borrowerId,
        loanId: v.loanId,
        type: v.type,
        description: v.description.trim(),
        identifiers: v.identifiers.trim(),
        estimatedValuePaise: valuePaise,
        photoUrls: [...v.photoUrls, ...uploaded],
        receivedAt: toDateKey(v.receivedAt) || null,
        custodyNote: v.custodyNote.trim()
      };
      if (editingId) {
        await updateUserRecord(user.uid, "collateral", editingId, data);
      } else {
        await addUserRecord(user.uid, "collateral", {
          ...data,
          status: "held",
          returnedAt: null,
          returnNote: "",
          borrowerAcknowledgedReturn: false
        });
      }
      await refreshData();
      onDone(s.saved);
    } catch (err) {
      console.error(err);
      setError(s.saveError);
    } finally {
      setLoading(false);
    }
  };

  const photoTotal = v.photoUrls.length + files.length;

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
      <Field label={s.type}>
        <Select value={v.type} onChange={set("type")}>
          {TYPES.map((k) => <option key={k} value={k}>{s.types[k]}</option>)}
        </Select>
      </Field>
      <Field label={s.description}><TextArea value={v.description} placeholder={s.descriptionPlaceholder} onChange={set("description")} /></Field>
      <Field label={`${s.identifiers} (${s.optional})`}><Input value={v.identifiers} placeholder={s.identifiersPlaceholder} onChange={set("identifiers")} /></Field>
      <Field label={`${s.value} (${s.optional})`} hint={s.valueHelp}>
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={v.value} onChange={set("value")} />
      </Field>
      <Field label={`${s.receivedAt} (${s.optional})`}>
        <Input type="date" max={toDateKey(new Date())} value={v.receivedAt} onChange={set("receivedAt")} />
      </Field>
      <Field label={`${s.custodyNote} (${s.optional})`}><Input value={v.custodyNote} placeholder={s.custodyPlaceholder} onChange={set("custodyNote")} /></Field>
      <div className="grid gap-2">
        <p className="text-[15px] font-bold text-ink">{s.photos} ({s.optional})</p>
        <FilePicker key={files.length} label={s.addPhoto} accept="image/*" icon={Camera} file={null} onChange={addFile} placeholder={files.map((f) => f.name).join(", ") || s.addPhoto} />
        {photoTotal > 0 && <p className="text-[13px] font-medium text-ink-muted">{s.photoCount(photoTotal)}</p>}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Button size="lg" onClick={save} loading={loading}>{loading ? s.saving : s.save}</Button>
      <Button variant="secondary" onClick={onCancel} disabled={loading}>{s.cancel}</Button>
    </Card>
  );
}

export function Collateral() {
  const { user, borrowers, loans, collateral, refreshData } = useApp();
  const s = useCopy(collateralCopy);
  const labels = useCopy(loanLabelsCopy);
  const [params] = useSearchParams();
  const loanId = params.get("loan") || "";
  const scopedLoan = loans.find((l) => l.id === loanId);
  const borrowerId = scopedLoan?.borrowerId || params.get("borrower") || "";

  const [editing, setEditing] = useState(null);
  const [returning, setReturning] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inScope = useMemo(() => scopeFilter(loanId, borrowerId), [loanId, borrowerId]);
  const items = collateral
    .filter(inScope)
    .sort((a, b) => (a.status === "returned" ? 1 : 0) - (b.status === "returned" ? 1 : 0));
  const legacy = loans.filter((l) => inScope({ loanId: l.id, borrowerId: l.borrowerId }) && l.collateral?.type);

  const borrower = borrowers.find((b) => b.id === borrowerId);
  const subtitle = borrower ? s.subtitleLoan(borrowerName(borrower) || labels.unknownBorrower) : undefined;
  const backTo = loanId ? `/loans/${loanId}` : "/more";
  const idle = !editing && !returning && !deleting;

  const remove = async (c) => {
    if (!user) return;
    setError("");
    try {
      setBusy(true);
      await deleteUserRecord(user.uid, "collateral", c.id);
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
        <p className="text-[17px] font-bold text-ink">{s.aboutTitle}</p>
        <ul className="mt-2 grid list-disc gap-2 pl-5 text-[15px] font-medium text-ink">
          {s.aboutPoints.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <p className="mt-3 text-[13px] font-medium text-ink-muted">{s.sharedNote}</p>
      </Card>

      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {editing ? (
        <CollateralForm
          key={editing.id || "new"}
          initial={editing.initial}
          editingId={editing.id}
          onDone={(text) => { setEditing(null); setMessage(text); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button size="lg" variant="secondary" icon={Plus} onClick={() => { setMessage(""); setEditing({ id: null, initial: emptyForm(borrowerId, loanId) }); }}>{s.add}</Button>
      )}

      <Section title={s.list}>
        {items.length === 0 && legacy.length === 0 ? (
          <EmptyState icon={Gem} title={loanId ? s.empty : s.emptyAll} />
        ) : (
          <div className="grid gap-3">
            {items.map((c) => {
              let actions = null;
              if (returning === c.id) {
                actions = <ReturnCollateralForm item={c} onDone={(text) => { setReturning(null); setMessage(text); }} onCancel={() => setReturning(null)} />;
              } else if (deleting === c.id) {
                actions = (
                  <div className="grid gap-2 rounded-xl bg-rose-50 p-3">
                    <p className="text-[15px] font-bold text-rose-800">{s.deleteConfirm}</p>
                    <Button variant="danger" onClick={() => remove(c)} loading={busy}>{busy ? s.deleting : s.deleteYes}</Button>
                    <Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>{s.deleteNo}</Button>
                  </div>
                );
              } else if (idle) {
                actions = (
                  <div className="grid grid-cols-2 gap-2">
                    {c.status !== "returned" && (
                      <Button className="col-span-2" icon={Undo2} onClick={() => { setMessage(""); setReturning(c.id); }}>{s.markReturned}</Button>
                    )}
                    <Button variant="secondary" icon={Pencil} onClick={() => { setMessage(""); setEditing({ id: c.id, initial: formFromDoc(c) }); }}>{s.edit}</Button>
                    <Button variant="ghost" icon={Trash2} onClick={() => setDeleting(c.id)}>{s.delete}</Button>
                  </div>
                );
              }
              return <CollateralCard key={c.id} c={c} actions={actions} />;
            })}
            {legacy.map((l) => <CollateralCard key={`legacy-${l.id}`} c={l.collateral} legacy />)}
          </div>
        )}
      </Section>
    </Screen>
  );
}
