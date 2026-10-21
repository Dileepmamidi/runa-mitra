import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Eye, LogOut, Mail, RefreshCw } from "lucide-react";
import { TopBar } from "../../components/AppFrame";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { loadFamilyView } from "../../services/firebaseService";
import { ThemePicker } from "../../components/ThemePicker";
import { calculateLoan, countsAsPaid, formatPaise, rupeesToPaise, toDateKey } from "../../utils/interestEngine";
import { Avatar, Badge, Button, Card, EmptyState, IconButton, List, ListRow, MoneyHero, Notice, Section, Segmented, Select, Spinner } from "../../ui";
import { familyViewCopy } from "./FamilyView.copy";

const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";

// Read-only view of a lender's records for an accepted family member.
// There are no write actions on this screen; Firestore rules also allow reads only.
export function FamilyView() {
  const { familyLinks, availableRoles, switchRole, logout, language, setLanguage, pendingFamilyInvites, pendingInvites } = useApp();
  const s = useCopy(familyViewCopy);
  const navigate = useNavigate();
  const [lenderUid, setLenderUid] = useState(familyLinks[0]?.lenderUid || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const today = toDateKey(new Date());

  useEffect(() => {
    if (!lenderUid && familyLinks[0]) setLenderUid(familyLinks[0].lenderUid);
  }, [familyLinks, lenderUid]);

  const load = useCallback(async () => {
    if (!lenderUid) return;
    setLoading(true);
    setError(false);
    try {
      const result = await loadFamilyView(lenderUid);
      setData(result);
    } catch (err) {
      console.error(err);
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [lenderUid]);

  useEffect(() => {
    load();
  }, [load]);

  const view = useMemo(() => {
    if (!data) return null;
    const { borrowers = [], loans = [], payments = [] } = data;
    let outstanding = 0;
    let unclear = 0;
    let active = 0;
    const perLoan = new Map();
    for (const loan of loans) {
      const calc = calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), today);
      perLoan.set(loan.id, calc);
      if (calc.status === "ok") {
        outstanding += calc.outstandingPaise;
        if (!calc.settled) active += 1;
      } else {
        unclear += 1;
        active += 1;
        outstanding += rupeesToPaise(loan.balance) || 0;
      }
    }
    const people = borrowers
      .map((b) => ({ b, loans: loans.filter((l) => l.borrowerId === b.id) }))
      .sort((a, b) => borrowerName(a.b).localeCompare(borrowerName(b.b)));
    const recent = [...payments]
      .sort((a, b) => ((toDateKey(b.paymentDate) || "") > (toDateKey(a.paymentDate) || "") ? 1 : -1))
      .slice(0, 8);
    return { outstanding, unclear, active, perLoan, people, recent, borrowers, loans };
  }, [data, today]);

  const nameOf = (id) => borrowerName(view?.borrowers.find((b) => b.id === id)) || s.unknownBorrower;
  const lenderName = (link) => link?.lenderName || s.unknownLender;
  const current = familyLinks.find((l) => l.lenderUid === lenderUid);
  const inviteCount = pendingFamilyInvites.length + pendingInvites.length;

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar roleLabel={s.viewOnly} person={{ name: "" }}>
        {inviteCount > 0 && <IconButton icon={Mail} label={s.invitations} badge={inviteCount} onClick={() => navigate("/invitations")} />}
      </TopBar>

      <main className="mx-auto grid max-w-xl grid-cols-1 gap-5 px-4 pb-16 pt-5">
        <Segmented
          value={language}
          onChange={setLanguage}
          options={[{ value: "te", label: "తెలుగు" }, { value: "en", label: "English" }]}
        />
        <ThemePicker />

        <Notice tone="info" title={s.viewOnly}>{s.viewOnlyText}</Notice>

        {familyLinks.length === 0 ? (
          <EmptyState icon={Eye} title={s.noLinks} />
        ) : (
          <>
            {familyLinks.length > 1 && (
              <label className="block">
                <span className="mb-1.5 block text-[15px] font-bold text-ink">{s.chooseLender}</span>
                <Select value={lenderUid} onChange={(e) => setLenderUid(e.target.value)}>
                  {familyLinks.map((l) => <option key={l.lenderUid} value={l.lenderUid}>{lenderName(l)}</option>)}
                </Select>
              </label>
            )}

            {loading && <Spinner label={s.loading} />}
            {error && (
              <Notice tone="error">
                {s.error}
                <div className="mt-2"><Button size="sm" variant="secondary" icon={RefreshCw} onClick={load}>{s.retry}</Button></div>
              </Notice>
            )}

            {view && !loading && (
              <>
                <MoneyHero
                  label={s.outstanding}
                  value={formatPaise(view.outstanding)}
                  caption={view.unclear ? s.clarifyCaption(view.unclear) : s.outstandingCaption(view.active)}
                />

                <Section title={s.borrowers}>
                  {view.people.length === 0 ? (
                    <Card><p className="text-[15px] font-medium text-ink-muted">{s.noBorrowers}</p></Card>
                  ) : (
                    <div className="grid gap-3">
                      {view.people.map(({ b, loans }) => (
                        <Card key={b.id} className="grid gap-2">
                          <div className="flex items-center gap-3">
                            <Avatar name={borrowerName(b)} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[17px] font-bold text-ink">{borrowerName(b) || s.unknownBorrower}</p>
                              <p className="text-[13px] font-medium text-ink-muted">{[b.village, s.loansOf(loans.length)].filter(Boolean).join(" · ")}</p>
                            </div>
                          </div>
                          {loans.map((loan) => {
                            const calc = view.perLoan.get(loan.id);
                            const principal = calc?.terms?.principalPaise ?? rupeesToPaise(loan.principal);
                            const start = toDateKey(calc?.terms?.startDate) || toDateKey(loan.loanDate) || "";
                            return (
                              <div key={loan.id} className="flex items-start justify-between gap-3 rounded-xl bg-canvas px-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-[14px] font-semibold text-ink">{s.given(formatPaise(principal || 0), start)}</p>
                                  {loan.dueDate && <p className="text-[13px] font-medium text-ink-muted">{s.due(loan.dueDate)}</p>}
                                </div>
                                <div className="shrink-0 text-right">
                                  {calc?.status === "ok" ? (
                                    calc.settled ? (
                                      <Badge tone="brand">{s.settled}</Badge>
                                    ) : (
                                      <>
                                        <p className="text-[12px] font-semibold text-ink-muted">{s.owes}</p>
                                        <p className="tabular text-[16px] font-extrabold text-ink">{formatPaise(calc.outstandingPaise)}</p>
                                      </>
                                    )
                                  ) : (
                                    <Badge tone="amber">{s.unclear}</Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </Card>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title={s.recent}>
                  {view.recent.length === 0 ? (
                    <Card><p className="text-[15px] font-medium text-ink-muted">{s.noPayments}</p></Card>
                  ) : (
                    <List>
                      {view.recent.map((p) => (
                        <ListRow
                          key={p.id}
                          avatar={<Avatar name={nameOf(p.borrowerId)} size={40} />}
                          title={nameOf(p.borrowerId)}
                          subtitle={[toDateKey(p.paymentDate), s.methods[p.method] || p.method].filter(Boolean).join(" · ")}
                          trailing={
                            <span className="flex flex-col items-end gap-1">
                              <span className="tabular text-[16px] font-extrabold text-brand-700">{formatPaise(rupeesToPaise(p.amount) || 0)}</span>
                              {!countsAsPaid(p) && <Badge tone="amber">{s.pending}</Badge>}
                            </span>
                          }
                        />
                      ))}
                    </List>
                  )}
                </Section>
              </>
            )}
          </>
        )}

        <div className="grid gap-2">
          {availableRoles.includes("lender") && (
            <Button variant="secondary" block icon={ArrowLeftRight} onClick={() => switchRole("lender")}>{s.switchLender}</Button>
          )}
          {availableRoles.includes("borrower") && (
            <Button variant="secondary" block icon={ArrowLeftRight} onClick={() => switchRole("borrower")}>{s.switchBorrower}</Button>
          )}
          <Button variant="ghost" block icon={LogOut} onClick={logout}>{s.logout}</Button>
        </div>
      </main>
    </div>
  );
}
