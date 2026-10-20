import { useMemo } from "react";
import { AlertTriangle, Bell, BellRing, CalendarClock, CheckCircle2, FileSignature, MessageCircle, ReceiptText, Scale, Send, ShieldCheck, XCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { countsAsPaid, formatPaise, rupeesToPaise } from "../../utils/interestEngine";
import { Card, EmptyState, Screen, Section } from "../../ui";
import { collateralState, dateKeyOf, isAnswered, openLoans, pendingAcknowledgements, requestState, toMillis, useBorrowerLoans } from "./borrowerData";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerNotificationsCopy } from "./BorrowerNotifications.copy";

const UPCOMING_DAYS = 7;
const tones = {
  brand: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  ink: "bg-canvas text-ink-soft"
};

function UpdateCard({ icon: Icon, tone, text, detail, date, to }) {
  return (
    <Card to={to}>
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-bold leading-snug text-ink">{text}</p>
          {detail && <p className="mt-1 text-[15px] font-semibold text-ink-soft">{detail}</p>}
          {date && <p className="mt-1 text-[14px] font-medium text-ink-muted">{date}</p>}
        </div>
      </div>
    </Card>
  );
}

export function BorrowerNotifications() {
  const { payments, messages, reminders, agreements, collateral, user } = useApp();
  const s = useCopy(borrowerNotificationsCopy);
  const sh = useCopy(borrowerSharedCopy);
  const items = useBorrowerLoans();

  // Upcoming and passed due dates, computed from the loans themselves.
  const dueAlerts = useMemo(
    () => openLoans(items)
      .filter((x) => x.due && x.due.days <= UPCOMING_DAYS)
      .sort((a, b) => (a.due.date < b.due.date ? -1 : 1))
      .map(({ loan, due }) => {
        const lender = sh.lender(loan.lenderName);
        return {
          key: `due_${loan.lenderUid}_${loan.id}`,
          icon: due.overdue ? AlertTriangle : CalendarClock,
          tone: due.overdue ? "rose" : "amber",
          text: due.overdue ? s.dueOverdue(lender, sh.date(due.date)) : due.today ? s.dueToday(lender) : s.dueUpcoming(lender, sh.date(due.date)),
          to: `/loans/${loan.id}`
        };
      }),
    [items, s, sh]
  );

  // Loan changes and agreements the borrower has not acknowledged yet.
  const waiting = useMemo(
    () => pendingAcknowledgements(items, agreements, user?.uid)
      .sort((a, b) => toMillis(b.when) - toMillis(a.when))
      .map((p, i) => {
        const lender = sh.lender(p.loan.lenderName);
        const key = dateKeyOf(p.when);
        return p.kind === "change"
          ? { key: `ackc_${p.loan.lenderUid}_${p.loan.id}_${i}`, icon: Scale, tone: "amber", text: s.ackChange(lender), date: key ? sh.date(key) : "", to: `/loans/${p.loan.id}` }
          : { key: `acka_${p.loan.lenderUid}_${p.agreement.id}`, icon: FileSignature, tone: "amber", text: s.ackAgreement(lender), date: key ? sh.date(key) : "", to: "/documents" };
      }),
    [items, agreements, user, s, sh]
  );

  // Reminders the lender wrote (cancelled ones are hidden).
  const lenderReminders = useMemo(
    () => reminders
      .filter((r) => String(r.status || "").toLowerCase() !== "cancelled")
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .map((r, i) => {
        const due = dateKeyOf(r.dueDate);
        const created = dateKeyOf(r.createdAt);
        return {
          key: `rem_${r.lenderUid}_${r.id || i}`,
          icon: BellRing,
          tone: "brand",
          text: (typeof r.message === "string" && r.message.trim()) || s.reminderDefault,
          detail: due ? s.reminderDue(sh.date(due)) : undefined,
          date: created ? sh.date(created) : "",
          to: r.loanId && items.some((x) => x.loan.id === r.loanId) ? `/loans/${r.loanId}` : undefined
        };
      }),
    [reminders, items, s, sh]
  );

  // Everything else, newest first, built only from stored records.
  const events = useMemo(() => {
    const list = [];
    const at = (...values) => {
      const v = values.find(Boolean);
      return { ms: toMillis(v), key: dateKeyOf(v) };
    };
    const push = (key, when, rest) => list.push({ key, ms: when.ms, date: when.key ? sh.date(when.key) : "", ...rest });

    for (const p of payments) {
      const paise = Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount);
      if (!Number.isFinite(paise) || paise <= 0) continue;
      const amount = formatPaise(paise);
      const cancelled = Boolean(p.reversed || p.reversedBy) || p.status === "reversed";
      if (p.type === "borrower_submitted") {
        push(`sent_${p.id}`, at(p.createdAt, p.paymentDate), { icon: Send, tone: "ink", text: s.youSent(amount), to: "/payments" });
        if (p.status === "verified" && !cancelled) {
          push(`ok_${p.id}`, at(p.verifiedAt, p.updatedAt, p.createdAt), { icon: CheckCircle2, tone: "brand", text: s.confirmed(amount), to: "/payments" });
        } else if (p.status === "rejected") {
          push(`no_${p.id}`, at(p.rejectedAt, p.updatedAt, p.createdAt), { icon: XCircle, tone: "rose", text: s.rejected(amount), to: "/payments" });
        }
      } else if (countsAsPaid(p)) {
        push(`rec_${p.id}`, at(p.createdAt, p.paymentDate), { icon: ReceiptText, tone: "brand", text: s.lenderRecorded(amount), to: "/payments" });
      }
      if (cancelled) {
        push(`rev_${p.id}`, at(p.reversedAt, p.updatedAt, p.createdAt), { icon: XCircle, tone: "ink", text: s.cancelled(amount), to: "/payments" });
      }
    }

    for (const m of messages) {
      if (m.type === "extension_request") {
        const state = requestState(m);
        if (state === "pending") continue;
        const text = state === "approved" ? s.extApproved : state === "rejected" ? s.extRejected : s.extOther;
        push(`ext_${m.id}`, at(m.respondedAt, m.decidedAt, m.updatedAt, m.createdAt), {
          icon: state === "approved" ? CheckCircle2 : state === "rejected" ? XCircle : CalendarClock,
          tone: state === "approved" ? "brand" : state === "rejected" ? "rose" : "ink",
          text,
          to: "/extensions/new"
        });
      } else if ((m.type === "clarification" || m.type === "dispute") && isAnswered(m)) {
        push(`ans_${m.id}`, at(m.respondedAt, m.updatedAt, m.createdAt), { icon: MessageCircle, tone: "brand", text: s.answered, to: "/help" });
      }
    }

    for (const c of collateral) {
      if (collateralState(c) !== "returned") continue;
      push(`col_${c.lenderUid}_${c.id}`, at(c.returnedAt, c.returnedDate, c.updatedAt), {
        icon: ShieldCheck,
        tone: "brand",
        text: s.collateralReturned(c.description || ""),
        to: c.loanId && items.some((x) => x.loan.id === c.loanId) ? `/loans/${c.loanId}` : "/documents"
      });
    }

    return list.sort((a, b) => b.ms - a.ms);
  }, [payments, messages, collateral, items, s, sh]);

  return (
    <Screen title={s.title} subtitle={s.subtitle}>
      {dueAlerts.length > 0 && (
        <Section title={s.dueSoon}>
          <div className="grid gap-3">
            {dueAlerts.map(({ key, ...rest }) => <UpdateCard key={key} {...rest} />)}
          </div>
        </Section>
      )}

      {waiting.length > 0 && (
        <Section title={s.waiting}>
          <div className="grid gap-3">
            {waiting.map(({ key, ...rest }) => <UpdateCard key={key} {...rest} />)}
          </div>
        </Section>
      )}

      {lenderReminders.length > 0 && (
        <Section title={s.reminders}>
          <div className="grid gap-3">
            {lenderReminders.map(({ key, ...rest }) => <UpdateCard key={key} {...rest} />)}
          </div>
        </Section>
      )}

      <Section title={s.recent}>
        {events.length === 0 ? (
          <EmptyState icon={Bell} title={s.empty} />
        ) : (
          <div className="grid gap-3">
            {events.map(({ key, ms, ...rest }) => <UpdateCard key={key} {...rest} />)}
          </div>
        )}
      </Section>

      <p className="px-1 text-[13px] font-medium text-ink-muted">{s.inAppOnly}</p>
    </Screen>
  );
}
