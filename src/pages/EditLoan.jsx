import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { arrayUnion } from "firebase/firestore";
import { Save } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { updateUserRecord } from "../services/firebaseService";
import { formatPaise, rupeesToPaise, paiseToRupees, termsFromLoan, toDateKey } from "../utils/interestEngine";
import { BottomAction, Button, Card, EmptyState, Field, Input, Notice, Screen, Section, Select, TextArea } from "../ui";
import { buildTerms, EstimatePreview, legacyFields, LoanTermsFields, validateLoanForm } from "./AddLoan";
import { loanFormCopy } from "./AddLoan.copy";
import { editLoanCopy } from "./EditLoan.copy";

const MATERIAL = ["principalPaise", "ratePercent", "rateUnit", "method", "compounding", "startDate"];

/** Display text for one value in a terms change (used here and in LoanDetails). */
export function formatTermValue(key, value, f, s) {
  if (value === null || value === undefined || value === "") return s.none;
  switch (key) {
    case "principalPaise": return formatPaise(Number(value));
    case "ratePercent": return `${value}%`;
    case "rateUnit": return value === "year" ? f.perYear : f.perMonth;
    case "method": return value === "compound" ? f.compound : f.simple;
    case "compounding": return f[value] || String(value);
    default: return String(value);
  }
}

// Comparable snapshot of the terms that change the amount owed.
function snapshot(v) {
  return {
    principalPaise: rupeesToPaise(v.principal),
    ratePercent: Number(v.rate),
    rateUnit: v.rateUnit,
    method: v.method,
    compounding: v.method === "compound" ? v.cycle : null,
    startDate: toDateKey(v.loanDate)
  };
}

