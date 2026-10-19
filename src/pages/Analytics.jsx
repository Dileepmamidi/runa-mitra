import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { ChartBars } from "../components/ChartBars";
import { ModeGate } from "../components/ModeGate";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { calculateLoan, countsAsPaid, formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { Card, DetailRow, EmptyState, Notice, Screen, Section } from "../ui";
import { analyticsCopy } from "./Analytics.copy";

const FEW_LOANS = 5;

// Plain totals from recorded data. No scores, no predictions, no labels about people.
export function Analytics() {
  const { borrowers, loans, payments, language } = useApp();
  const s = useCopy(analyticsCopy);
  const today = toDateKey(new Date());

  const monthly = useMemo(() => {
    const locale = language === "te" ? "te-IN" : "en-IN";
    const counted = payments.filter(countsAsPaid);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const paise = counted
        .filter((p) => (toDateKey(p.paymentDate) || toDateKey(p.createdAt) || "").startsWith(month))
        .reduce((sum, p) => sum + (rupeesToPaise(p.amount) || 0), 0);
      return { label: d.toLocaleString(locale, { month: "short" }), value: paise, display: formatPaise(paise) };
    });
  }, [payments, language]);

  const totals = useMemo(() => {
    let principal = 0;
    let interest = 0;
    let unclear = 0;
    const groups = new Map();
    for (const loan of loans) {
      const calc = calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), today);
      const borrower = borrowers.find((b) => b.id === loan.borrowerId);
      const key = borrower?.occupation || "";
      if (calc.status !== "ok") {
        unclear += 1;
        continue;
      }
      principal += calc.principalPaidPaise;
      interest += calc.interestPaidPaise;
      if (!calc.settled) {
        const g = groups.get(key) || { key, count: 0, paise: 0 };
        g.count += 1;
        g.paise += calc.outstandingPaise;
        groups.set(key, g);
      }
    }
    return { principal, interest, unclear, groups: [...groups.values()].sort((a, b) => b.paise - a.paise) };
  }, [loans, payments, borrowers, today]);

  const occupationLabel = (key) => (key ? s.occupations[key] || key : s.notRecorded);

  return (
    <Screen title={s.title} subtitle={s.subtitle} back="/more">
      <ModeGate min="Regular">
        {loans.length === 0 ? (
          <EmptyState icon={BarChart3} title={s.noLoans} />
        ) : (
          <>
            {loans.length < FEW_LOANS && <Notice tone="info">{s.fewLoans}</Notice>}

            <Section title={s.monthly}>
              <Card>
                <ChartBars data={monthly} />
                <p className="mt-3 text-[13px] font-medium text-ink-muted">{s.monthlyHint}</p>
              </Card>
            </Section>

            <Section title={s.split}>
              <Card>
                <DetailRow label={s.principal} value={formatPaise(totals.principal)} />
                <DetailRow label={s.interest} value={formatPaise(totals.interest)} />
              </Card>
              {totals.unclear > 0 && <div className="mt-3"><Notice tone="warning">{s.unclear(totals.unclear)}</Notice></div>}
            </Section>

            {totals.groups.length > 0 && (
              <Section title={s.byOccupation}>
                <Card>
                  {totals.groups.map((g) => (
                    <DetailRow key={g.key || "none"} label={`${occupationLabel(g.key)} · ${s.loansCount(g.count)}`} value={formatPaise(g.paise)} />
                  ))}
                  <p className="mt-3 text-[13px] font-medium text-ink-muted">{s.byOccupationHint}</p>
                </Card>
              </Section>
            )}
          </>
        )}
      </ModeGate>
    </Screen>
  );
}
