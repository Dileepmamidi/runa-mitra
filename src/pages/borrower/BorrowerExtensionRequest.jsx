import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarClock, CalendarDays, CalendarPlus, Mic, Send, Sprout } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { addUserRecord, uploadEvidence } from "../../services/firebaseService";
import { addDays, addMonths, daysBetween, formatPaise, toDateKey } from "../../utils/interestEngine";
import { Badge, Button, Card, EmptyState, Field, FilePicker, Input, Notice, Screen, Section, Select, TextArea } from "../../ui";
import { dateKeyOf, loanStartKey, openLoans, principalPaiseOf, requestState, todayKey, toMillis, useBorrowerLoans } from "./borrowerData";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerExtensionCopy } from "./BorrowerExtensionRequest.copy";

const MAX_BYTES = 15 * 1024 * 1024;
const OPTIONS = [
  { value: "week", icon: CalendarPlus },
  { value: "nextMonth", icon: CalendarDays },
  { value: "harvest", icon: Sprout },
  { value: "custom", icon: CalendarClock }
];
const stateTone = { pending: "amber", approved: "brand", rejected: "rose", other: "ink" };

export function BorrowerExtensionRequest() {
  const [searchParams] = useSearchParams();
  const { user, messages, refreshData } = useApp();
  const navigate = useNavigate();
  const s = useCopy(borrowerExtensionCopy);
  const sh = useCopy(borrowerSharedCopy);

  const items = useBorrowerLoans();
  const activeItems = openLoans(items);
  const initialLoanId = searchParams.get("loanId") || searchParams.get("loan") || (activeItems.length === 1 ? activeItems[0].loan.id : "");

  const [chosenLoanId, setLoanId] = useState("");
  const loanId = chosenLoanId || initialLoanId;
  const [option, setOption] = useState("week");
  const [pickedDate, setPickedDate] = useState("");
  const [reason, setReason] = useState("");
  const [voiceFile, setVoiceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = todayKey();
  const tomorrow = addDays(today, 1);
  const selectedLoan = activeItems.find((x) => x.loan.id === loanId)?.loan;
  const currentDue = toDateKey(selectedLoan?.dueDate);
  // New dates are counted from the current due date, or from today if it has passed.
  const baseDate = currentDue && currentDue >= today ? currentDue : today;
  const requestedDate =
    option === "week" ? addDays(baseDate, 7)
      : option === "nextMonth" ? addMonths(baseDate, 1)
        : toDateKey(pickedDate);

  const past = useMemo(
    () => messages
      .filter((m) => m.type === "extension_request")
      .sort((a, b) => toMillis(b.createdAt || b.requestedAt) - toMillis(a.createdAt || a.requestedAt)),
    [messages]
  );
  const loanName = (m) => items.find((x) => x.loan.id === m.loanId && x.loan.lenderUid === m.lenderUid)?.loan.lenderName || m.lenderName;

  const pickVoice = (file) => {
    setError("");
    if (file && !file.type.startsWith("audio/")) { setVoiceFile(null); return setError(s.errAudio); }
    if (file && file.size >= MAX_BYTES) { setVoiceFile(null); return setError(sh.fileTooBig); }
    setVoiceFile(file);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!selectedLoan) return setError(s.errLoan);
    if (!requestedDate || requestedDate <= today) return setError(s.errDate);

    try {
      setLoading(true);
      let voiceUrl = "";
      if (voiceFile) {
        voiceUrl = await uploadEvidence(selectedLoan.lenderUid, voiceFile, ["extensions", selectedLoan._borrowerId]);
      }

      const requestData = {
        borrowerId: selectedLoan._borrowerId,
        borrowerUid: user.uid,
        loanId,
        reason: reason.trim(),
        requestedDays: Math.max(1, daysBetween(baseDate, requestedDate)),
        requestedDate,
        option,
        voiceUrl,
        status: "pending",
        requestedAt: new Date(),
        type: "extension_request"
      };

      // Saved in the lender's messages. The due date changes only if the lender agrees.
      await addUserRecord(selectedLoan.lenderUid, "messages", requestData);
      setSuccess(s.success);
      setReason("");
      setVoiceFile(null);
      await refreshData();
      setTimeout(() => navigate("/home"), 2500);
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
            const state = requestState(m);
            const sent = dateKeyOf(m.createdAt) || dateKeyOf(m.requestedAt);
            return (
              <Card key={m.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-[16px] font-bold text-ink">{sh.loanFrom(loanName(m))}</p>
                  <Badge tone={stateTone[state]}>{s.status[state]}</Badge>
                </div>
                <p className="mt-1 text-[16px] font-bold text-ink">
                  {toDateKey(m.requestedDate) ? s.askedFor(sh.date(toDateKey(m.requestedDate))) : Number(m.requestedDays) > 0 ? s.askedDays(Number(m.requestedDays)) : null}
                </p>
                {sent && <p className="text-[14px] font-medium text-ink-muted">{s.sentOn(sh.date(sent))}</p>}
                {m.reason && <p className="mt-2 text-[14px] font-medium text-ink-soft"><span className="font-bold">{s.yourReason}:</span> {m.reason}</p>}
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

  if (activeItems.length === 0) {
    return (
      <Screen title={s.title} back>
        <EmptyState icon={CalendarClock} title={s.noLoansTitle} text={s.noLoansText} />
        {pastList}
      </Screen>
    );
  }

  return (
    <Screen title={s.title} subtitle={s.subtitle} back>
      <Notice tone="info" title={s.important}>{s.importantText}</Notice>

      <Card>
        <div className="grid gap-5">
          {activeItems.length > 1 || !selectedLoan ? (
            <Field label={sh.chooseLoan}>
              <Select value={loanId} onChange={(e) => setLoanId(e.target.value)}>
                <option value="">{sh.chooseLoanPlaceholder}</option>
                {activeItems.map(({ loan }) => (
                  <option key={`${loan.lenderUid}_${loan.id}`} value={loan.id}>
                    {sh.loanOption(loan.lenderName, principalPaiseOf(loan) ? formatPaise(principalPaiseOf(loan)) : "", loanStartKey(loan) ? sh.date(loanStartKey(loan)) : "")}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <p className="text-[17px] font-bold text-ink">{sh.loanFrom(selectedLoan.lenderName)}</p>
          )}
          {selectedLoan && (
            <p className="-mt-2 text-[15px] font-semibold text-ink-soft">{currentDue ? s.currentDue(sh.date(currentDue)) : s.noCurrentDue}</p>
          )}

          <div>
            <p className="mb-1.5 text-[15px] font-bold text-ink">{s.when}</p>
            <div className="grid grid-cols-2 gap-2">
              {OPTIONS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOption(value)}
                  aria-pressed={option === value}
                  className={`flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-xl border px-3 py-2 text-left text-[15px] font-bold transition ${
                    option === value ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-200" : "border-line bg-white text-ink"
                  }`}
                >
                  <Icon size={22} />
                  {s.options[value]}
                </button>
              ))}
            </div>
          </div>

          {(option === "harvest" || option === "custom") && (
            <Field label={option === "harvest" ? s.pickHarvest : s.pickCustom}>
              <Input type="date" min={tomorrow} value={pickedDate} onChange={(e) => setPickedDate(e.target.value)} />
            </Field>
          )}

          {requestedDate && requestedDate > today && (
            <p className="rounded-xl bg-brand-50 p-3 text-[16px] font-bold text-brand-800">{s.newDate(sh.date(requestedDate))}</p>
          )}

          <Field label={`${s.reason} (${sh.optional})`}>
            <TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={s.reasonPlaceholder} rows={3} />
          </Field>

          <FilePicker
            label={`${s.voice} (${sh.optional})`}
            accept="audio/*"
            file={voiceFile}
            onChange={pickVoice}
            icon={Mic}
            placeholder={s.voicePlaceholder}
          />
        </div>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      <Button size="lg" block icon={Send} loading={loading} disabled={loading || Boolean(success)} onClick={handleSubmit}>
        {loading ? s.sending : s.send}
      </Button>

      {pastList}
    </Screen>
  );
}
