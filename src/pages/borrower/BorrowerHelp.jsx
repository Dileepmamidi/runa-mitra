import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CircleHelp, FileWarning, HelpCircle, Percent, Scale, SearchX, Send, Smartphone } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { addUserRecord } from "../../services/firebaseService";
import { formatPaise } from "../../utils/interestEngine";
import { Badge, Button, Card, EmptyState, Field, Notice, Screen, Section, Select, TextArea } from "../../ui";
import { dateKeyOf, isAnswered, loanStartKey, principalPaiseOf, toMillis, useBorrowerLoans } from "./borrowerData";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerHelpCopy } from "./BorrowerHelp.copy";

// Topic -> message type allowed by the Firestore rules.
const TOPICS = [
  { value: "amount", icon: CircleHelp, type: "clarification" },
  { value: "missing_payment", icon: SearchX, type: "dispute" },
  { value: "interest", icon: Percent, type: "dispute" },
  { value: "document", icon: FileWarning, type: "clarification" },
  { value: "loan_change", icon: Scale, type: "dispute" },
  { value: "app", icon: Smartphone, type: "clarification" }
];

export function BorrowerHelp() {
  const [searchParams] = useSearchParams();
  const { user, messages, refreshData } = useApp();
  const s = useCopy(borrowerHelpCopy);
  const sh = useCopy(borrowerSharedCopy);
  const items = useBorrowerLoans();

  const paramLoan = searchParams.get("loan") || "";
  const paramTopic = searchParams.get("topic") || "";
  // The user's choice wins; otherwise preselect from ?loan= or the only loan
  // (computed each render so it still works when data arrives after mount).
  const [chosenLoanId, setLoanId] = useState("");
  const loanId = chosenLoanId || (items.some((x) => x.loan.id === paramLoan) ? paramLoan : items.length === 1 ? items[0].loan.id : "");
  const [topic, setTopic] = useState(TOPICS.some((t) => t.value === paramTopic) ? paramTopic : "");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedLoan = items.find((x) => x.loan.id === loanId)?.loan;

  const past = useMemo(
    () => messages
      .filter((m) => m.type === "clarification" || m.type === "dispute")
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
    [messages]
  );
  const loanName = (m) => items.find((x) => x.loan.id === m.loanId && x.loan.lenderUid === m.lenderUid)?.loan.lenderName || m.lenderName;

  const handleSend = async () => {
    setError("");
    setSuccess("");
    const chosen = TOPICS.find((t) => t.value === topic);
    if (!chosen) return setError(s.errTopic);
    if (!selectedLoan) return setError(s.errLoan);
    try {
      setLoading(true);
      await addUserRecord(selectedLoan.lenderUid, "messages", {
        type: chosen.type,
        topic: chosen.value,
        text: text.trim(),
        loanId: selectedLoan.id,
        borrowerId: selectedLoan._borrowerId,
        borrowerUid: user.uid,
        status: "pending",
        createdAt: new Date()
      });
      setSuccess(s.success);
      setText("");
      setTopic("");
      await refreshData();
    } catch (err) {
      console.error(err);
      setError(sh.sendError);
    } finally {
      setLoading(false);
    }
  };

  const pastList = (
    <Section title={s.past}>
      {past.length === 0 ? (
        <Card><p className="text-[15px] font-medium text-ink-muted">{s.noPast}</p></Card>
      ) : (
        <div className="grid gap-3">
          {past.map((m) => {
            const answered = isAnswered(m);
            const sent = dateKeyOf(m.createdAt);
            return (
              <Card key={m.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-[16px] font-bold text-ink">{s.topics[m.topic] || s.otherTopic}</p>
                  <Badge tone={answered ? "brand" : "amber"}>{answered ? s.answered : s.waiting}</Badge>
                </div>
                <p className="mt-0.5 text-[14px] font-medium text-ink-muted">
                  {sh.loanFrom(loanName(m))}{sent ? ` · ${s.sentOn(sh.date(sent))}` : ""}
                </p>
                {(m.text || m.reason) && (
                  <p className="mt-2 text-[15px] font-medium text-ink-soft"><span className="font-bold">{s.youWrote}:</span> {m.text || m.reason}</p>
                )}
                {m.response && (
                  <p className="mt-2 rounded-xl bg-canvas p-3 text-[15px] font-medium text-ink"><span className="font-bold">{s.lenderReply}:</span> {m.response}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Section>
  );

  if (items.length === 0) {
    return (
      <Screen title={s.title} back>
        <EmptyState icon={HelpCircle} title={s.noLoansTitle} text={s.noLoansText} />
        {pastList}
      </Screen>
    );
  }

  return (
    <Screen title={s.title} subtitle={s.subtitle} back>
      <Notice tone="info">{s.neutral}</Notice>

      <Card>
        <div className="grid gap-5">
          <div>
            <p className="mb-1.5 text-[15px] font-bold text-ink">{s.topic}</p>
            <div className="grid gap-2">
              {TOPICS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTopic(value)}
                  aria-pressed={topic === value}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-2 text-left text-[16px] font-bold transition ${
                    topic === value ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-200" : "border-line bg-surface text-ink"
                  }`}
                >
                  <Icon size={22} className="shrink-0" />
                  {s.topics[value]}
                </button>
              ))}
            </div>
          </div>

          {items.length > 1 || !selectedLoan ? (
            <Field label={sh.chooseLoan}>
              <Select value={loanId} onChange={(e) => setLoanId(e.target.value)}>
                <option value="">{sh.chooseLoanPlaceholder}</option>
                {items.map(({ loan }) => (
                  <option key={`${loan.lenderUid}_${loan.id}`} value={loan.id}>
                    {sh.loanOption(loan.lenderName, principalPaiseOf(loan) ? formatPaise(principalPaiseOf(loan)) : "", loanStartKey(loan) ? sh.date(loanStartKey(loan)) : "")}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <p className="text-[17px] font-bold text-ink">{sh.loanFrom(selectedLoan.lenderName)}</p>
          )}

          <Field label={`${s.text} (${sh.optional})`}>
            <TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder={s.textPlaceholder} rows={4} />
          </Field>
        </div>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      <Button size="lg" block icon={Send} loading={loading} onClick={handleSend}>
        {loading ? s.sending : s.send}
      </Button>

      {pastList}
    </Screen>
  );
}
