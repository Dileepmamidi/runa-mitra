import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { arrayUnion, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { CalendarClock, Inbox, Save } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { db } from "../config/firebase";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { updateUserRecord } from "../services/firebaseService";
import {
  addDays, calculateLoan, countsAsPaid, ENGINE_VERSION, formatPaise, rupeesToPaise, termsFromLoan, toDateKey
} from "../utils/interestEngine";
import { BottomAction, Button, Card, DetailRow, EmptyState, Field, Input, Notice, Screen, Section, Select, TextArea } from "../ui";
import { extensionCopy } from "./RepaymentExtension.copy";

const KINDS = ["due_date", "same_cycle", "new_cycle", "pause"];
export const MAX_SAME_CYCLE_DAYS = 31;

/** Same-cycle rule: the agreed date is before the received date, at most 31 days earlier, and not before the loan date. */
export function sameCycleDateOk(effectiveKey, recordedKey, startKey) {
  if (!effectiveKey || !recordedKey) return false;
  if (effectiveKey >= recordedKey) return false;
  if (effectiveKey < addDays(recordedKey, -MAX_SAME_CYCLE_DAYS)) return false;
  if (startKey && effectiveKey < startKey) return false;
  return true;
}

const paymentAmountPaise = (p) => (Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount) || 0);
const receivedKey = (p) => toDateKey(p.paymentDate) || toDateKey(p.createdAt);

// Terms to write back. Legacy loans get terms built from their old fields
// (the same way the engine reads them), without undefined values.
function storedTerms(loan) {
  if (loan.terms && typeof loan.terms === "object") return { ...loan.terms };
  const legacy = termsFromLoan(loan) || {};
  const { source, ...rest } = legacy;
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
  return { ...clean, allocation: "interest_first", pauses: [], engineVersion: ENGINE_VERSION };
}

/**
 * Works out what a schedule change would write, or an error key.
 * Returns { error } or { loanAfter, paymentsAfter, loanUpdate, paymentUpdate, previous, next, extra }.
 */
function planChange({ kind, loan, loanPayments, calcOk, newDue, paymentId, effectiveDate, anchorDate, pauseFrom, pauseTo, agreed }) {
  const terms = termsFromLoan(loan) || {};
  const start = toDateKey(terms.startDate);
  const oldDue = loan.dueDate || "";
  const dueKey = toDateKey(newDue);
  const previous = {};
  const next = {};
  const loanUpdate = {};
  let loanAfter = loan;
  let paymentsAfter = loanPayments;
  let paymentUpdate = null;
  const extra = {};

  if (kind !== "due_date" && !calcOk) return { error: "errUnclear" };

  if (kind === "due_date" || dueKey) {
    if (!dueKey || (start && dueKey < start) || dueKey === oldDue) return { error: "errDue" };
    previous.dueDate = oldDue || null;
    next.dueDate = dueKey;
    loanUpdate.dueDate = dueKey;
    loanAfter = { ...loanAfter, dueDate: dueKey };
  }

  if (kind === "same_cycle") {
    const payment = loanPayments.find((p) => p.id === paymentId && countsAsPaid(p));
    if (!payment) return { error: "errPayment" };
    const eff = toDateKey(effectiveDate);
    const recorded = receivedKey(payment);
    if (!sameCycleDateOk(eff, recorded, start)) return { error: "errEffective" };
    const oldEff = toDateKey(payment.effectiveDate) || null;
    if (oldEff === eff) return { error: "errSameDate" };
    previous.effectiveDate = oldEff;
    next.effectiveDate = eff;
    Object.assign(extra, { paymentId: payment.id, paymentDate: recorded, paymentAmountPaise: paymentAmountPaise(payment) });
    paymentUpdate = { id: payment.id, effectiveDate: eff };
    paymentsAfter = loanPayments.map((p) => (p.id === payment.id ? { ...p, effectiveDate: eff } : p));
  }

  if (kind === "new_cycle") {
    if (terms.method !== "compound") return { error: "errSimple" };
    const anchor = toDateKey(anchorDate);
    const oldAnchor = toDateKey(terms.cycleAnchorDate) || null;
    if (!anchor || anchor < start || anchor === (oldAnchor || start)) return { error: "errAnchor" };
    const newTerms = { ...storedTerms(loan), cycleAnchorDate: anchor };
    previous.cycleAnchorDate = oldAnchor;
    next.cycleAnchorDate = anchor;
    loanUpdate.terms = newTerms;
    loanAfter = { ...loanAfter, terms: newTerms };
  }

  if (kind === "pause") {
    const from = toDateKey(pauseFrom);
    const to = toDateKey(pauseTo);
    if (!from || !to || from < start || to <= from) return { error: "errPause" };
    const base = storedTerms(loan);
    const oldPauses = Array.isArray(base.pauses) ? base.pauses : [];
    const overlaps = oldPauses.some((p) => {
      const pf = toDateKey(p.from);
      const pt = toDateKey(p.to);
      return pf && pt && from < pt && pf < to;
    });
    if (overlaps) return { error: "errPauseOverlap" };
    if (!agreed) return { error: "errAgreed" };
    const newPauses = [...oldPauses, { from, to }];
    const newTerms = { ...base, pauses: newPauses };
    previous.pauses = oldPauses;
    next.pauses = newPauses;
    loanUpdate.terms = newTerms;
    loanAfter = { ...loanAfter, terms: newTerms };
  }

  return { loanAfter, paymentsAfter, loanUpdate, paymentUpdate, previous, next, extra };
}

