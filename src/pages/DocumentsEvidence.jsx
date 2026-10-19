import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteField } from "firebase/firestore";
import { ExternalLink, FileText, FolderOpen, IdCard, Upload } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { addUserRecord, listUserCollection, updateUserRecord, uploadEvidence } from "../services/firebaseService";
import { toDateKey } from "../utils/interestEngine";
import { Badge, Button, Card, EmptyState, Field, FilePicker, List, ListRow, Notice, Screen, Section, Select } from "../ui";
import { documentsCopy } from "./DocumentsEvidence.copy";

// Stored category values stay as they are; only the labels are translated.
const CATEGORIES = ["Handwritten note", "Borrower photo", "Voice promise", "ID proof", "Aadhaar verification", "Land document", "Gold photo"];
const IDENTITY = ["aadhaar", "identity", "id proof"];
const isIdentity = (category) => IDENTITY.some((w) => String(category || "").toLowerCase().includes(w));
const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";

function Toggle({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${checked ? "bg-brand-600" : "bg-line"}`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-soft transition-all ${checked ? "left-7" : "left-1"}`} />
    </button>
  );
}

export function DocumentsEvidence() {
  const { user, borrowers, refreshData } = useApp();
  const s = useCopy(documentsCopy);
  const [params] = useSearchParams();
  const [borrowerId, setBorrowerId] = useState(params.get("borrower") || "");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [file, setFile] = useState(null);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [docs, setDocs] = useState([]);

  const identity = isIdentity(category);

  const load = useCallback(async () => {
    if (!user || !borrowerId) return setDocs([]);
    const all = await listUserCollection(user.uid, "evidence");
    const dateOf = (d) => toDateKey(d.uploadedAt) || toDateKey(d.createdAt) || "";
    setDocs(all.filter((e) => e.borrowerId === borrowerId).sort((a, b) => (dateOf(a) < dateOf(b) ? 1 : -1)));
  }, [user, borrowerId]);

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, [load]);

  // Identity documents default to private and cannot be shared.
  const changeCategory = (next) => {
    setCategory(next);
    setVisible(!isIdentity(next));
  };

  const handleUpload = async () => {
    setError("");
    setSuccess("");
    if (!user || !borrowerId) return;
    if (!file) return setError(s.needFile);
    try {
      setLoading(true);
      const fileUrl = await uploadEvidence(user.uid, file, ["evidence", borrowerId]);
      await addUserRecord(user.uid, "evidence", {
        borrowerId,
        category,
        fileUrl,
        fileName: file.name,
        uploadedAt: new Date(),
        visibleToBorrower: identity ? false : visible
      });
      setFile(null);
      setSuccess(s.uploaded);
      await load();
      await refreshData(); // shares newly visible files with a linked borrower
    } catch (err) {
      console.error(err);
      setError(s.uploadError);
    } finally {
      setLoading(false);
    }
  };

  const changeVisibility = async (doc, next) => {
    setError("");
    setSuccess("");
    if (!user || isIdentity(doc.category)) return;
    try {
      setBusyId(doc.id);
      // Hiding also removes the borrower's read access stamp.
      await updateUserRecord(user.uid, "evidence", doc.id, next ? { visibleToBorrower: true } : { visibleToBorrower: false, borrowerUid: deleteField() });
      await load();
      await refreshData();
    } catch (err) {
      console.error(err);
      setError(s.updateError);
    } finally {
      setBusyId("");
    }
  };

  const shownToBorrower = (doc) => doc.visibleToBorrower !== false && !isIdentity(doc.category);

  return (
    <Screen title={s.title} back>
      <List>
        <ListRow icon={IdCard} title={s.identityLink} to={borrowerId ? `/aadhaar-verification?borrower=${borrowerId}` : "/aadhaar-verification"} trailing={<Badge>{s.optional}</Badge>} />
      </List>

      <Card>
        <Field label={s.borrower}>
          <Select value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}>
            <option value="">{s.chooseBorrower}</option>
            {borrowers.map((b) => <option key={b.id} value={b.id}>{borrowerName(b)}</option>)}
          </Select>
        </Field>
      </Card>

      {!borrowerId ? (
        <EmptyState icon={FolderOpen} title={s.pickFirst} />
      ) : (
        <>
          <Card>
            <div className="grid gap-4">
              <Field label={s.category}>
                <Select value={category} onChange={(e) => changeCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{s.categories[c]}</option>)}
                </Select>
              </Field>
              <FilePicker label={s.file} file={file} onChange={setFile} icon={Upload} placeholder={s.filePlaceholder} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-bold text-ink">{s.visible}</p>
                  <p className="mt-0.5 text-[13px] font-medium text-ink-muted">{identity ? s.identityLocked : s.visibleHint}</p>
                </div>
                <Toggle checked={identity ? false : visible} disabled={identity} onChange={setVisible} label={s.visible} />
              </div>
              {error && <Notice tone="error">{error}</Notice>}
              {success && <Notice tone="success">{success}</Notice>}
              <Button size="lg" block icon={Upload} loading={loading} disabled={!file} onClick={handleUpload}>{s.upload}</Button>
            </div>
          </Card>

          <Section title={s.listTitle}>
            {docs.length === 0 ? (
              <EmptyState icon={FileText} title={s.empty} />
            ) : (
              <div className="grid gap-3">
                {docs.map((doc) => {
                  const locked = isIdentity(doc.category);
                  const shown = shownToBorrower(doc);
                  return (
                    <Card key={doc.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[16px] font-bold text-ink">{s.categories[doc.category] || doc.category}</p>
                          <p className="mt-0.5 truncate text-[13px] font-medium text-ink-muted">
                            {(toDateKey(doc.uploadedAt) || toDateKey(doc.createdAt) || s.noDate)} · {doc.fileName}
                          </p>
                        </div>
                        <Badge tone={shown ? "brand" : "ink"}>{shown ? s.shown : s.hidden}</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-50 px-4 text-[15px] font-bold text-brand-700 active:bg-brand-100"
                        >
                          <ExternalLink size={18} /> {s.open}
                        </a>
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-ink-muted">{s.visible}</span>
                          <Toggle checked={shown} disabled={locked || busyId === doc.id} onChange={(next) => changeVisibility(doc, next)} label={s.visible} />
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}
