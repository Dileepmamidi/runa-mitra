import { useEffect, useMemo, useState } from "react";
import { CalendarClock, FolderOpen, Landmark, MessageCircle, RefreshCw, Wallet } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { countsAsPaid, formatPaise, rupeesToPaise } from "../../utils/interestEngine";
import { ActionTile, Badge, Button, Card, EmptyState, IconButton, MoneyHero, Screen, Section, Stat } from "../../ui";
import { dateKeyOf, dueText, openLoans, spokenAmountParts, useBorrowerLoans, loanLabel } from "./borrowerData";
import { VoiceSummary } from "../../components/VoiceSummary";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerHomeCopy } from "./BorrowerHome.copy";

export function BorrowerHome() {
  const { borrowers, payments, refreshData, language } = useApp();
  const s = useCopy(borrowerHomeCopy);
  const sh = useCopy(borrowerSharedCopy);
  const items = useBorrowerLoans();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try { await refreshData(); } finally { setRefreshing(false); }
  };

  // Fetch fresh records when the home screen opens.
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const ok = items.filter((x) => x.calc.status === "ok");
    const sum = (key) => ok.reduce((total, x) => total + (x.calc[key] || 0), 0);
    const unclear = items.length - ok.length;
    const dues = openLoans(items).map((x) => x.due).filter(Boolean).sort((a, b) => (a.date < b.date ? -1 : 1));
    const latest = payments
      .filter(countsAsPaid)
      .map((p) => ({ date: dateKeyOf(p.paymentDate) || dateKeyOf(p.createdAt), paise: Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount) }))
      .filter((p) => p.date && Number.isFinite(p.paise) && p.paise > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return {
      okCount: ok.length,
      unclear,
      outstanding: sum("outstandingPaise"),
      principal: sum("principalPaise"),
      interest: sum("interestAccruedPaise"),
      paid: sum("totalPaidPaise"),
      allSettled: ok.length > 0 && unclear === 0 && ok.every((x) => x.calc.settled),
      nextDue: dues[0] || null,
      latest
    };
  }, [items, payments]);

  const name = borrowers[0]?.name || "";
  const refreshButton = <IconButton icon={RefreshCw} label={s.refresh} onClick={refresh} className={refreshing ? "animate-spin" : ""} />;

  if (items.length === 0) {
    return (
      <Screen title={s.greeting(name)} subtitle={s.subtitle} actions={refreshButton}>
        <EmptyState
          icon={Landmark}
          title={s.emptyTitle}
          text={s.emptyText}
          action={<Button icon={RefreshCw} loading={refreshing} onClick={refresh} size="lg">{s.emptyAction}</Button>}
        />
        <Button variant="secondary" size="lg" block icon={MessageCircle} to="/help">{s.ask}</Button>
      </Screen>
    );
  }

  const caption = summary.okCount === 0
    ? s.captionAllUnclear
    : summary.unclear > 0
      ? s.captionUnclear(summary.unclear)
      : summary.allSettled ? s.captionSettled : s.captionOk;

  // Summary for reading aloud, built from the same engine numbers shown above.
  const money = (paise) => s.money(spokenAmountParts(paise));
  const voiceText = [
    summary.okCount === 0 ? s.voiceUnclear : summary.allSettled ? s.voiceSettled : s.voiceOwed(money(summary.outstanding)),
    summary.okCount > 0 && summary.unclear > 0 ? s.voiceUnclearSome(summary.unclear) : "",
    summary.allSettled ? "" : summary.nextDue ? s.voiceNextDue(sh.date(summary.nextDue.date), dueText(sh, summary.nextDue)) : s.voiceNoDue,
    summary.latest ? s.voiceLast(money(summary.latest.paise), sh.date(summary.latest.date)) : s.voiceNoLast
  ].filter(Boolean).join(" ");

  const single = items.length === 1 ? items[0].loan : null;
  const scrollToLoans = () => document.getElementById("my-loans")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <Screen title={s.greeting(name)} subtitle={s.subtitle} actions={refreshButton}>
      <MoneyHero
        label={s.totalLabel}
        value={summary.okCount === 0 ? s.totalUnknown : formatPaise(summary.outstanding)}
        caption={caption}
        tone={summary.okCount === 0 ? "ink" : "brand"}
      />

      <VoiceSummary text={voiceText} lang={language === "en" ? "en" : "te"} />

      {summary.okCount > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label={s.principal} value={formatPaise(summary.principal)} />
          <Stat label={s.interest} value={formatPaise(summary.interest)} tone="amber" />
          <Stat label={s.paid} value={formatPaise(summary.paid)} tone="brand" />
          <Stat
            label={s.nextDue}
            value={summary.nextDue ? sh.date(summary.nextDue.date) : s.none}
            hint={summary.nextDue ? dueText(sh, summary.nextDue) : undefined}
            tone={summary.nextDue?.overdue ? "rose" : "ink"}
          />
        </div>
      )}
      <Stat
        label={s.latest}
        value={summary.latest ? formatPaise(summary.latest.paise) : s.none}
        hint={summary.latest ? sh.date(summary.latest.date) : undefined}
      />

      <div className="grid grid-cols-2 gap-3">
        {single
          ? <ActionTile icon={Landmark} label={s.viewLoan} to={`/loans/${single.id}`} />
          : <ActionTile icon={Landmark} label={s.viewLoan} onClick={scrollToLoans} />}
        <ActionTile icon={Wallet} label={s.payments} to="/payments" />
        <ActionTile icon={FolderOpen} label={s.documents} to="/documents" tone="ink" />
        <ActionTile icon={CalendarClock} label={s.moreTime} to="/extensions/new" tone="amber" />
      </div>

      <div>
        <Button variant="secondary" size="lg" block icon={MessageCircle} to="/help">{s.ask}</Button>
        <p className="mt-2 px-1 text-[13px] font-medium text-ink-muted">{s.askHint}</p>
      </div>

      <Section title={s.loans}>
        <div id="my-loans" className="grid scroll-mt-24 gap-3">
          {items.map(({ loan, calc, due }) => (
            <Card key={`${loan.lenderUid}_${loan.id}`} to={`/loans/${loan.id}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-[17px] font-bold text-ink">{sh.loanFrom(loan.lenderName)}</p>
                <p className="text-sm font-semibold text-ink-muted">{loanLabel(loan, sh)}</p>
                {calc.status !== "ok"
                  ? <Badge tone="amber">{sh.needsClarification}</Badge>
                  : calc.settled ? <Badge tone="brand">{sh.settled}</Badge> : null}
              </div>
              {calc.status === "ok" && !calc.settled && (
                <>
                  <p className="mt-2 text-[13px] font-semibold text-ink-muted">{s.owes}</p>
                  <p className="tabular text-[30px] font-extrabold leading-tight text-ink">{formatPaise(calc.outstandingPaise)}</p>
                </>
              )}
              {due && (
                <p className={`mt-2 text-[15px] font-bold ${due.overdue ? "text-rose-600" : due.days <= 7 ? "text-amber-700" : "text-ink-soft"}`}>
                  {dueText(sh, due)} · {sh.date(due.date)}
                </p>
              )}
              <p className="mt-3 text-[15px] font-bold text-brand-700">{s.openLoan} →</p>
            </Card>
          ))}
        </div>
      </Section>
    </Screen>
  );
}