function Diff({ s, before, after }) {
  const d = after - before;
  const text = d === 0 ? s.diffNone : d < 0 ? s.diffLess(formatPaise(-d)) : s.diffMore(formatPaise(d));
  return <span className={d < 0 ? "text-brand-700" : d > 0 ? "text-rose-600" : "text-ink"}>{text}</span>;
}

export function RepaymentExtension() {
  const { user, borrowers, loans, payments, refreshData } = useApp();
  const s = useCopy(extensionCopy);
  const labels = useCopy(loanLabelsCopy);
  const [params, setParams] = useSearchParams();
  const today = toDateKey(new Date());
  const loanId = params.get("loan") || "";
  const loan = loans.find((l) => l.id === loanId);

  const [kind, setKind] = useState("due_date");
  const [newDue, setNewDue] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [anchorDate, setAnchorDate] = useState("");
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseTo, setPauseTo] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [confirming]);

  const loanPayments = useMemo(() => (loan ? payments.filter((p) => p.loanId === loan.id) : []), [loan, payments]);
  const calcNow = useMemo(() => (loan ? calculateLoan(loan, loanPayments, today) : null), [loan, loanPayments, today]);
  const calcOk = calcNow?.status === "ok";
  const terms = calcNow?.terms || {};
  const isCompound = terms.method === "compound";

  const plan = useMemo(() => {
    if (!loan) return null;
    return planChange({ kind, loan, loanPayments, calcOk, newDue, paymentId, effectiveDate, anchorDate, pauseFrom, pauseTo, agreed });
  }, [kind, loan, loanPayments, calcOk, newDue, paymentId, effectiveDate, anchorDate, pauseFrom, pauseTo, agreed]);

  // Before/after amounts from the interest engine.
  const impact = useMemo(() => {
    if (!loan || !plan || plan.error || !calcOk) return null;
    const amountAt = (l, ps, d) => {
      if (!d) return null;
      const r = calculateLoan(l, ps, d);
      return r.status === "ok" ? r.outstandingPaise : null;
    };
    const oldDue = toDateKey(loan.dueDate);
    const targetDue = toDateKey(plan.next.dueDate) || oldDue;
    if (kind === "due_date") {
      return {
        kind,
        oldDue,
        newDue: targetDue,
        atOld: amountAt(loan, loanPayments, oldDue),
        atNew: amountAt(plan.loanAfter, plan.paymentsAfter, targetDue)
      };
    }
    return {
      kind,
      today: { before: amountAt(loan, loanPayments, today), after: amountAt(plan.loanAfter, plan.paymentsAfter, today) },
      due: targetDue && targetDue !== today
        ? { date: targetDue, before: amountAt(loan, loanPayments, targetDue), after: amountAt(plan.loanAfter, plan.paymentsAfter, targetDue) }
        : null
    };
  }, [loan, plan, calcOk, kind, loanPayments, today]);

  const touch = (fn) => (e) => {
    setConfirming(false);
    setError("");
    fn(e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e);
  };

  if (!loanId || !loan) {
    return (
      <Screen title={s.title} back="/more">
        {loanId && !loan && <Notice tone="warning">{s.notFound}</Notice>}
        {loans.length === 0 ? (
          <EmptyState icon={CalendarClock} title={s.noLoans} />
        ) : (
          <Card>
            <Field label={s.chooseLoanTitle}>
              <Select value="" onChange={(e) => e.target.value && setParams({ loan: e.target.value })}>
                <option value="">{s.chooseLoan}</option>
                {loans.map((l) => {
                  const b = borrowers.find((x) => x.id === l.borrowerId);
                  const amount = formatPaise(Number.isInteger(l.terms?.principalPaise) ? l.terms.principalPaise : rupeesToPaise(l.principal) || 0);
                  return (
                    <option key={l.id} value={l.id}>
                      {s.loanOption(borrowerName(b) || l.borrowerName || labels.unknownBorrower, amount, toDateKey(l.terms?.startDate) || l.loanDate || "—")}
                    </option>
                  );
                })}
              </Select>
            </Field>
          </Card>
        )}
        <InboxCard s={s} />
      </Screen>
    );
  }

  const borrower = borrowers.find((b) => b.id === loan.borrowerId);
  const name = borrowerName(borrower) || loan.borrowerName || labels.unknownBorrower;
  const linked = Boolean(borrower?.linkedUid);
  const start = toDateKey(terms.startDate);
  const eligiblePayments = loanPayments
    .filter((p) => countsAsPaid(p) && receivedKey(p))
    .sort((a, b) => (receivedKey(a) < receivedKey(b) ? 1 : -1));
  const selectedPayment = eligiblePayments.find((p) => p.id === paymentId);
  const existingPauses = (terms.pauses || []).map((p) => ({ from: toDateKey(p.from), to: toDateKey(p.to) })).filter((p) => p.from && p.to);
  const rateText = calcOk
    ? `${terms.ratePercent}% ${labels.rateUnits[terms.rateUnit] || ""} · ${labels.interestMethods[terms.method] || ""}${isCompound ? ` · ${labels.cycles[terms.compounding] || ""}` : ""}`
    : "—";

  const review = () => {
    setError("");
    if (!user) return setError(s.errLogin);
    if (!plan) return setError(s.errLoan);
    if (plan.error) return setError(s[plan.error]);
    if (reason.trim().length < 3) return setError(s.errReason);
    setConfirming(true);
  };

  const handleSave = async () => {
    if (!user || !plan || plan.error) return;
    setError("");
    try {
      setLoading(true);
      const entry = {
        changeId: crypto.randomUUID(),
        changedAt: new Date().toISOString(),
        changedBy: user.uid,
        kind,
        previous: plan.previous,
        next: plan.next,
        reason: reason.trim(),
        ...plan.extra
      };
      const loanUpdate = { ...plan.loanUpdate, termsHistory: arrayUnion(entry) };
      if (plan.paymentUpdate) {
        // The payment and the history entry are saved together or not at all.
        const batch = writeBatch(db);
        batch.update(doc(db, "users", user.uid, "payments", plan.paymentUpdate.id), {
          effectiveDate: plan.paymentUpdate.effectiveDate,
          adjustmentReason: reason.trim(),
          adjustmentChangeId: entry.changeId,
          updatedAt: serverTimestamp()
        });
        batch.update(doc(db, "users", user.uid, "loans", loan.id), { ...loanUpdate, updatedAt: serverTimestamp() });
        await batch.commit();
      } else {
        await updateUserRecord(user.uid, "loans", loan.id, loanUpdate);
      }
      await refreshData();
      setSaved(true);
      setConfirming(false);
    } catch (err) {
      console.error(err);
      setError(s.saveError);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <Screen title={s.title} subtitle={s.subtitle(name)} back={`/loans/${loan.id}`}>
        <Notice tone="success" title={s.savedTitle}>
          <p>{s.savedText}</p>
          <p className="mt-1">{linked ? s.borrowerLinked : s.borrowerNotLinked}</p>
        </Notice>
        <Button size="lg" to={`/loans/${loan.id}`}>{s.seeLoan}</Button>
      </Screen>
    );
  }

  const dateRow = (label, before, after) => (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-[13px] font-bold text-ink-muted">{label}</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[12px] font-semibold text-ink-muted">{s.before}</p>
          <p className="tabular text-[17px] font-bold text-ink-soft">{before === null ? "—" : formatPaise(before)}</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-ink-muted">{s.after}</p>
          <p className="tabular text-[17px] font-extrabold text-ink">{after === null ? "—" : formatPaise(after)}</p>
        </div>
      </div>
      {before !== null && after !== null && <p className="mt-1 text-[15px] font-bold"><Diff s={s} before={before} after={after} /></p>}
    </div>
  );

  return (
    <Screen title={s.title} subtitle={s.subtitle(name)} back={`/loans/${loan.id}`}>
      <Section title={s.current}>
        <Card>
          <DetailRow label={s.currentDue} value={loan.dueDate || s.notSet} />
          <DetailRow label={s.currentRate} value={rateText} />
        </Card>
      </Section>

      {!calcOk && <Notice tone="warning">{s.impactUnclear}</Notice>}

      <Section title={s.choiceTitle}>
        <div className="grid gap-2">
          {KINDS.map((k) => {
            const disabled = (k === "new_cycle" && calcOk && !isCompound) || (k !== "due_date" && !calcOk);
            const active = kind === k;
            return (
              <button
                key={k}
                type="button"
                disabled={disabled}
                onClick={touch(() => setKind(k))}
                className={`min-h-14 rounded-2xl border-2 p-4 text-left transition ${active ? "border-brand-500 bg-brand-50" : "border-line bg-white"} disabled:opacity-60`}
              >
                <span className="block text-[16px] font-extrabold text-ink">{s.kinds[k]}</span>
                <span className="mt-1 block text-[14px] font-medium text-ink-soft">
                  {k === "new_cycle" && calcOk && !isCompound ? s.simpleNoCycle : s.kindHelp[k]}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Card className="grid gap-4">
        {kind === "same_cycle" && (
          eligiblePayments.length === 0 ? (
            <Notice tone="info">{s.noPayments}</Notice>
          ) : (
            <>
              <Field label={s.payment}>
                <Select value={paymentId} onChange={touch(setPaymentId)}>
                  <option value="">{s.choosePayment}</option>
                  {eligiblePayments.map((p) => (
                    <option key={p.id} value={p.id}>
                      {s.paymentOption(formatPaise(paymentAmountPaise(p)), receivedKey(p))}
                      {toDateKey(p.effectiveDate) ? s.paymentAdjusted(toDateKey(p.effectiveDate)) : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={s.effectiveDate} hint={s.effectiveHelp}>
                <Input
                  type="date"
                  value={effectiveDate}
                  min={selectedPayment ? [addDays(receivedKey(selectedPayment), -MAX_SAME_CYCLE_DAYS), start].filter(Boolean).sort().pop() : start || undefined}
                  max={selectedPayment ? addDays(receivedKey(selectedPayment), -1) : undefined}
                  onChange={touch(setEffectiveDate)}
                />
              </Field>
            </>
          )
        )}

        {kind === "new_cycle" && (
          <Field label={s.anchorDate} hint={s.anchorCurrent(toDateKey(terms.cycleAnchorDate) || start || "—")}>
            <Input type="date" min={start || undefined} value={anchorDate} onChange={touch(setAnchorDate)} />
          </Field>
        )}

        {kind === "pause" && (
          <>
            {existingPauses.length > 0 && (
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-[13px] font-bold text-ink-muted">{s.pausesNow}</p>
                {existingPauses.map((p) => <p key={`${p.from}-${p.to}`} className="tabular text-[15px] font-bold text-ink">{p.from} → {p.to}</p>)}
              </div>
            )}
            <Field label={s.pauseFrom}><Input type="date" min={start || undefined} value={pauseFrom} onChange={touch(setPauseFrom)} /></Field>
            <Field label={s.pauseTo}><Input type="date" min={pauseFrom || start || undefined} value={pauseTo} onChange={touch(setPauseTo)} /></Field>
            <label className="flex items-start gap-3 rounded-xl bg-canvas p-3">
              <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-brand-600" checked={agreed} onChange={touch(setAgreed)} />
              <span className="text-[15px] font-bold text-ink">{s.pauseAgreed}</span>
            </label>
          </>
        )}

        <Field label={kind === "due_date" ? s.newDue : s.newDueOptional}>
          <Input type="date" min={start || undefined} value={newDue} onChange={touch(setNewDue)} />
        </Field>

        <Field label={s.reason} hint={s.reasonHelp}>
          <TextArea value={reason} placeholder={s.reasonPlaceholder} onChange={touch(setReason)} />
        </Field>
      </Card>

      <Section title={s.impactTitle}>
        {!calcOk ? (
          <Notice tone="warning">{s.impactUnclear}</Notice>
        ) : !impact ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.impactNeedInput}</p></Card>
        ) : impact.kind === "due_date" ? (
          <Card className="grid gap-2">
            {impact.oldDue && impact.atOld !== null && <DetailRow label={s.atOldDue(impact.oldDue)} value={formatPaise(impact.atOld)} />}
            {impact.atNew !== null && <DetailRow label={s.atNewDue(impact.newDue)} value={formatPaise(impact.atNew)} strong />}
            {impact.atOld !== null && impact.atNew !== null && impact.atNew > impact.atOld && (
              <p className="text-[15px] font-bold text-ink">{s.extraTime(formatPaise(impact.atNew - impact.atOld))}</p>
            )}
            <p className="text-[13px] font-medium text-ink-muted">{s.kindHelp.due_date}</p>
          </Card>
        ) : (
          <Card className="grid gap-2">
            {dateRow(s.asOfToday(today), impact.today.before, impact.today.after)}
            {impact.due && dateRow(s.asOfDue(impact.due.date), impact.due.before, impact.due.after)}
          </Card>
        )}
      </Section>

      <Notice tone="info">{linked ? s.borrowerLinked : s.borrowerNotLinked}</Notice>

      {error && <Notice tone="error">{error}</Notice>}

      {confirming && plan && !plan.error && (
        <div ref={confirmRef}>
          <Card className="grid gap-3 border-2 border-brand-500">
            <p className="text-[17px] font-extrabold text-ink">{s.confirmTitle}</p>
            <div>
              <DetailRow label={s.confirmKind} value={s.kinds[kind]} />
              {plan.next.dueDate && <DetailRow label={s.newDue} value={plan.next.dueDate} />}
              {plan.next.effectiveDate && <DetailRow label={s.effectiveDate} value={plan.next.effectiveDate} />}
              {plan.next.cycleAnchorDate && <DetailRow label={s.anchorDate} value={plan.next.cycleAnchorDate} />}
              {kind === "pause" && <DetailRow label={s.pauseFrom} value={`${toDateKey(pauseFrom)} → ${toDateKey(pauseTo)}`} />}
            </div>
            <p className="text-[15px] font-medium text-ink-soft">{s.confirmReason}: “{reason.trim()}”</p>
            <Button size="lg" icon={Save} onClick={handleSave} loading={loading}>{loading ? s.saving : s.confirmYes}</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>{s.confirmNo}</Button>
          </Card>
        </div>
      )}

      <InboxCard s={s} />

      {!confirming && (
        <BottomAction>
          <Button size="lg" block icon={CalendarClock} onClick={review}>{s.review}</Button>
        </BottomAction>
      )}
    </Screen>
  );
}

function InboxCard({ s }) {
  return (
    <Card>
      <p className="text-[17px] font-bold text-ink">{s.inboxTitle}</p>
      <p className="mt-1 text-[15px] font-medium text-ink-soft">{s.inboxText}</p>
      <div className="mt-3">
        <Button icon={Inbox} variant="secondary" block to="/inbox">{s.openInbox}</Button>
      </div>
    </Card>
  );
}
