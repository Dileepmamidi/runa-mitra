import { Link, useParams } from "react-router-dom";
import { CalendarClock, HelpCircle, Landmark, ThumbsDown, Wallet } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { LoanBreakdown } from "../../components/LoanBreakdown";
import { VoiceSummary } from "../../components/VoiceSummary";
import { formatPaise, rupeesToPaise, termsFromLoan, toDateKey } from "../../utils/interestEngine";
import { Badge, Button, Card, DetailRow, EmptyState, Notice, Screen, Section } from "../../ui";
import {
  changeAcknowledgement, changeKey, collateralForLoan, dateKeyOf, dueText, guarantorsForLoan, spokenAmountParts, useBorrowerLoans
} from "./borrowerData";
import { AcknowledgeButton, AcknowledgedLine, LoanSecurityRecords } from "./BorrowerLoanRecords";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerLoanDetailsCopy } from "./BorrowerLoanDetails.copy";

const lower = (v) => (typeof v === "string" ? v.toLowerCase() : v);

// Turns one termsHistory entry into a list of { field, from, to } changes.
// Accepts { changes: [{ field, from, to }] }, { field, from, to } or
// { previous: {...}, next: {...} } shaped entries.
function changeLines(entry) {
  if (!entry || typeof entry !== "object") return [];
  if (Array.isArray(entry.changes)) {
    return entry.changes.map((c) => ({ field: c.field, from: c.from ?? c.previous ?? c.old, to: c.to ?? c.next ?? c.new }));
  }
  if (entry.field) return [{ field: entry.field, from: entry.from ?? entry.previous ?? entry.old, to: entry.to ?? entry.next ?? entry.new }];
  const before = entry.previous || entry.before || entry.old || {};
  const after = entry.next || entry.after || entry.new || {};
  if (typeof before !== "object" || typeof after !== "object") return [];
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((k) => !["engineVersion", "source", "allocation"].includes(k));
  return keys
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map((k) => ({ field: k, from: before[k], to: after[k] }));
}

