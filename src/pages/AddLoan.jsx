import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Camera, FileImage, Mic, PenLine, Save, UserPlus } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { addUserRecord, uploadEvidence } from "../services/firebaseService";
import { addMonths, calculateLoan, ENGINE_VERSION, formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import {
  BottomAction, Button, Card, DetailRow, EmptyState, Field, FilePicker, Input, Notice, Screen, Section, Segmented, Select, TextArea
} from "../ui";
import { addLoanCopy, loanFormCopy } from "./AddLoan.copy";

// ---------- shared with EditLoan ----------

/** Engine terms built from form values (rate entered as % per month or per year). */
export function buildTerms({ principal, rate, rateUnit, method, cycle, loanDate }, extra = {}) {
  return {
    principalPaise: rupeesToPaise(principal),
    ratePercent: Number(rate),
    rateUnit,
    method,
    ...(method === "compound" ? { compounding: cycle } : {}),
    startDate: loanDate,
    allocation: "interest_first",
    pauses: [],
    ...extra,
    engineVersion: ENGINE_VERSION
  };
}

/** Legacy loan fields that older screens still read. */
export function legacyFields({ principal, rate, method, cycle, loanDate }) {
  return {
    principal: Number(principal),
    interestRate: Number(rate),
    interestType: method === "compound" ? "Compound" : "Simple",
    cycle,
    loanDate
  };
}

export function validateLoanForm(f, v) {
  if (!(Number(v.principal) > 0)) return f.errPrincipal;
  if (v.rate === "" || !Number.isFinite(Number(v.rate)) || Number(v.rate) < 0) return f.errRate;
  if (!toDateKey(v.loanDate)) return f.errDate;
  if (v.dueDate && v.dueDate < v.loanDate) return f.errDue;
  return "";
}

function Label({ children }) {
  return <p className="mb-1.5 text-[15px] font-bold text-ink">{children}</p>;
}

/** Amount, date, rate, unit, method and compounding inputs. */
export function LoanTermsFields({ values, onChange }) {
  const f = useCopy(loanFormCopy);
  const set = (key) => (e) => onChange(key, e?.target ? e.target.value : e);
  return (
    <>
      <Field label={f.principal}>
        <Input type="number" inputMode="decimal" min="0" value={values.principal} onChange={set("principal")} />
      </Field>
      <Field label={f.loanDate}>
        <Input type="date" value={values.loanDate} onChange={set("loanDate")} />
      </Field>
      <Field label={f.rate}>
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={values.rate} onChange={set("rate")} />
      </Field>
      <div>
        <Label>{f.rateUnit}</Label>
        <Segmented value={values.rateUnit} onChange={set("rateUnit")} options={[{ value: "month", label: f.perMonth }, { value: "year", label: f.perYear }]} />
      </div>
      <div>
        <Label>{f.method}</Label>
        <Segmented value={values.method} onChange={set("method")} options={[{ value: "simple", label: f.simple }, { value: "compound", label: f.compound }]} />
        <p className="mt-1.5 text-[13px] font-medium text-ink-muted">{f.methodHelp}</p>
      </div>
      {values.method === "compound" && (
        <div>
          <Label>{f.compounding}</Label>
          <Segmented
            value={values.cycle}
            onChange={set("cycle")}
            options={[{ value: "weekly", label: f.weekly }, { value: "monthly", label: f.monthly }, { value: "yearly", label: f.yearly }]}
          />
        </div>
      )}
    </>
  );
}

/** Amount owed after 1, 3, 6 and 12 months if nothing is paid, from the interest engine. */
export function EstimatePreview({ values }) {
  const s = useCopy(addLoanCopy);
  const rows = useMemo(() => {
    const start = toDateKey(values.loanDate);
    if (!start || !(Number(values.principal) > 0) || values.rate === "" || !(Number(values.rate) >= 0)) return null;
    const loan = { id: "preview", terms: buildTerms({ ...values, loanDate: start }) };
    return [1, 3, 6, 12].map((n) => {
      const calc = calculateLoan(loan, [], addMonths(start, n));
      return calc.status === "ok" ? { n, total: calc.outstandingPaise, interest: calc.unpaidInterestPaise } : null;
    }).filter(Boolean);
  }, [values]);

  return (
    <Section title={s.preview}>
      <Card>
        {!rows || rows.length === 0 ? (
          <p className="text-[15px] font-medium text-ink-muted">{s.previewNeedInput}</p>
        ) : (
          <>
            {rows.map((r) => (
              <DetailRow
                key={r.n}
                label={s.after(r.n)}
                value={
                  <span className="flex flex-col items-end">
                    <span>{formatPaise(r.total)}</span>
                    <span className="text-[13px] font-medium text-ink-muted">{s.interestPart(formatPaise(r.interest))}</span>
                  </span>
                }
              />
            ))}
            <p className="mt-2 text-[13px] font-medium text-ink-muted">{s.previewHelp}</p>
          </>
        )}
      </Card>
    </Section>
  );
}

// ---------- screen ----------

const SECURITY = ["Trust only", "Guarantor", "Gold/Documents"];

export function AddLoan() {
  const { user, borrowers, refreshData } = useApp();
  const s = useCopy(addLoanCopy);
  const f = useCopy(loanFormCopy);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselected = params.get("borrower");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const [borrowerId, setBorrowerId] = useState(
    borrowers.some((b) => b.id === preselected) ? preselected : borrowers.length === 1 ? borrowers[0].id : ""
  );
  // Values confirmed on the Scan old note screen (read once; the lender must still check them).
  const location = useLocation();
  const [prefill] = useState(() => {
    const p = location.state?.prefill;
    return p && typeof p === "object" ? p : null;
  });
  const [values, setValues] = useState(() => ({
    principal: prefill && Number(prefill.principal) > 0 ? String(prefill.principal) : "",
    rate: prefill && prefill.rate != null && prefill.rate !== "" && Number(prefill.rate) >= 0 ? String(prefill.rate) : "",
    rateUnit: prefill?.rateUnit === "year" ? "year" : "month",
    method: "simple",
    cycle: "monthly",
    loanDate: toDateKey(prefill?.loanDate) || toDateKey(new Date()),
    dueDate: ""
  }));
  const [securityType, setSecurityType] = useState("Trust only");
  const [notes, setNotes] = useState(() => (typeof prefill?.notes === "string" ? prefill.notes : ""));

  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorMobile, setGuarantorMobile] = useState("");
  const [guarantorFile, setGuarantorFile] = useState(null);
  const [collateralType, setCollateralType] = useState("");
  const [collateralValue, setCollateralValue] = useState("");
  const [collateralDesc, setCollateralDesc] = useState("");
  const [collateralFile, setCollateralFile] = useState(null);

  const [voiceFile, setVoiceFile] = useState(null);
  const [noteFile, setNoteFile] = useState(null);
  const [signFile, setSignFile] = useState(null);

  const confirmRef = useRef(null);
  useEffect(() => {
    if (confirming) confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [confirming]);

  const change = (key, value) => {
    setConfirming(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  if (borrowers.length === 0) {
    return (
      <Screen title={s.title} back>
        <EmptyState icon={UserPlus} title={s.noBorrowers} action={<Button icon={UserPlus} to="/borrowers/new">{s.addBorrower}</Button>} />
      </Screen>
    );
  }

  const securityLabel = { "Trust only": s.trust, Guarantor: s.guarantor, "Gold/Documents": s.gold };
  const selected = borrowers.find((b) => b.id === borrowerId);

  const review = () => {
    setError("");
    if (!user) return setError(f.errLogin);
    if (!borrowerId) return setError(f.errBorrower);
    const problem = validateLoanForm(f, values);
    if (problem) return setError(problem);
    setConfirming(true);
  };

  const handleSave = async () => {
    setError("");
    try {
      setLoading(true);
      let gSignUrl = "", cPhotoUrl = "", voiceUrl = "", noteUrl = "", signUrl = "";
      if (securityType === "Guarantor" && guarantorFile) gSignUrl = await uploadEvidence(user.uid, guarantorFile);
      if (securityType === "Gold/Documents" && collateralFile) cPhotoUrl = await uploadEvidence(user.uid, collateralFile);
      if (voiceFile) voiceUrl = await uploadEvidence(user.uid, voiceFile);
      if (noteFile) noteUrl = await uploadEvidence(user.uid, noteFile);
      if (signFile) signUrl = await uploadEvidence(user.uid, signFile);

      const principal = Number(values.principal);
      const loanData = {
        borrowerId,
        borrowerName: borrowerName(selected),
        ...legacyFields(values),
        dueDate: values.dueDate,
        securityType,
        notes,
        status: "active",
        balance: principal, // legacy principal-only field; never shown as the amount owed
        // Agreed terms used by the interest engine.
        terms: buildTerms(values),
        createdAt: new Date(),
        attachments: { voiceUrl, noteUrl, signUrl }
      };
      if (securityType === "Guarantor") {
        loanData.guarantor = { name: guarantorName, mobile: guarantorMobile, signatureUrl: gSignUrl };
      } else if (securityType === "Gold/Documents") {
        loanData.collateral = { type: collateralType, value: collateralValue, description: collateralDesc, photoUrl: cPhotoUrl };
      }

      const ref = await addUserRecord(user.uid, "loans", loanData);
      await refreshData();
      navigate(ref?.id ? `/loans/${ref.id}` : "/home");
    } catch (err) {
      console.error(err);
      setError(s.saveError);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const unitLabel = values.rateUnit === "year" ? f.perYear : f.perMonth;
  const methodLabel = values.method === "compound" ? f.compound : f.simple;

  return (
    <Screen title={s.title} subtitle={s.subtitle} back>
      {prefill && <Notice tone="warning">{s.prefillNotice}</Notice>}
      <Section title={s.details}>
        <Card className="grid gap-4">
          <Field label={f.borrower}>
            <Select value={borrowerId} onChange={(e) => { setBorrowerId(e.target.value); setConfirming(false); }}>
              <option value="">{f.chooseBorrower}</option>
              {borrowers.map((b) => <option key={b.id} value={b.id}>{borrowerName(b)}{b.village ? ` · ${b.village}` : ""}</option>)}
            </Select>
          </Field>
          <LoanTermsFields values={values} onChange={change} />
          <Field label={`${f.dueDate} (${f.optional})`}>
            <Input type="date" value={values.dueDate} onChange={(e) => change("dueDate", e.target.value)} />
          </Field>
        </Card>
      </Section>

      <EstimatePreview values={values} />

      <Section title={s.security}>
        <Card className="grid gap-4">
          <Field label={s.securityType}>
            <Select value={securityType} onChange={(e) => setSecurityType(e.target.value)}>
              {SECURITY.map((v) => <option key={v} value={v}>{securityLabel[v]}</option>)}
            </Select>
          </Field>
          {securityType === "Guarantor" && (
            <>
              <Field label={s.guarantorName}><Input value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} /></Field>
              <Field label={s.guarantorMobile}><Input inputMode="tel" value={guarantorMobile} onChange={(e) => setGuarantorMobile(e.target.value)} /></Field>
              <FilePicker label={s.guarantorSign} accept="image/*" icon={PenLine} file={guarantorFile} onChange={setGuarantorFile} placeholder={s.pick} />
            </>
          )}
          {securityType === "Gold/Documents" && (
            <>
              <Field label={s.collateralType}><Input placeholder={s.collateralTypePlaceholder} value={collateralType} onChange={(e) => setCollateralType(e.target.value)} /></Field>
              <Field label={s.collateralValue}><Input type="number" inputMode="decimal" value={collateralValue} onChange={(e) => setCollateralValue(e.target.value)} /></Field>
              <Field label={s.collateralDesc}><TextArea value={collateralDesc} onChange={(e) => setCollateralDesc(e.target.value)} /></Field>
              <FilePicker label={s.collateralPhoto} accept="image/*" icon={Camera} file={collateralFile} onChange={setCollateralFile} placeholder={s.pick} />
            </>
          )}
        </Card>
      </Section>

      <Section title={s.attachments}>
        <Card className="grid gap-3">
          <FilePicker label={s.voice} accept="audio/*" icon={Mic} file={voiceFile} onChange={setVoiceFile} placeholder={s.pick} />
          <FilePicker label={s.oldNote} accept="image/*" icon={FileImage} file={noteFile} onChange={setNoteFile} placeholder={s.pick} />
          <FilePicker label={s.signature} accept="image/*" icon={PenLine} file={signFile} onChange={setSignFile} placeholder={s.pick} />
          <Field label={`${f.notes} (${f.optional})`} hint={f.notesHint}>
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </Card>
      </Section>

      {error && <Notice tone="error">{error}</Notice>}

      {confirming && (
        <div ref={confirmRef}>
        <Card className="border-2 border-brand-500">
          <p className="mb-1 text-[17px] font-extrabold text-ink">{s.confirmTitle}</p>
          <DetailRow label={s.confirmBorrower} value={borrowerName(selected)} />
          <DetailRow label={s.confirmAmount} value={formatPaise(rupeesToPaise(values.principal))} strong />
          <DetailRow label={s.confirmRate} value={s.rateSummary(values.rate, unitLabel, methodLabel)} />
          <DetailRow label={s.confirmDate} value={values.loanDate} />
          <DetailRow label={s.confirmDue} value={values.dueDate || s.notSet} />
          <DetailRow label={s.confirmSecurity} value={securityLabel[securityType]} />
          <div className="mt-4 grid gap-2">
            <Button size="lg" icon={Save} onClick={handleSave} loading={loading}>{loading ? s.saving : s.confirmYes}</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>{s.confirmNo}</Button>
          </div>
        </Card>
        </div>
      )}

      {!confirming && (
        <BottomAction>
          <Button size="lg" block onClick={review}>{s.review}</Button>
        </BottomAction>
      )}
    </Screen>
  );
}
