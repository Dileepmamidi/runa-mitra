import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, SectionTitle } from "./Card";
import { useApp } from "../context/AppContext";
import { calculateLoan, formatPaise, toDateKey } from "../utils/interestEngine";

const text = {
  te: {
    title: "లెక్క వివరాలు",
    asOf: "ఈ తేదీ నాటికి",
    principal: "తీసుకున్న అసలు",
    interest: "ఇప్పటివరకు వడ్డీ",
    paid: "చెల్లించినది",
    remainingPrincipal: "మిగిలిన అసలు",
    unpaidInterest: "చెల్లించని వడ్డీ",
    outstanding: "మొత్తం బాకీ",
    clarify: "స్పష్టత అవసరం",
    clarifyHelp: "ఈ రుణ నిబంధనలు పూర్తిగా లేవు, కాబట్టి ఖచ్చితమైన మొత్తం చూపలేము:",
    month: "నెలకు",
    year: "సంవత్సరానికి",
    simple: "సాధారణ వడ్డీ",
    compound: "చక్రవడ్డీ",
    explain: (r, rate) =>
      `మీరు ${r.terms.startDate} న ${formatPaise(r.principalPaise)} తీసుకున్నారు. అంగీకరించిన వడ్డీ ${rate}. నమోదైన చెల్లింపుల ప్రకారం ${r.asOf} నాటికి అంచనా బాకీ ${formatPaise(r.outstandingPaise)}.`,
    rules: "చెల్లింపులు ముందు వడ్డీకి, తర్వాత అసలుకు జమ అవుతాయి. నెల వడ్డీ = పూర్తి నెలలు + మిగిలిన రోజులు ÷ 30.",
    rulesYear: "చెల్లింపులు ముందు వడ్డీకి, తర్వాత అసలుకు జమ అవుతాయి. సంవత్సర వడ్డీ = రోజులు ÷ 365.",
    pending: "ఆమోదం కోసం వేచి ఉన్న చెల్లింపులు ఈ లెక్కలో లేవు."
  },
  en: {
    title: "Amount breakdown",
    asOf: "As of",
    principal: "Principal received",
    interest: "Interest so far",
    paid: "Paid so far",
    remainingPrincipal: "Principal left",
    unpaidInterest: "Unpaid interest",
    outstanding: "Total outstanding",
    clarify: "Needs clarification",
    clarifyHelp: "The loan terms are incomplete, so an exact amount cannot be shown:",
    month: "per month",
    year: "per year",
    simple: "simple interest",
    compound: "compound interest",
    explain: (r, rate) =>
      `You received ${formatPaise(r.principalPaise)} on ${r.terms.startDate}. The agreed interest is ${rate}. Based on recorded payments, the estimated amount due as of ${r.asOf} is ${formatPaise(r.outstandingPaise)}.`,
    rules: "Payments go to interest first, then principal. Monthly interest = full months + extra days ÷ 30.",
    rulesYear: "Payments go to interest first, then principal. Yearly interest = days ÷ 365.",
    pending: "Payments waiting for approval are not included."
  }
};

export function useLoanCalculation(loan, payments, asOf) {
  return useMemo(() => {
    if (!loan) return null;
    const loanPayments = payments.filter((p) => p.loanId === loan.id);
    return calculateLoan(loan, loanPayments, asOf || toDateKey(new Date()));
  }, [loan, payments, asOf]);
}

function Row({ label, value, strong, tone = "text-slate-950" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className={`text-sm font-bold ${strong ? "text-slate-900" : "text-slate-500"}`}>{label}</span>
      <span className={`${strong ? "text-2xl font-black" : "text-lg font-bold"} ${tone}`}>{value}</span>
    </div>
  );
}

export function LoanBreakdown({ loan, payments }) {
  const { language } = useApp();
  const s = text[language] || text.te;
  const result = useLoanCalculation(loan, payments);
  if (!result) return null;

  const hasPending = payments.some((p) => p.loanId === loan.id && p.status === "pending_verification");

  if (result.status !== "ok") {
    return (
      <Card className="border-2 border-marigold-500">
        <div className="flex items-center gap-2 text-lg font-black text-slate-950">
          <AlertTriangle size={20} className="text-marigold-500" /> {s.clarify}
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-600">{s.clarifyHelp}</p>
        <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-slate-700">
          {result.issues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      </Card>
    );
  }

  const t = result.terms;
  const rate = `${t.ratePercent}% ${t.rateUnit === "year" ? s.year : s.month} (${t.method === "compound" ? s.compound : s.simple})`;

  return (
    <Card>
      <SectionTitle title={s.title} action={<span className="text-xs font-bold text-slate-500">{s.asOf} {result.asOf}</span>} />
      <Row label={s.principal} value={formatPaise(result.principalPaise)} />
      <Row label={s.interest} value={formatPaise(result.interestAccruedPaise)} />
      <Row label={s.paid} value={formatPaise(result.totalPaidPaise)} tone="text-leaf-700" />
      <Row label={s.remainingPrincipal} value={formatPaise(result.remainingPrincipalPaise)} />
      <Row label={s.unpaidInterest} value={formatPaise(result.unpaidInterestPaise)} />
      <Row label={s.outstanding} value={formatPaise(result.outstandingPaise)} strong tone="text-danger-500" />
      <p className="mt-3 rounded-[8px] bg-leaf-50 p-3 text-sm font-semibold text-slate-700">{s.explain(result, rate)}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{t.rateUnit === "year" ? s.rulesYear : s.rules}</p>
      {hasPending && <p className="mt-1 text-xs font-semibold text-slate-500">{s.pending}</p>}
      {result.notes.map((note) => <p key={note} className="mt-1 text-xs font-semibold text-slate-500">{note}</p>)}
    </Card>
  );
}
