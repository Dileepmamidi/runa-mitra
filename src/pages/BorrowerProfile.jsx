import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FileText, MessageCircle, Pencil, Phone, Plus, ReceiptText, Send, Smartphone } from "lucide-react";
import { borrowerName } from "../components/BorrowerCard";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { createBorrowerLink } from "../services/firebaseService";
import { calculateLoan, formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { Avatar, Badge, Button, Card, DetailRow, EmptyState, List, ListRow, MoneyHero, Notice, Screen, Section } from "../ui";
import { isValidMobile } from "./AddBorrower";
import { PaymentTimeline } from "./LoanDetails";
import { borrowerProfileCopy } from "./BorrowerProfile.copy";

// 10-digit local number, or "" if the stored number is not a valid Indian mobile.
function localMobile(value) {
  if (!isValidMobile(value)) return "";
  const digits = String(value).replace(/\D/g, "");
  return digits.slice(-10);
}

function ContactRow({ label, name, phone, s }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink-muted">{label}</p>
        <p className="truncate text-[16px] font-bold text-ink">{name || phone || s.notAdded}</p>
        {name && phone && <p className="tabular text-sm font-medium text-ink-soft">{phone}</p>}
      </div>
      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={s.callLabel(label)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 active:bg-brand-100"
        >
          <Phone size={20} />
        </a>
      )}
    </div>
  );
}

