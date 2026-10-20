import { useMemo, useState } from "react";
import { BellRing, Gem, MessageCircle, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { addUserRecord, updateUserRecord } from "../services/firebaseService";
import { calculateLoan, formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import {
  Avatar, Badge, Button, Card, EmptyState, Field, Input, List, ListRow, Notice, Screen, Section, Segmented, Select, TextArea
} from "../ui";
import { communicationCopy, reminderTemplatesCopy } from "./Communication.copy";

const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";
const TEMPLATE_IDS = ["gentle", "due", "after"];

// wa.me needs the number with country code and no symbols.
function whatsAppNumber(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits.length >= 10 ? digits : "";
}

/** Outstanding today for the given loans, only when every loan's terms are clear. */
function outstandingText(loans, payments, today) {
  let total = 0;
  for (const loan of loans) {
    const calc = calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), today);
    if (calc.status !== "ok") return null;
    total += calc.outstandingPaise;
  }
  return total > 0 ? formatPaise(total) : null;
}

function InAppReminders({ s, today }) {
  const { user, lender, borrowers, loans, payments, reminders, refreshData, language } = useApp();
  const [borrowerId, setBorrowerId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [dueDate, setDueDate] = useState(today);
  const [templateId, setTemplateId] = useState("gentle");
  const [msgLang, setMsgLang] = useState(language === "en" ? "en" : "te");
  const [message, setMessage] = useState("");
  const [edited, setEdited] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const borrower = borrowers.find((b) => b.id === borrowerId);
  const borrowerLoans = loans.filter((l) => l.borrowerId === borrowerId);
  const selectedLoan = borrowerLoans.find((l) => l.id === loanId);

  const draft = useMemo(() => {
    if (!borrower) return "";
    const amount = outstandingText(selectedLoan ? [selectedLoan] : borrowerLoans, payments, today);
    const make = reminderTemplatesCopy[msgLang][templateId];
    return make(borrowerName(borrower), lender?.name, amount, dueDate);
  }, [borrower, selectedLoan, borrowerLoans, payments, today, msgLang, templateId, lender, dueDate]);

  const text = edited ? message : draft;

  const pickBorrower = (id) => {
    setBorrowerId(id);
    setLoanId("");
    setEdited(false);
    const firstDue = loans.find((l) => l.borrowerId === id && l.dueDate)?.dueDate;
    setDueDate(firstDue || today);
  };
  const pickLoan = (id) => {
    setLoanId(id);
    setEdited(false);
    const loan = loans.find((l) => l.id === id);
    if (loan?.dueDate) setDueDate(loan.dueDate);
  };

  const save = async () => {
    setError("");
    setNotice("");
    if (!borrower) return setError(s.errBorrower);
    if (!borrower.linkedUid) return setError(s.errLinked);
    if (!text.trim()) return setError(s.errMessage);
    setBusy("save");
    try {
      await addUserRecord(user.uid, "reminders", {
        borrowerId,
        loanId: loanId || "",
        dueDate: dueDate || "",
        message: text.trim(),
        language: msgLang,
        template: edited ? "custom" : templateId,
        channel: "in_app",
        status: "scheduled",
        // Shared with the linked borrower (same stamp syncBorrowerSharing uses).
        borrowerUid: borrower.linkedUid
      });
      setNotice(s.saved);
      setEdited(false);
      setMessage("");
      await refreshData();
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setBusy("");
    }
  };

  const cancel = async (reminder) => {
    setError("");
    setNotice("");
    setBusy(reminder.id);
    try {
      await updateUserRecord(user.uid, "reminders", reminder.id, { status: "cancelled", cancelledAt: new Date() });
      setNotice(s.cancelled);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setBusy("");
    }
  };

  const list = [...reminders]
    .filter((r) => r.channel === "in_app" || !r.channel)
    .sort((a, b) => ((a.dueDate || "") < (b.dueDate || "") ? 1 : -1));
  const nameOf = (id) => borrowerName(borrowers.find((b) => b.id === id)) || s.unknown;

  return (
    <>
      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <Section title={s.newTitle}>
        <Card className="grid gap-4">
          <Field label={s.borrower}>
            <Select value={borrowerId} onChange={(e) => pickBorrower(e.target.value)}>
              <option value="">{s.chooseBorrower}</option>
              {borrowers.map((b) => <option key={b.id} value={b.id}>{borrowerName(b)}</option>)}
            </Select>
          </Field>
          {borrower && !borrower.linkedUid && <Notice tone="warning">{s.notLinked}</Notice>}
          {borrower && borrower.linkedUid && (
            <>
              {borrowerLoans.length > 0 && (
                <Field label={s.loan}>
                  <Select value={loanId} onChange={(e) => pickLoan(e.target.value)}>
                    <option value="">{s.anyLoan}</option>
                    {borrowerLoans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {s.loanOption(formatPaise((l.terms?.principalPaise ?? rupeesToPaise(l.principal)) || 0), toDateKey(l.terms?.startDate) || toDateKey(l.loanDate) || "")}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label={s.dueDate}>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
              <Field label={s.template}>
                <Select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setEdited(false); }}>
                  {TEMPLATE_IDS.map((id) => <option key={id} value={id}>{s.templateLabels[id]}</option>)}
                </Select>
              </Field>
              <div>
                <p className="mb-1.5 text-[15px] font-bold text-ink">{s.messageLanguage}</p>
                <Segmented
                  value={msgLang}
                  onChange={(v) => { setMsgLang(v); setEdited(false); }}
                  options={[{ value: "te", label: "తెలుగు" }, { value: "en", label: "English" }]}
                />
              </div>
              <Field label={s.message}>
                <TextArea value={text} onChange={(e) => { setMessage(e.target.value); setEdited(true); }} />
              </Field>
              <Button size="lg" block icon={BellRing} loading={busy === "save"} disabled={Boolean(busy)} onClick={save}>{s.save}</Button>
            </>
          )}
        </Card>
      </Section>

      <Section title={s.listTitle}>
        {list.length === 0 ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.none}</p></Card>
        ) : (
          <div className="grid gap-3">
            {list.map((r) => (
              <Card key={r.id} className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-bold text-ink">{nameOf(r.borrowerId)}</p>
                    {r.dueDate && <p className="text-[13px] font-medium text-ink-muted">{s.forDate(r.dueDate)}</p>}
                  </div>
                  {r.status === "cancelled"
                    ? <Badge tone="ink">{s.statusCancelled}</Badge>
                    : <Badge tone="brand">{s.statusScheduled}</Badge>}
                </div>
                <p className="whitespace-pre-line text-[15px] font-medium text-ink-soft">{r.message}</p>
                {r.status !== "cancelled" && (
                  <div>
                    <Button variant="ghost" size="sm" icon={X} loading={busy === r.id} disabled={Boolean(busy)} onClick={() => cancel(r)}>{s.cancel}</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

// WhatsApp opens with a respectful reminder typed in; the lender still has to
// press send inside WhatsApp. In-app reminders are saved records the linked
// borrower can read in their app.
export function Communication() {
  const { borrowers, loans, payments, lender, hasFeature } = useApp();
  const s = useCopy(communicationCopy);
  const today = toDateKey(new Date());

  const rows = useMemo(
    () =>
      borrowers.map((b) => {
        const amount = outstandingText(loans.filter((l) => l.borrowerId === b.id), payments, today);
        return { b, name: borrowerName(b), amount, phone: whatsAppNumber(b.mobile) };
      }),
    [borrowers, loans, payments, today]
  );

  const link = (row) => `https://wa.me/${row.phone}?text=${encodeURIComponent(s.reminder(row.name, lender?.name, row.amount))}`;

  return (
    <Screen title={s.title} back="/more">
      <Section title={s.whatsAppTitle}>
        <div className="grid gap-3">
          <Notice tone="info">{s.intro}</Notice>
          {rows.length === 0 ? (
            <EmptyState icon={MessageCircle} title={s.noBorrowers} />
          ) : (
            <List>
              {rows.map((row) => (
                <ListRow
                  key={row.b.id}
                  avatar={<Avatar name={row.name} />}
                  title={row.name}
                  subtitle={row.phone ? (row.amount ? s.outstanding(row.amount) : row.b.mobile) : s.noMobile}
                  trailing={
                    row.phone ? (
                      <a
                        href={link(row)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-50 px-3 text-sm font-bold text-brand-700 active:bg-brand-100"
                      >
                        <MessageCircle size={18} /> {s.openWhatsApp}
                      </a>
                    ) : null
                  }
                />
              ))}
            </List>
          )}
        </div>
      </Section>

      <Section title={s.previewTitle}>
        <Card>
          <p className="text-[15px] font-medium text-ink-soft">{s.reminder(rows[0]?.name || "…", lender?.name, rows[0]?.amount)}</p>
        </Card>
      </Section>

      <Section title={s.appTitle}>
        <Notice tone="info">{s.appIntro}</Notice>
      </Section>

      {hasFeature("reminders") ? (
        <InAppReminders s={s} today={today} />
      ) : (
        <Card className="grid gap-3 border-amber-200 bg-amber-50">
          <p className="text-[17px] font-extrabold text-ink">{s.upgradeTitle}</p>
          <p className="text-[15px] font-medium text-ink-soft">{s.upgradeText}</p>
          <Button to="/plans" icon={Gem}>{s.seePlans}</Button>
        </Card>
      )}

      <Notice tone="warning" title={s.notAvailableTitle}>{s.notAvailable}</Notice>
    </Screen>
  );
}
