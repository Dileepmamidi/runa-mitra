import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { calculateLoan, formatPaise, toDateKey } from "../utils/interestEngine";
import { Avatar, Card, EmptyState, List, ListRow, Notice, Screen, Section } from "../ui";
import { communicationCopy } from "./Communication.copy";

const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";

// wa.me needs the number with country code and no symbols.
function whatsAppNumber(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits.length >= 10 ? digits : "";
}

// Opens WhatsApp with a respectful reminder typed in. The lender still has to
// press send inside WhatsApp; this app does not send or record anything.
export function Communication() {
  const { borrowers, loans, payments, lender } = useApp();
  const s = useCopy(communicationCopy);
  const today = toDateKey(new Date());

  const rows = useMemo(
    () =>
      borrowers.map((b) => {
        let outstanding = 0;
        let clear = true;
        for (const loan of loans.filter((l) => l.borrowerId === b.id)) {
          const calc = calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), today);
          if (calc.status === "ok") outstanding += calc.outstandingPaise;
          else clear = false;
        }
        // Only quote an amount when every loan's terms are clear.
        const amount = clear && outstanding > 0 ? formatPaise(outstanding) : null;
        return { b, name: borrowerName(b), amount, phone: whatsAppNumber(b.mobile) };
      }),
    [borrowers, loans, payments, today]
  );

  const link = (row) => `https://wa.me/${row.phone}?text=${encodeURIComponent(s.reminder(row.name, lender?.name, row.amount))}`;

  return (
    <Screen title={s.title} back="/more">
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

      <Section title={s.previewTitle}>
        <Card>
          <p className="text-[15px] font-medium text-ink-soft">{s.reminder(rows[0]?.name || "…", lender?.name, rows[0]?.amount)}</p>
        </Card>
      </Section>

      <Section title={s.planTitle}>
        <Notice tone="warning" title={s.notAvailable}>
          <ul className="mt-1 list-disc pl-5">
            {s.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </Notice>
      </Section>
    </Screen>
  );
}