export function BorrowerProfile() {
  const { id } = useParams();
  const { user, lender, borrowers, loans, payments, evidence } = useApp();
  const s = useCopy(borrowerProfileCopy);
  const labels = useCopy(loanLabelsCopy);
  const borrower = borrowers.find((item) => item.id === id);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const today = toDateKey(new Date());
  const loanRows = useMemo(() => {
    return loans
      .filter((loan) => loan.borrowerId === id)
      .map((loan) => ({ loan, calc: calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), today) }))
      .sort((a, b) => ((a.calc.terms?.startDate || "") < (b.calc.terms?.startDate || "") ? 1 : -1));
  }, [loans, payments, id, today]);

  const summary = useMemo(() => {
    let outstanding = 0;
    let open = 0;
    let unclear = 0;
    for (const { calc } of loanRows) {
      if (calc.status !== "ok") unclear += 1;
      else if (!calc.settled) {
        outstanding += calc.outstandingPaise;
        open += 1;
      }
    }
    return { outstanding, open, unclear };
  }, [loanRows]);

  if (!borrower) {
    return (
      <Screen title={s.back} back="/borrowers">
        <EmptyState title={s.notFound} />
      </Screen>
    );
  }

  const name = borrowerName(borrower);
  const mobile = localMobile(borrower.mobile);
  const borrowerPayments = payments
    .filter((p) => p.borrowerId === id)
    .sort((a, b) => ((toDateKey(a.paymentDate) || "") < (toDateKey(b.paymentDate) || "") ? 1 : -1));
  const docs = (evidence || []).filter((e) => e.borrowerId === id && e.fileUrl);

  const invite = async () => {
    if (!user || !mobile) return;
    setInviteError("");
    setInviting(true);
    try {
      await createBorrowerLink(borrower.mobile, user.uid, id, { lenderName: lender.name, borrowerName: name });
      setInvited(true);
    } catch (err) {
      console.error(err);
      setInviteError(s.inviteError);
    } finally {
      setInviting(false);
    }
  };

  const whatsappUrl = mobile
    ? `https://wa.me/91${mobile}?text=${encodeURIComponent(s.whatsappText(name, lender.name, mobile))}`
    : "";

  return (
    <Screen
      title={name}
      subtitle={[borrower.village, labels.occupations[borrower.occupation] || borrower.occupation].filter(Boolean).join(" · ")}
      back="/borrowers"
      actions={<Button size="sm" variant="secondary" icon={Pencil} to={`/borrowers/edit/${id}`}>{s.edit}</Button>}
    >
      <div className="flex items-center gap-4">
        <Avatar name={name} src={borrower.photoUrl || undefined} size={64} />
        <div className="grid flex-1 grid-cols-3 gap-2">
          {borrower.mobile ? (
            <a href={`tel:${borrower.mobile}`} className="flex min-h-14 flex-col items-center justify-center rounded-xl border border-line bg-surface text-[13px] font-bold text-brand-700 shadow-soft active:bg-brand-50">
              <Phone size={20} />
              {s.call}
            </a>
          ) : <span />}
          <Button variant="secondary" className="min-h-14 flex-col gap-0.5 !px-1 text-[13px]" icon={Plus} to={`/loans/new?borrower=${id}`}>{s.newLoan}</Button>
          <Button variant="secondary" className="min-h-14 flex-col gap-0.5 !px-1 text-[13px]" icon={ReceiptText} to={`/payments/new?borrower=${id}`}>{s.recordPayment}</Button>
        </div>
      </div>

      {loanRows.length > 0 && (
        <MoneyHero
          label={s.outstanding}
          value={formatPaise(summary.outstanding)}
          caption={summary.unclear ? s.unclearCaption(summary.unclear) : s.outstandingCaption(summary.open)}
        />
      )}

      <Section title={s.appAccess}>
        <Card className="grid gap-3">
          {borrower.linkedUid ? (
            <div className="flex items-start gap-3">
              <Smartphone size={22} className="mt-0.5 shrink-0 text-brand-600" />
              <div>
                <Badge tone="brand">{s.usingApp}</Badge>
                <p className="mt-1.5 text-[15px] font-medium text-ink-soft">{s.usingAppText}</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[16px] font-bold text-ink">{s.notUsingApp}</p>
                <p className="mt-1 text-[15px] font-medium text-ink-soft">{s.notUsingAppText}</p>
              </div>
              {!mobile ? (
                <Notice tone="warning">{s.noMobile}</Notice>
              ) : invited ? (
                <>
                  <Notice tone="success">{s.invited}</Notice>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f9d55] px-4 text-[15px] font-bold text-white shadow-soft active:opacity-90"
                  >
                    <MessageCircle size={19} /> {s.whatsapp}
                  </a>
                </>
              ) : (
                <Button icon={Send} onClick={invite} loading={inviting}>{inviting ? s.inviting : s.invite}</Button>
              )}
              {inviteError && <Notice tone="error">{inviteError}</Notice>}
            </>
          )}
        </Card>
      </Section>

      <Section title={s.loans}>
        {loanRows.length === 0 ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.noLoans}</p></Card>
        ) : (
          <List>
            {loanRows.map(({ loan, calc }) => {
              const ok = calc.status === "ok";
              const principal = formatPaise(rupeesToPaise(loan.principal) || calc.terms?.principalPaise || 0);
              const date = calc.terms?.startDate || loan.loanDate || "—";
              return (
                <ListRow
                  key={loan.id}
                  to={`/loans/${loan.id}`}
                  icon={FileText}
                  title={s.loanTitle(principal, date)}
                  subtitle={!ok ? s.needsCheck : calc.settled ? s.settled : loan.dueDate ? s.dueOn(loan.dueDate) : labels.loanStatus.active}
                  trailing={
                    ok ? (
                      <span className="tabular text-[16px] font-extrabold text-ink">{formatPaise(calc.outstandingPaise)}</span>
                    ) : (
                      <Badge tone="amber">{s.needsCheck}</Badge>
                    )
                  }
                />
              );
            })}
          </List>
        )}
      </Section>

      {borrowerPayments.length > 0 && (
        <Section title={s.payments}>
          <PaymentTimeline payments={borrowerPayments} />
        </Section>
      )}

      <Section title={s.info}>
        <Card>
          <DetailRow label={s.mobile} value={borrower.mobile || s.notAdded} />
          {borrower.whatsapp && <DetailRow label={s.whatsappNo} value={borrower.whatsapp} />}
          {borrower.village && <DetailRow label={s.village} value={borrower.village} />}
          {borrower.occupation && <DetailRow label={s.occupation} value={labels.occupations[borrower.occupation] || borrower.occupation} />}
          {borrower.fatherName && <DetailRow label={s.father} value={borrower.fatherName} />}
          {borrower.address && <DetailRow label={s.address} value={borrower.address} />}
          <DetailRow label={s.aadhaar} value={borrower.aadhaarLast4 ? s.aadhaarRecorded(borrower.aadhaarLast4) : s.aadhaarNone} />
        </Card>
      </Section>

      <Section title={s.contacts}>
        <Card className="py-1">
          <ContactRow label={s.nominee} name={borrower.nomineeName} phone={borrower.nomineeMobile} s={s} />
          <ContactRow label={s.guarantor} name={borrower.guarantorName} phone={borrower.guarantorMobile} s={s} />
          <ContactRow label={s.family} phone={borrower.familyContact} s={s} />
        </Card>
      </Section>

      <Section title={s.notes}>
        <Card>
          <p className="mb-1 text-[13px] font-bold text-ink-muted">{s.notesHint}</p>
          <p className="whitespace-pre-wrap text-[15px] font-medium text-ink">{borrower.notes || s.noNotes}</p>
        </Card>
      </Section>

      <Section title={s.documents} action={<Button size="sm" variant="ghost" icon={Plus} to="/documents">{s.addDocument}</Button>}>
        {!borrower.aadhaarFileUrl && docs.length === 0 ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.noDocuments}</p></Card>
        ) : (
          <List>
            {borrower.aadhaarFileUrl && (
              <a href={borrower.aadhaarFileUrl} target="_blank" rel="noreferrer" className="flex min-h-[60px] items-center gap-3 px-4 py-3 active:bg-canvas">
                <FileText size={20} className="text-brand-600" />
                <span className="text-[16px] font-bold text-ink">{s.aadhaarFile}</span>
              </a>
            )}
            {docs.map((ev) => (
              <a key={ev.id} href={ev.fileUrl} target="_blank" rel="noreferrer" className="flex min-h-[60px] items-center gap-3 px-4 py-3 active:bg-canvas">
                <FileText size={20} className="text-brand-600" />
                <span className="truncate text-[16px] font-bold text-ink">{ev.category || s.otherDoc}</span>
              </a>
            ))}
          </List>
        )}
      </Section>
    </Screen>
  );
}
