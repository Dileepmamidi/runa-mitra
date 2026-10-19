import { useMemo } from "react";
import { AlertTriangle, Calculator, CalendarClock, Inbox, ReceiptText, UserPlus } from "lucide-react";
import { ChartBars } from "../components/ChartBars";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { calculateLoan, countsAsPaid, formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { ActionTile, Avatar, Badge, Button, Card, EmptyState, List, ListRow, MoneyHero, Section, Stat } from "../ui";
import { dashboardCopy } from "./HomeDashboard.copy";

const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";

export function HomeDashboard() {
  const { borrowers, payments, loans, appMode, language } = useApp();
  const s = useCopy(dashboardCopy);
  const today = toDateKey(new Date());

  // Every figure comes from the interest engine. Loans whose terms are
  // incomplete are counted at their recorded principal balance and flagged.
  const summary = useMemo(() => {
    let outstanding = 0;
    let lent = 0;
    let principalBack = 0;
    let interestIn = 0;
    let unclear = 0;
    let active = 0;
    const attention = [];

    for (const loan of loans) {
      const calc = calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), today);
      lent += rupeesToPaise(loan.principal) || 0;
      if (calc.status === "ok") {
        outstanding += calc.outstandingPaise;
        principalBack += calc.principalPaidPaise;
        interestIn += calc.interestPaidPaise;
        if (!calc.settled) active += 1;
        if (!calc.settled && loan.dueDate && loan.dueDate <= today) {
          attention.push({ loan, amount: calc.outstandingPaise, overdue: loan.dueDate < today });
        }
      } else {
        unclear += 1;
        active += 1;
        outstanding += rupeesToPaise(loan.balance) || 0;
      }
    }
    attention.sort((a, b) => (a.loan.dueDate < b.loan.dueDate ? -1 : 1));
    const collected = payments.filter(countsAsPaid).reduce((sum, p) => sum + (rupeesToPaise(p.amount) || 0), 0);
    return { outstanding, lent, principalBack, interestIn, unclear, active, attention, collected };
  }, [loans, payments, today]);

  const chart = useMemo(() => {
    const locale = language === "te" ? "te-IN" : "en-IN";
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const month = d.toISOString().slice(0, 7);
      const paise = payments
        .filter(countsAsPaid)
        .filter((p) => (toDateKey(p.paymentDate) || toDateKey(p.createdAt) || "").startsWith(month))
        .reduce((sum, p) => sum + (rupeesToPaise(p.amount) || 0), 0);
      return { label: d.toLocaleString(locale, { month: "short" }), value: paise, display: formatPaise(paise) };
    });
  }, [payments, language]);

  const nameOf = (id) => borrowerName(borrowers.find((b) => b.id === id)) || s.unknown;
  const dueToday = summary.attention.filter((a) => !a.overdue).length;
  const overdue = summary.attention.filter((a) => a.overdue).length;
  const recent = payments.slice(0, 5);

  if (borrowers.length === 0) {
    return (
      <div className="mx-auto grid max-w-xl grid-cols-1 gap-4">
        <EmptyState
          icon={UserPlus}
          title={s.noBorrowersTitle}
          text={s.noBorrowersText}
          action={<Button icon={UserPlus} to="/borrowers/new">{s.addBorrower}</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-xl grid-cols-1 gap-5">
      <MoneyHero
        label={s.outstanding}
        value={formatPaise(summary.outstanding)}
        caption={summary.unclear ? s.clarifyCaption(summary.unclear) : s.outstandingCaption(summary.active)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Stat label={s.dueToday} value={dueToday} icon={CalendarClock} tone={dueToday ? "amber" : "ink"} />
        <Stat label={s.overdue} value={overdue} icon={AlertTriangle} tone={overdue ? "rose" : "ink"} />
        <Stat label={s.lent} value={formatPaise(summary.lent)} />
        <Stat label={s.principalBack} value={formatPaise(summary.principalBack)} tone="brand" />
        <Stat label={s.interestIn} value={formatPaise(summary.interestIn)} tone="brand" />
        <Stat label={s.collected} value={formatPaise(summary.collected)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ActionTile icon={ReceiptText} label={s.recordPayment} to="/payments/new" />
        <ActionTile icon={UserPlus} label={s.addBorrower} to="/borrowers/new" />
        <ActionTile icon={Calculator} label={s.calculator} to="/calculator" tone="ink" />
        <ActionTile icon={Inbox} label={s.inbox} to="/inbox" tone="amber" />
      </div>

      <Section title={s.attention}>
        {summary.attention.length === 0 ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.attentionEmpty}</p></Card>
        ) : (
          <List>
            {summary.attention.slice(0, 6).map(({ loan, amount, overdue: late }) => (
              <ListRow
                key={loan.id}
                to={`/loans/${loan.id}`}
                avatar={<Avatar name={nameOf(loan.borrowerId)} />}
                title={nameOf(loan.borrowerId)}
                subtitle={late ? s.overdueSince(loan.dueDate) : s.dueOn(loan.dueDate)}
                trailing={
                  <span className={`tabular text-[16px] font-extrabold ${late ? "text-rose-600" : "text-amber-700"}`}>{formatPaise(amount)}</span>
                }
              />
            ))}
          </List>
        )}
      </Section>

      {appMode !== "Basic" && (
        <Section title={s.collections}>
          <Card><ChartBars data={chart} /></Card>
        </Section>
      )}

      <Section title={s.recent}>
        {recent.length === 0 ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.noPayments}</p></Card>
        ) : (
          <List>
            {recent.map((p) => (
              <ListRow
                key={p.id}
                avatar={<Avatar name={nameOf(p.borrowerId)} size={40} />}
                title={nameOf(p.borrowerId)}
                subtitle={`${toDateKey(p.paymentDate) || ""} · ${s.methods[p.method] || p.method || ""}`}
                trailing={
                  <span className="flex flex-col items-end gap-1">
                    <span className="tabular text-[16px] font-extrabold text-brand-700">{formatPaise(rupeesToPaise(p.amount) || 0)}</span>
                    {p.status === "pending_verification" && <Badge tone="amber">{s.pendingApproval}</Badge>}
                  </span>
                }
              />
            ))}
          </List>
        )}
      </Section>
    </div>
  );
}
