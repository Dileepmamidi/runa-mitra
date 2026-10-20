import { AlertTriangle, ExternalLink, FileText, FolderOpen, HelpCircle, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { formatPaise, rupeesToPaise } from "../../utils/interestEngine";
import { Badge, Card, EmptyState, Screen, Section } from "../../ui";
import {
  agreementVersions, collateralForLoan, collateralState, dateKeyOf, guarantorAckState, guarantorsForLoan, loanLabel, toMillis, useBorrowerLoans
} from "./borrowerData";
import { AcknowledgeButton, AcknowledgedLine, LoanSecurityRecords } from "./BorrowerLoanRecords";
import { borrowerSharedCopy } from "./BorrowerShared.copy";
import { borrowerDocumentsCopy } from "./BorrowerDocuments.copy";

const isWebUrl = (url) => typeof url === "string" && /^https?:\/\//i.test(url);

const HANDWRITTEN = "handwritten note";
const isHandwritten = (ev) => String(ev?.category || "").toLowerCase() === HANDWRITTEN;

/** One row of the expected-documents checklist. */
function CheckRow({ label, status, tone, note }) {
  return (
    <div className="border-b border-line py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[16px] font-bold text-ink">{label}</span>
        <Badge tone={tone}>{status}</Badge>
      </div>
      {note && <p className="mt-1 text-[14px] font-medium text-ink-muted">{note}</p>}
    </div>
  );
}

function UnclearNotice({ text }) {
  return (
    <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-[15px] font-bold text-amber-800">
      <AlertTriangle size={20} className="shrink-0" /> {text}
    </p>
  );
}

function OpenLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 text-[15px] font-bold text-brand-700 active:bg-brand-100"
    >
      <ExternalLink size={18} /> {children}
    </a>
  );
}