export function BorrowerLoanDetails() {
  const { id } = useParams();
  const { payments, user, language, guarantors, collateral } = useApp();
  const s = useCopy(borrowerLoanDetailsCopy);
  const sh = useCopy(borrowerSharedCopy);
  const item = useBorrowerLoans().find((x) => x.loan.id === id);

  if (!item) {
    return (
      <Screen title={s.title} back="/home">
        <EmptyState icon={Landmark} title={s.notFoundTitle} text={s.notFoundText} action={<Button to="/home">{s.goHome}</Button>} />
      </Screen>
    );
  }

  const { loan, calc, due } = item;
  const terms = termsFromLoan(loan) || {};
  const method = lower(terms.method);
  const principalOk = Number.isInteger(terms.principalPaise) && terms.principalPaise > 0;
  const rateOk = Number.isFinite(terms.ratePercent) && terms.ratePercent >= 0;
  const repaymentRaw = terms.repayment || terms.repaymentType || loan.repaymentType || "";
  const repayment = repaymentRaw ? s.repaymentTypes[repaymentRaw] || repaymentRaw : sh.notRecorded;
  const dueDate = toDateKey(loan.dueDate) || toDateKey(terms.dueDate);
  const pauses = (terms.pauses || []).map((p) => ({ from: toDateKey(p.from), to: toDateKey(p.to) })).filter((p) => p.from && p.to);
  const history = Array.isArray(loan.termsHistory) ? [...loan.termsHistory] : [];
  history.sort((a, b) => (dateKeyOf(b?.changedAt || b?.date || b?.at || b?.createdAt) || "").localeCompare(dateKeyOf(a?.changedAt || a?.date || a?.at || a?.createdAt) || ""));

  const loanGuarantors = guarantorsForLoan(loan, guarantors);
  const loanCollateral = collateralForLoan(loan, collateral);

  // Plain-language summary for reading aloud, from the engine result only.
  const money = (paise) => s.money(spokenAmountParts(paise));
  const voiceText = calc.status !== "ok"
    ? s.voiceUnclear
    : calc.settled
      ? s.voiceSettled
      : [
        s.voiceOk({
          principal: money(calc.principalPaise),
          start: toDateKey(calc.terms?.startDate) ? sh.date(toDateKey(calc.terms.startDate)) : "",
          interest: money(calc.interestAccruedPaise),
          paid: money(calc.totalPaidPaise),
          owed: money(calc.outstandingPaise)
        }),
        due ? s.voiceDue(`${dueText(sh, due)}, ${sh.date(due.date)}`) : ""
      ].filter(Boolean).join(" ");

  const formatValue = (field, value) => {
    if (value === undefined || value === null || value === "") return sh.notRecorded;
    switch (field) {
      case "principalPaise": return formatPaise(Number(value));
      case "principal": return formatPaise(rupeesToPaise(value));
      case "ratePercent":
      case "interestRate": return `${value}%`;
      case "rateUnit": return s.unitValue[value] || String(value);
      case "method":
      case "interestType": return s.methodShort[lower(value)] || String(value);
      case "compounding":
      case "cycle": return s.frequency[lower(value)] || String(value);
      case "startDate":
      case "loanDate":
      case "dueDate": return sh.date(dateKeyOf(value)) || String(value);
      case "pauses": return Array.isArray(value) ? s.pauseCount(value.length) : String(value);
      case "repaymentType": return s.repaymentTypes[value] || String(value);
      default: return typeof value === "object" ? JSON.stringify(value) : String(value);
    }
  };

  return (
    <Screen
      title={sh.loanFrom(loan.lenderName)}
      back="/home"
      actions={calc.status !== "ok" ? <Badge tone="amber">{sh.needsClarification}</Badge> : calc.settled ? <Badge tone="brand">{sh.settled}</Badge> : null}
    >
      {due && (
        <Notice tone={due.overdue ? "warning" : "info"} title={dueText(sh, due)}>
          {due.days <= 30 ? sh.dueOn(sh.date(due.date)) : null}
        </Notice>
      )}

      <VoiceSummary text={voiceText} lang={language === "en" ? "en" : "te"} />

      <Section title={s.terms}>
        <Card>
          <DetailRow label={s.lender} value={sh.lender(loan.lenderName)} />
          <DetailRow label={s.principal} value={principalOk ? formatPaise(terms.principalPaise) : sh.notRecorded} strong={principalOk} />
          <DetailRow label={s.dateReceived} value={toDateKey(terms.startDate) ? sh.date(toDateKey(terms.startDate)) : sh.notRecorded} />
          <DetailRow
            label={s.rate}
            value={!rateOk ? sh.notRecorded : ["month", "year"].includes(terms.rateUnit) ? s.rateValue(terms.ratePercent, terms.rateUnit) : s.rateUnitMissing(terms.ratePercent)}
          />
          <DetailRow label={s.method} value={method === "simple" ? s.simple : method === "compound" ? s.compound : sh.notRecorded} />
          {method === "compound" && (
            <DetailRow label={s.compounding} value={s.frequency[lower(terms.compounding)] || sh.notRecorded} />
          )}
          <DetailRow label={s.repayment} value={repayment} />
          <DetailRow label={s.dueDate} value={dueDate ? sh.date(dueDate) : sh.noDueDate} />
          {pauses.length > 0 && (
            <DetailRow label={s.pauses} value={pauses.map((p) => s.pauseRange(sh.date(p.from), sh.date(p.to))).join(", ")} />
          )}
        </Card>
      </Section>

      <Notice tone="info" title={s.howApplied}>{s.howAppliedText}</Notice>

      <LoanBreakdown loan={loan} payments={payments.filter((p) => !p.lenderUid || p.lenderUid === loan.lenderUid)} />

      <Section title={s.changes}>
        {history.length === 0 ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.noChanges}</p></Card>
        ) : (
          <div className="grid gap-3">
            {history.map((entry, i) => {
              const when = dateKeyOf(entry?.changedAt || entry?.date || entry?.at || entry?.createdAt);
              const lines = changeLines(entry);
              const key = changeKey(entry);
              const ack = changeAcknowledgement(loan, entry, user?.uid);
              return (
                <Card key={key || i}>
                  <p className="text-[15px] font-bold text-ink">{when ? s.changedOn(sh.date(when)) : s.dateUnknown}</p>
                  {lines.map((c, j) => (
                    <div key={j} className="mt-3 rounded-xl bg-canvas p-3">
                      <p className="text-[13px] font-bold text-ink-muted">{s.fields[c.field] || c.field}</p>
                      <p className="mt-1 text-[15px] font-semibold text-ink-soft">{s.before}: <span className="text-ink line-through decoration-ink-muted/60">{formatValue(c.field, c.from)}</span></p>
                      <p className="text-[16px] font-bold text-ink">{s.after}: {formatValue(c.field, c.to)}</p>
                    </div>
                  ))}
                  {(entry?.reason || entry?.note) && (
                    <p className="mt-3 text-[15px] font-medium text-ink-soft"><span className="font-bold">{s.reason}:</span> {entry.reason || entry.note}</p>
                  )}
                  <div className="mt-4 border-t border-line pt-4">
                    {ack ? (
                      <AcknowledgedLine ack={ack} />
                    ) : !key ? (
                      <p className="text-[14px] font-medium text-ink-muted">{s.cannotAck}</p>
                    ) : (
                      <>
                        <p className="mb-3 text-[15px] font-bold text-amber-700">{s.changeStatusPending}</p>
                        <AcknowledgeButton
                          label={s.agreeChange}
                          lenderUid={loan.lenderUid}
                          collectionName="loans"
                          docId={loan.id}
                          extra={{ kind: "change", changeId: key }}
                        >
                          <Link
                            to={`/help?loan=${loan.id}&topic=loan_change`}
                            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-[17px] font-bold text-rose-700 active:bg-rose-50"
                          >
                            <ThumbsDown size={22} /> {s.disagreeChange}
                          </Link>
                        </AcknowledgeButton>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {(loanGuarantors.length > 0 || loanCollateral.length > 0) && (
        <Section title={s.security}>
          <LoanSecurityRecords guarantors={loanGuarantors} collateral={loanCollateral} />
        </Section>
      )}

      <div className="grid gap-3">
        <Button size="lg" block icon={Wallet} to="/payments">{s.history}</Button>
        <Button size="lg" variant="secondary" block icon={CalendarClock} to={`/extensions/new?loanId=${loan.id}`}>{s.moreTime}</Button>
        <Button size="lg" variant="secondary" block icon={HelpCircle} to={`/help?loan=${loan.id}`}>{s.ask}</Button>
      </div>
    </Screen>
  );
}
