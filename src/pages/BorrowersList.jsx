import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { BorrowerCard, borrowerName, borrowerOutstanding } from "../components/BorrowerCard";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { toDateKey } from "../utils/interestEngine";
import { Button, EmptyState, Input, List, Screen } from "../ui";
import { borrowersListCopy } from "./BorrowersList.copy";

export function BorrowersList() {
  const { borrowers, loans, payments } = useApp();
  const s = useCopy(borrowersListCopy);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const today = toDateKey(new Date());
    return borrowers
      .map((b) => ({ borrower: b, summary: borrowerOutstanding(b.id, loans, payments, today) }))
      .sort((a, b) => b.summary.outstandingPaise - a.summary.outstandingPaise);
  }, [borrowers, loans, payments]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? rows.filter(({ borrower: b }) =>
        [borrowerName(b), b.village, b.mobile, b.whatsapp].some((v) => String(v || "").toLowerCase().includes(q))
      )
    : rows;

  const addButton = <Button icon={UserPlus} to="/borrowers/new">{s.add}</Button>;

  if (borrowers.length === 0) {
    return (
      <Screen title={s.title}>
        <EmptyState icon={UserPlus} title={s.emptyTitle} text={s.emptyText} action={addButton} />
      </Screen>
    );
  }

  return (
    <Screen title={s.title} subtitle={s.count(borrowers.length)}>
      <div className="relative">
        <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={s.search} className="pl-12" aria-label={s.search} />
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Search} title={s.noMatchTitle} text={s.noMatchText} />
      ) : (
        <List>
          {shown.map(({ borrower, summary }) => (
            <BorrowerCard key={borrower.id} borrower={borrower} summary={summary} />
          ))}
        </List>
      )}

      <Button icon={UserPlus} to="/borrowers/new" variant="secondary" size="lg" block>{s.add}</Button>
    </Screen>
  );
}