export function BorrowerDocuments() {
  const { agreements, evidence, payments, guarantors, collateral, user } = useApp();
  const s = useCopy(borrowerDocumentsCopy);
  const sh = useCopy(borrowerSharedCopy);
  const items = useBorrowerLoans();

  const sameLender = (doc, loan) => !doc.lenderUid || doc.lenderUid === loan.lenderUid;
  const loanKeys = new Set(items.map(({ loan }) => `${loan.lenderUid}_${loan.id}`));
  const byNewest = (a, b) => toMillis(b.uploadedAt || b.generatedAt || b.createdAt) - toMillis(a.uploadedAt || a.generatedAt || a.createdAt);

  // Evidence not tied to one of the visible loans, grouped by lender.
  const general = evidence.filter((e) => !e.loanId || !loanKeys.has(`${e.lenderUid}_${e.loanId}`));
  const lenders = [...new Map(general.map((e) => [e.lenderUid, e.lenderName])).entries()];
  const proofs = payments
    .filter((p) => p.type === "borrower_submitted" && isWebUrl(p.screenshotUrl))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

  if (items.length === 0 && general.length === 0) {
    return (
      <Screen title={s.title} subtitle={s.subtitle}>
        <EmptyState icon={FolderOpen} title={s.noLoansTitle} text={s.noLoansText} />
      </Screen>
    );
  }

  const evidenceCard = (ev, i) => {
    const date = dateKeyOf(ev.uploadedAt) || dateKeyOf(ev.createdAt);
    return (
      <Card key={ev.id || i}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-ink">{s.categories[ev.category] || ev.category || s.document}</p>
            {date && <p className="mt-0.5 text-[14px] font-medium text-ink-muted">{sh.date(date)}</p>}
          </div>
          <Badge tone="brand">{s.uploaded}</Badge>
        </div>
        {ev.imageUnclear === true && <UnclearNotice text={s.imageUnclear} />}
        {isWebUrl(ev.fileUrl) && <div className="mt-3"><OpenLink href={ev.fileUrl}>{s.open}</OpenLink></div>}
      </Card>
    );
  };

  return (
    <Screen title={s.title} subtitle={s.subtitle}>
      {items.map(({ loan }) => {
        const versions = agreementVersions(loan, agreements, user?.uid);
        const current = versions.find((v) => v.latest);
        const loanEvidence = evidence.filter((e) => e.loanId === loan.id && sameLender(e, loan)).sort(byNewest);
        const notes = loanEvidence.filter(isHandwritten);
        const loanGuarantors = guarantorsForLoan(loan, guarantors);
        const loanCollateral = collateralForLoan(loan, collateral);
        const agreementStatus = !current
          ? { status: s.stMissing, tone: "ink", note: s.missingNote }
          : current.ack
            ? { status: s.stAcknowledged, tone: "brand" }
            : { status: s.stAckPending, tone: "amber" };
        const guarantorStatus = (g) => {
          const st = guarantorAckState(g);
          if (st === "recorded") return { status: s.stRecorded, tone: "brand" };
          if (st === "disputed") return { status: s.stDisputed, tone: "rose" };
          return { status: s.stNotRecorded, tone: "ink" };
        };
        return (
          <Section key={`${loan.lenderUid}_${loan.id}`} title={`${sh.loanFrom(loan.lenderName)} · ${loanLabel(loan, sh)}`}>
            <div className="grid gap-3">
              <Card>
                <p className="mb-1 text-[13px] font-bold uppercase tracking-wide text-ink-muted">{s.checklist}</p>
                <CheckRow label={s.checklistAgreement} {...agreementStatus} />
                <CheckRow
                  label={s.checklistNote}
                  {...(notes.length === 0
                    ? { status: s.stMissing, tone: "ink", note: s.missingNote }
                    : { status: s.stUploaded, tone: "brand", note: notes.some((n) => n.imageUnclear === true) ? s.imageUnclear : undefined })}
                />
                {loanGuarantors.map((g, i) => (
                  <CheckRow key={g.id || i} label={s.checklistGuarantor(g.name)} {...guarantorStatus(g)} />
                ))}
                {loanCollateral.map((c, i) => (
                  <CheckRow
                    key={c.id || i}
                    label={c.description ? `${s.checklistCollateral} · ${c.description}` : s.checklistCollateral}
                    status={collateralState(c) === "returned" ? s.stReturned : s.stHeld}
                    tone={collateralState(c) === "returned" ? "brand" : "amber"}
                  />
                ))}
              </Card>

              {versions.length === 0 ? (
                <Card>
                  <div className="flex items-start gap-3">
                    <FileText size={22} className="mt-0.5 shrink-0 text-ink-muted" />
                    <div>
                      <p className="text-[16px] font-bold text-ink">{s.noAgreement}</p>
                      <p className="mt-1 text-[14px] font-medium text-ink-muted">{s.noAgreementText}</p>
                    </div>
                  </div>
                </Card>
              ) : (
                versions.map(({ agr, version, replaced, ack }, i) => {
                  const date = dateKeyOf(agr.generatedAt) || dateKeyOf(agr.createdAt);
                  const files = [
                    [agr.fileUrl || agr.pdfUrl, s.agreementFile],
                    [agr.borrowerSignUrl, s.yourSignature],
                    [agr.lenderSignUrl, s.lenderSignature],
                    [agr.witnessSignUrl, s.witnessSignature]
                  ].filter(([url]) => isWebUrl(url));
                  return (
                    <Card key={agr.id || i} className={replaced ? "opacity-80" : ""}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[16px] font-bold text-ink">{s.agreement} · {s.version(version)}</p>
                          {date && <p className="mt-0.5 text-[14px] font-medium text-ink-muted">{sh.date(date)}</p>}
                          {agr.witnessName && <p className="mt-0.5 text-[14px] font-medium text-ink-muted">{s.witness(agr.witnessName)}</p>}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {replaced
                            ? <Badge tone="ink">{s.stReplaced}</Badge>
                            : ack ? <Badge tone="brand">{s.stAcknowledged}</Badge> : <Badge tone="amber">{s.stAckPending}</Badge>}
                          {files.length > 0 && <Badge tone="brand">{s.stUploaded}</Badge>}
                        </div>
                      </div>
                      {agr.imageUnclear === true && <UnclearNotice text={s.imageUnclear} />}
                      {files.length === 0 ? (
                        <p className="mt-2 text-[14px] font-medium text-ink-muted">{s.agreementNoFile}</p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {files.map(([url, label]) => <OpenLink key={url} href={url}>{label}</OpenLink>)}
                        </div>
                      )}
                      {replaced ? (
                        <p className="mt-3 text-[14px] font-medium text-ink-muted">{s.replacedHelp}</p>
                      ) : (
                        <div className="mt-4 border-t border-line pt-4">
                          {ack ? (
                            <AcknowledgedLine ack={ack} />
                          ) : (
                            <AcknowledgeButton
                              label={s.agreeAgreement}
                              lenderUid={loan.lenderUid}
                              collectionName="agreements"
                              docId={agr.id}
                              extra={{ kind: "agreement", version }}
                            />
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
              {loanEvidence.map(evidenceCard)}
            </div>
            {(loanGuarantors.length > 0 || loanCollateral.length > 0) && (
              <div className="mt-4">
                <h3 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink-muted">{s.security}</h3>
                <LoanSecurityRecords guarantors={loanGuarantors} collateral={loanCollateral} />
              </div>
            )}
          </Section>
        );
      })}

      {lenders.map(([lenderUid, lenderName]) => (
        <Section key={lenderUid || "unknown"} title={lenders.length > 1 && lenderName ? s.otherDocsFor(lenderName) : s.otherDocs}>
          <div className="grid gap-3">
            {general.filter((e) => e.lenderUid === lenderUid).sort(byNewest).map(evidenceCard)}
          </div>
        </Section>
      ))}

      {proofs.length > 0 && (
        <Section title={s.yourProofs}>
          <div className="grid gap-3">
            {proofs.map((p) => {
              const date = dateKeyOf(p.paymentDate) || dateKeyOf(p.createdAt);
              const paise = Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount);
              return (
                <Card key={p.id}>
                  <div className="flex items-start gap-3">
                    <ImageIcon size={22} className="mt-0.5 shrink-0 text-brand-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-bold text-ink">{s.proofFor(Number.isFinite(paise) ? formatPaise(paise) : "")}</p>
                      {date && <p className="mt-0.5 text-[14px] font-medium text-ink-muted">{sh.date(date)}</p>}
                    </div>
                  </div>
                  <div className="mt-3"><OpenLink href={p.screenshotUrl}>{s.open}</OpenLink></div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      <Link to="/help?topic=document" className="flex min-h-12 items-center gap-2 px-1 text-[15px] font-bold text-brand-700">
        <HelpCircle size={19} /> {s.cantOpen}
      </Link>
    </Screen>
  );
}
