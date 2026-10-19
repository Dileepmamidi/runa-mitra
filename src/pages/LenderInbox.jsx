import { useEffect, useState } from "react";
import { CalendarClock, Check, ExternalLink, Inbox, MessageCircleQuestion, RefreshCw, Send, Volume2, X } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { approveBorrowerPayment, decideExtensionRequest, requestedDueDate, updateUserRecord } from "../services/firebaseService";
import { formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { Avatar, Badge, Button, Card, EmptyState, Field, Notice, Screen, Section, TextArea } from "../ui";
import { lenderInboxCopy } from "./LenderInbox.copy";

const QUESTION_TYPES = ["clarification", "dispute"];

export function LenderInbox() {
  const { t, user, borrowers, loans, payments, messages, refreshData } = useApp();
  const s = useCopy(lenderInboxCopy);
  const labels = useCopy(loanLabelsCopy);
  const [processing, setProcessing] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hidden, setHidden] = useState(() => new Set());
  const [confirm, setConfirm] = useState(null); // { id, action: "approve" | "reject" }
  const [errors, setErrors] = useState({});
  const [replies, setReplies] = useState({});

  // Fetch the latest when the inbox opens.
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const setItemError = (id, text) => setErrors((prev) => ({ ...prev, [id]: text }));
  const hide = (id) => setHidden((prev) => new Set(prev).add(id));
  const nameOf = (bid) => borrowerName(borrowers.find((b) => b.id === bid)) || s.unknown;
  const dateOf = (v) => toDateKey(v) || s.noDate;
  const loanLabel = (loanId) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return "";
    return s.loanRef(formatPaise(rupeesToPaise(loan.principal) || 0), toDateKey(loan.terms?.startDate) || loan.loanDate || "—");
  };

  const pendingPayments = payments.filter((p) => p.status === "pending_verification" && !hidden.has(p.id));
  const extensions = messages.filter((m) => m.type === "extension_request");
  const questions = messages
    .filter((m) => QUESTION_TYPES.includes(m.type) && !hidden.has(m.id))
    .sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  const others = messages.filter((m) => m.type !== "extension_request" && !QUESTION_TYPES.includes(m.type));

  const approve = async (payment) => {
    if (!user) return;
    setItemError(payment.id, "");
    try {
      setProcessing(payment.id);
      // Marks the payment verified and updates the loan in one transaction;
      // fails safely if this payment was already handled.
      await approveBorrowerPayment(user.uid, payment.id);
      hide(payment.id);
      setConfirm(null);
      await refreshData();
    } catch (err) {
      console.error(err);
      setItemError(payment.id, s.approveError);
      setConfirm(null);
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (payment) => {
    if (!user) return;
    setItemError(payment.id, "");
    try {
      setProcessing(payment.id);
      await updateUserRecord(user.uid, "payments", payment.id, { status: "rejected", rejectedAt: new Date() });
      hide(payment.id);
      setConfirm(null);
      await refreshData();
    } catch (err) {
      console.error(err);
      setItemError(payment.id, s.rejectError);
      setConfirm(null);
    } finally {
      setProcessing(null);
    }
  };

  const sendReply = async (msg) => {
    if (!user) return;
    const response = (replies[msg.id] || "").trim();
    if (!response) return setItemError(msg.id, s.errReply);
    setItemError(msg.id, "");
    try {
      setProcessing(msg.id);
      await updateUserRecord(user.uid, "messages", msg.id, { status: "answered", response, respondedAt: new Date() });
      await refreshData();
      setReplies((prev) => ({ ...prev, [msg.id]: "" }));
    } catch (err) {
      console.error(err);
      setItemError(msg.id, s.replyError);
    } finally {
      setProcessing(null);
    }
  };

  const decideExtension = async (msg, approve) => {
    if (!user) return;
    setItemError(msg.id, "");
    try {
      setProcessing(msg.id);
      await decideExtensionRequest(user.uid, msg.id, { approve, response: (replies[msg.id] || "").trim() });
      setConfirm(null);
      setReplies((prev) => ({ ...prev, [msg.id]: "" }));
      await refreshData();
    } catch (err) {
      console.error(err);
      setItemError(msg.id, s.extError);
      setConfirm(null);
    } finally {
      setProcessing(null);
    }
  };

  const nothing = pendingPayments.length === 0 && extensions.length === 0 && questions.length === 0 && others.length === 0;

  return (
    <Screen
      title={s.title}
      subtitle={s.subtitle}
      actions={
        <Button size="sm" variant="secondary" icon={RefreshCw} onClick={handleRefresh} loading={refreshing}>
          {refreshing ? s.refreshing : s.refresh}
        </Button>
      }
    >
      {nothing && <EmptyState icon={Inbox} title={s.allClear} text={s.allClearText} />}

      {pendingPayments.length > 0 && (
        <Section title={`${s.paymentsTitle} (${pendingPayments.length})`}>
          <p className="mb-2 px-1 text-[14px] font-medium text-ink-soft">{s.paymentsHelp}</p>
          <div className="grid gap-3">
            {pendingPayments.map((payment) => {
              const busy = processing === payment.id;
              const amount = formatPaise(Number.isInteger(payment.amountPaise) ? payment.amountPaise : rupeesToPaise(payment.amount) || 0);
              const asking = confirm?.id === payment.id ? confirm.action : null;
              return (
                <Card key={payment.id} className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={nameOf(payment.borrowerId)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-bold text-ink">{nameOf(payment.borrowerId)}</p>
                      <p className="text-sm font-medium text-ink-muted">{s.reported(dateOf(payment.paymentDate || payment.createdAt))}</p>
                      <p className="text-sm font-medium text-ink-muted">{[labels.methods[payment.method] || payment.method, loanLabel(payment.loanId)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className="tabular text-[20px] font-extrabold text-ink">{amount}</span>
                  </div>
                  {payment.paymentType === "interest_only" && <div><Badge>{labels.interestOnly}</Badge></div>}
                  {(payment.referenceId || payment.screenshotUrl) && (
                    <div className="rounded-xl bg-canvas p-3 text-[15px]">
                      {payment.referenceId && <p className="font-semibold text-ink">{s.reference(payment.referenceId)}</p>}
                      {payment.screenshotUrl && (
                        <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-10 items-center gap-1.5 font-bold text-brand-700">
                          <ExternalLink size={16} /> {s.screenshot}
                        </a>
                      )}
                    </div>
                  )}
                  {errors[payment.id] && <Notice tone="error">{errors[payment.id]}</Notice>}
                  {asking ? (
                    <Notice tone={asking === "approve" ? "info" : "warning"}>
                      <p>{asking === "approve" ? s.confirmApprove(amount) : s.confirmReject}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="secondary" onClick={() => setConfirm(null)} disabled={busy}>{s.no}</Button>
                        {asking === "approve" ? (
                          <Button icon={Check} onClick={() => approve(payment)} loading={busy}>{s.yesApprove}</Button>
                        ) : (
                          <Button variant="danger" icon={X} onClick={() => reject(payment)} loading={busy}>{s.yesReject}</Button>
                        )}
                      </div>
                    </Notice>
                  ) : (
                    <div className="grid grid-cols-[2fr_1fr] gap-2">
                      <Button icon={Check} onClick={() => setConfirm({ id: payment.id, action: "approve" })} disabled={Boolean(processing)}>{s.approve}</Button>
                      <Button variant="secondary" className="text-rose-600" onClick={() => setConfirm({ id: payment.id, action: "reject" })} disabled={Boolean(processing)}>{s.reject}</Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {questions.length > 0 && (
        <Section title={s.questionsTitle}>
          <p className="mb-2 px-1 text-[14px] font-medium text-ink-soft">{s.questionsHelp}</p>
          <div className="grid gap-3">
            {questions.map((msg) => {
              const busy = processing === msg.id;
              const answered = msg.status === "answered";
              return (
                <Card key={msg.id} className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink-soft">
                      <MessageCircleQuestion size={21} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-bold text-ink">{nameOf(msg.borrowerId)}</p>
                      <p className="text-sm font-medium text-ink-muted">{dateOf(msg.createdAt)}{msg.loanId && loanLabel(msg.loanId) ? ` · ${loanLabel(msg.loanId)}` : ""}</p>
                    </div>
                    <Badge tone={answered ? "brand" : "amber"}>{msg.type === "dispute" ? s.dispute : s.clarification}</Badge>
                  </div>
                  {msg.topic && <p className="text-[15px] font-bold text-ink">{s.topic(msg.topic)}</p>}
                  {msg.text && <p className="whitespace-pre-wrap rounded-xl bg-canvas p-3 text-[15px] font-medium text-ink">{msg.text}</p>}
                  {answered ? (
                    <p className="whitespace-pre-wrap rounded-xl bg-brand-50 p-3 text-[15px] font-medium text-ink">{s.youReplied(msg.response || "")}</p>
                  ) : (
                    <>
                      <Field label={s.yourReply}>
                        <TextArea
                          value={replies[msg.id] || ""}
                          onChange={(e) => setReplies((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                          placeholder={s.replyPlaceholder}
                        />
                      </Field>
                      {errors[msg.id] && <Notice tone="error">{errors[msg.id]}</Notice>}
                      <Button icon={Send} onClick={() => sendReply(msg)} loading={busy} disabled={Boolean(processing) && !busy}>
                        {busy ? s.sending : s.sendReply}
                      </Button>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {extensions.length > 0 && (
        <Section title={s.extensionsTitle}>
          <div className="grid gap-3">
            {extensions.map((msg) => (
              <Card key={msg.id} className="grid gap-2">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <CalendarClock size={21} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold text-ink">{nameOf(msg.borrowerId)}</p>
                    <p className="text-sm font-medium text-ink-muted">{dateOf(msg.requestedAt || msg.createdAt)}{msg.loanId && loanLabel(msg.loanId) ? ` · ${loanLabel(msg.loanId)}` : ""}</p>
                  </div>
                  <Badge tone={msg.status === "pending" ? "amber" : msg.status === "rejected" ? "rose" : "brand"}>
                    {msg.status === "pending" ? s.statusPending : msg.status === "rejected" ? s.extRejected : s.statusAnswered}
                  </Badge>
                </div>
                {msg.requestedDays ? <p className="text-[15px] font-bold text-ink">{s.extensionDays(msg.requestedDays)}</p> : null}
                {msg.requestedDate && <p className="text-[15px] font-bold text-ink">{s.extensionDate(msg.requestedDate)}</p>}
                {msg.reason && <p className="whitespace-pre-wrap rounded-xl bg-canvas p-3 text-[15px] font-medium text-ink">{msg.reason}</p>}
                {msg.voiceUrl && (
                  <a href={msg.voiceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-700">
                    <Volume2 size={18} /> {s.voice}
                  </a>
                )}
                {msg.status === "approved" && msg.approvedDueDate && <Notice tone="success">{s.extApproved(msg.approvedDueDate)}</Notice>}
                {msg.response && msg.status !== "pending" && <p className="whitespace-pre-wrap text-[15px] font-medium text-ink-soft">{msg.response}</p>}
                {msg.status === "pending" && (() => {
                  const loan = loans.find((l) => l.id === msg.loanId);
                  const newDate = requestedDueDate(msg, loan);
                  const asking = confirm?.id === msg.id ? confirm.action : null;
                  return (
                    <div className="grid gap-3 border-t border-line pt-3">
                      {loan?.dueDate && <p className="text-sm font-semibold text-ink-soft">{s.extCurrentDue(loan.dueDate)}</p>}
                      <p className="text-[15px] font-bold text-ink">{s.extNewDue(newDate)}</p>
                      <Notice tone="info">{s.extInterestNote}</Notice>
                      <Field label={s.extReplyLabel}>
                        <TextArea value={replies[msg.id] || ""} onChange={(e) => setReplies((prev) => ({ ...prev, [msg.id]: e.target.value }))} />
                      </Field>
                      {errors[msg.id] && <Notice tone="error">{errors[msg.id]}</Notice>}
                      {asking ? (
                        <div className="grid gap-2">
                          <p className="text-[15px] font-bold text-ink">{asking === "approve" ? s.extConfirmApprove(newDate) : s.extConfirmReject}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="secondary" onClick={() => setConfirm(null)}>{t.cancel}</Button>
                            <Button variant={asking === "approve" ? "primary" : "danger"} loading={processing === msg.id} onClick={() => decideExtension(msg, asking === "approve")}>{s.extYes}</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="secondary" icon={X} onClick={() => setConfirm({ id: msg.id, action: "reject" })}>{s.extReject}</Button>
                          <Button icon={Check} onClick={() => setConfirm({ id: msg.id, action: "approve" })}>{s.extApprove}</Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {others.length > 0 && (
        <Section title={s.otherTitle}>
          <div className="grid gap-3">
            {others.map((msg) => (
              <Card key={msg.id}>
                <p className="text-[16px] font-bold text-ink">{nameOf(msg.borrowerId)}</p>
                <p className="text-sm font-medium text-ink-muted">{dateOf(msg.createdAt)}</p>
                {(msg.text || msg.reason) && <p className="mt-2 whitespace-pre-wrap text-[15px] font-medium text-ink">{msg.text || msg.reason}</p>}
              </Card>
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}