export function ChangeTable({ previous, next, f, s }) {
  const keys = Object.keys(next);
  return (
    <div className="grid gap-2">
      {keys.map((key) => (
        <div key={key} className="rounded-xl bg-canvas p-3">
          <p className="text-[13px] font-bold text-ink-muted">{s.field[key] || key}</p>
          <div className="mt-1 grid grid-cols-2 gap-2 text-[15px]">
            <div>
              <p className="text-[12px] font-semibold text-ink-muted">{s.before}</p>
              <p className="tabular font-bold text-ink-soft line-through decoration-rose-400">{formatTermValue(key, previous?.[key], f, s)}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-ink-muted">{s.after}</p>
              <p className="tabular font-extrabold text-ink">{formatTermValue(key, next[key], f, s)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const SECURITY = ["Trust only", "Guarantor", "Gold/Documents"];

export function EditLoan() {
  const { id } = useParams();
  const { user, borrowers, loans, refreshData } = useApp();
  const s = useCopy(editLoanCopy);
  const f = useCopy(loanFormCopy);
  const labels = useCopy(loanLabelsCopy);
  const navigate = useNavigate();
  const loan = loans.find((l) => l.id === id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [values, setValues] = useState(null);
  const [original, setOriginal] = useState(null);
  const [securityType, setSecurityType] = useState("Trust only");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const confirmRef = useRef(null);

  // Load once per loan; later refreshes must not overwrite what is being typed.
  useEffect(() => {
    if (!loan || original?.id === loan.id) return;
    const t = termsFromLoan(loan) || {};
    const v = {
      principal: Number.isInteger(t.principalPaise) ? String(paiseToRupees(t.principalPaise)) : String(loan.principal ?? ""),
      rate: Number.isFinite(t.ratePercent) ? String(t.ratePercent) : String(loan.interestRate ?? ""),
      rateUnit: t.rateUnit === "year" ? "year" : "month",
      method: t.method === "compound" ? "compound" : "simple",
      cycle: t.compounding || loan.cycle || "monthly",
      loanDate: toDateKey(t.startDate) || toDateKey(loan.loanDate) || "",
      dueDate: loan.dueDate || ""
    };
    // What is actually recorded now (null where missing), to compare against.
    const snap = {
      principalPaise: Number.isInteger(t.principalPaise) ? t.principalPaise : null,
      ratePercent: Number.isFinite(t.ratePercent) ? t.ratePercent : null,
      rateUnit: t.rateUnit || null,
      method: t.method || null,
      compounding: t.method === "compound" ? t.compounding || null : null,
      startDate: toDateKey(t.startDate) || null
    };
    setValues(v);
    setOriginal({ id: loan.id, values: v, snap });
    setSecurityType(loan.securityType || "Trust only");
    setNotes(loan.notes || "");
  }, [loan, original?.id]);

  useEffect(() => {
    if (confirming) confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [confirming]);

  const diff = useMemo(() => {
    if (!values || !original) return null;
    const before = original.snap;
    const after = snapshot(values);
    const previous = {};
    const next = {};
    for (const key of MATERIAL) {
      if (before[key] !== after[key]) {
        previous[key] = before[key] ?? null;
        next[key] = after[key] ?? null;
      }
    }
    const material = Object.keys(next).length > 0;
    const dueChanged = (original.values.dueDate || "") !== (values.dueDate || "");
    if (dueChanged) {
      previous.dueDate = original.values.dueDate || null;
      next.dueDate = values.dueDate || null;
    }
    return { previous, next, material, dueChanged };
  }, [values, original]);

  if (!loan) {
    return (
      <Screen title={s.title} back>
        <EmptyState title={s.notFound} />
      </Screen>
    );
  }
  if (!values || !diff) return <Screen title={s.title} back />;

  const borrower = borrowers.find((b) => b.id === loan.borrowerId);
  const name = borrowerName(borrower) || loan.borrowerName || labels.unknownBorrower;
  const otherChanged = securityType !== (loan.securityType || "Trust only") || notes !== (loan.notes || "");

  const change = (key, value) => {
    setConfirming(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const review = () => {
    setError("");
    const problem = validateLoanForm(f, values);
    if (problem) return setError(problem);
    if (diff.material && reason.trim().length < 3) return setError(s.errReason);
    if (!diff.material && !diff.dueChanged && !otherChanged) return setError(s.errNothing);
    setConfirming(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setError("");
    try {
      setLoading(true);
      const updates = {
        borrowerName: name,
        dueDate: values.dueDate,
        securityType,
        notes,
        updatedAt: new Date()
      };

      if (diff.material) {
        const oldTerms = loan.terms && typeof loan.terms === "object" ? loan.terms : {};
        const extra = {
          ...(Array.isArray(oldTerms.pauses) ? { pauses: oldTerms.pauses } : {}),
          ...(oldTerms.cycleAnchorDate ? { cycleAnchorDate: oldTerms.cycleAnchorDate } : {}),
          ...(oldTerms.allocation ? { allocation: oldTerms.allocation } : {})
        };
        Object.assign(updates, legacyFields(values), { terms: buildTerms(values, extra) });
        // Legacy principal-only balance: shift by the change in principal.
        if ("principalPaise" in diff.next) {
          const delta = Number(values.principal) - Number(loan.principal || 0);
          updates.balance = Math.max(0, Number(loan.balance ?? loan.principal ?? 0) + delta);
        }
      }

      if (diff.material || diff.dueChanged) {
        updates.termsHistory = arrayUnion({
          changedAt: new Date().toISOString(),
          changedBy: user.uid,
          previous: diff.previous,
          next: diff.next,
          reason: reason.trim()
        });
      }

      await updateUserRecord(user.uid, "loans", id, updates);
      await refreshData();
      navigate(`/loans/${id}`);
    } catch (err) {
      console.error(err);
      setError(s.saveError);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const securityLabel = labels.security;
  const showChanges = diff.material || diff.dueChanged;

  return (
    <Screen title={s.title} subtitle={name} back={`/loans/${id}`}>
      <Section title={s.terms}>
        <Card className="grid gap-4">
          <p className="text-[15px] font-medium text-ink-soft">{s.termsHelp}</p>
          <LoanTermsFields values={values} onChange={change} />
        </Card>
      </Section>

      <Section title={s.other}>
        <Card className="grid gap-4">
          <Field label={`${f.dueDate} (${f.optional})`}>
            <Input type="date" value={values.dueDate} onChange={(e) => change("dueDate", e.target.value)} />
          </Field>
          <Field label={s.security}>
            <Select value={securityType} onChange={(e) => { setSecurityType(e.target.value); setConfirming(false); }}>
              {(SECURITY.includes(securityType) ? SECURITY : [...SECURITY, securityType]).map((v) => (
                <option key={v} value={v}>{securityLabel[v] || v}</option>
              ))}
            </Select>
          </Field>
          <Field label={`${f.notes} (${f.optional})`} hint={f.notesHint}>
            <TextArea value={notes} onChange={(e) => { setNotes(e.target.value); setConfirming(false); }} />
          </Field>
        </Card>
      </Section>

      {showChanges && (
        <Section title={s.changes}>
          <Card className="grid gap-4">
            <ChangeTable previous={diff.previous} next={diff.next} f={f} s={s} />
            {diff.material && (
              <>
                <Notice tone="warning">{s.recalcWarning}</Notice>
                <Field label={s.reason} hint={s.reasonHelp}>
                  <TextArea value={reason} onChange={(e) => { setReason(e.target.value); setConfirming(false); }} placeholder={s.reasonPlaceholder} />
                </Field>
              </>
            )}
          </Card>
        </Section>
      )}

      {diff.material && <EstimatePreview values={values} />}

      {error && <Notice tone="error">{error}</Notice>}

      {confirming && (
        <div ref={confirmRef}>
          <Card className="grid gap-3 border-2 border-brand-500">
            <p className="text-[17px] font-extrabold text-ink">{s.confirmTitle}</p>
            {showChanges && <ChangeTable previous={diff.previous} next={diff.next} f={f} s={s} />}
            {diff.material && <p className="text-[15px] font-medium text-ink-soft">“{reason.trim()}”</p>}
            <Button size="lg" icon={Save} onClick={handleSave} loading={loading}>{loading ? s.saving : s.confirmYes}</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>{s.confirmNo}</Button>
          </Card>
        </div>
      )}

      {!confirming && (
        <BottomAction>
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <Button variant="secondary" size="lg" onClick={() => navigate(`/loans/${id}`)}>{s.cancel}</Button>
            <Button size="lg" onClick={review}>{s.review}</Button>
          </div>
        </BottomAction>
      )}
    </Screen>
  );
}
