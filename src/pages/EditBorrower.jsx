import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import { borrowerName, borrowerOutstanding } from "../components/BorrowerCard";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { updateUserRecord, uploadEvidence, deleteUserRecord, createBorrowerLink } from "../services/firebaseService";
import { formatPaise } from "../utils/interestEngine";
import { BottomAction, Button, Card, EmptyState, Notice, Screen, Section } from "../ui";
import { BorrowerForm, emptyBorrowerForm } from "./AddBorrower";
import { borrowerFormCopy } from "./AddBorrower.copy";
import { editBorrowerCopy } from "./EditBorrower.copy";

export function EditBorrower() {
  const { id } = useParams();
  const { user, lender, borrowers, loans, payments, refreshData } = useApp();
  const s = useCopy(editBorrowerCopy);
  const f = useCopy(borrowerFormCopy);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formData, setFormData] = useState(emptyBorrowerForm);
  const [photoFile, setPhotoFile] = useState(null);

  const borrower = borrowers.find((b) => b.id === id);

  useEffect(() => {
    if (!borrower) return;
    const next = {};
    for (const key of Object.keys(emptyBorrowerForm)) next[key] = borrower[key] || emptyBorrowerForm[key];
    next.name = borrowerName(borrower);
    setFormData(next);
  }, [borrower]);

  if (!borrower) {
    return (
      <Screen title={s.title} back="/borrowers">
        <EmptyState title={s.notFound} />
      </Screen>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    if (!formData.name.trim() || !formData.mobile.trim()) return setError(f.errRequired);
    if (!user) return setError(f.errLogin);
    try {
      setLoading(true);
      const updates = { ...formData, name: formData.name.trim() };
      if (photoFile) updates.photoUrl = await uploadEvidence(user.uid, photoFile);
      await updateUserRecord(user.uid, "borrowers", id, updates);
      // Re-sync the invitation so the name the borrower sees stays current.
      if (formData.mobile && !borrower.linkedUid) {
        await createBorrowerLink(formData.mobile, user.uid, id, { lenderName: lender.name, borrowerName: updates.name });
      }
      await refreshData();
      navigate(`/borrowers/${id}`);
    } catch (err) {
      console.error(err);
      setError(s.saveError);
    } finally {
      setLoading(false);
    }
  };

  const askDelete = () => {
    setError("");
    const summary = borrowerOutstanding(id, loans, payments);
    if (summary.outstandingPaise > 0) return setError(s.deleteBlocked(formatPaise(summary.outstandingPaise)));
    if (summary.unclear > 0) return setError(s.deleteBlockedUnclear);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await deleteUserRecord(user.uid, "borrowers", id);
      await refreshData();
      navigate("/borrowers");
    } catch (err) {
      console.error(err);
      setError(s.deleteError);
      setConfirmDelete(false);
      setLoading(false);
    }
  };

  return (
    <Screen title={s.title} subtitle={borrowerName(borrower)} back={`/borrowers/${id}`}>
      <BorrowerForm formData={formData} onChange={handleChange} photoFile={photoFile} onPhoto={setPhotoFile} mobileLocked />

      <Section title={s.deleteTitle}>
        <Card className="grid gap-3">
          <p className="text-[15px] font-medium text-ink-soft">{s.deleteHelp}</p>
          {confirmDelete ? (
            <Notice tone="warning" title={s.confirmTitle}>
              <p>{s.confirmText(borrowerName(borrower))}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={loading}>{s.confirmNo}</Button>
                <Button variant="danger" onClick={handleDelete} loading={loading}>{s.confirmYes}</Button>
              </div>
            </Notice>
          ) : (
            <Button variant="secondary" icon={Trash2} className="text-rose-600" onClick={askDelete} disabled={loading}>{s.delete}</Button>
          )}
        </Card>
      </Section>

      {error && <Notice tone="error">{error}</Notice>}

      <BottomAction>
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button variant="secondary" size="lg" onClick={() => navigate(`/borrowers/${id}`)}>{s.cancel}</Button>
          <Button size="lg" icon={Save} onClick={handleSave} loading={loading && !confirmDelete}>{loading ? s.saving : s.save}</Button>
        </div>
      </BottomAction>
    </Screen>
  );
}
