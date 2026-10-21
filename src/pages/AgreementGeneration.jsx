import { useEffect, useMemo, useState } from "react";
import { FileSignature, PenLine, Printer } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { addUserRecord, uploadEvidence } from "../services/firebaseService";
import { formatPaise, rupeesToPaise, termsFromLoan, toDateKey } from "../utils/interestEngine";
import { Badge, Button, Card, Field, FilePicker, Input, List, ListRow, Notice, Screen, Section, Segmented, Select } from "../ui";
import { agreementCopy, agreementPaperCopy } from "./AgreementGeneration.copy";

const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";
const loanAmount = (loan) => formatPaise(rupeesToPaise(loan?.principal) || loan?.terms?.principalPaise || 0);

const timeOf = (a) => Date.parse(a?.generatedAt || "") || (a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);

// Agreements of one loan, oldest first, each with an effective version number.
function loanVersions(agreements, loanId) {
  const list = agreements
    .filter((a) => a.loanId === loanId)
    .sort((a, b) => {
      const va = Number.isFinite(a.version) ? a.version : 0;
      const vb = Number.isFinite(b.version) ? b.version : 0;
      return va !== vb ? va - vb : timeOf(a) - timeOf(b);
    });
  return list.map((agr, i) => ({ agr, version: Number.isFinite(agr.version) ? agr.version : i + 1, latest: i === list.length - 1 }));
}

// Paise for a stored amount (amountPaise preferred), or null.
function paiseOf(record, paiseKey, rupeesKey) {
  if (Number.isInteger(record?.[paiseKey]) && record[paiseKey] > 0) return record[paiseKey];
  const p = rupeesToPaise(record?.[rupeesKey]);
  return Number.isFinite(p) && p > 0 ? p : null;
}

// Object URL for a chosen signature photo, released when it changes.
function usePreview(file) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) return setUrl("");
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function SignatureBox({ src, label, name }) {
  return (
    <div className="text-center">
      <div className="mb-2 flex h-24 items-end justify-center border-b-2 border-black pb-2">
        {src && <img src={src} alt="" className="max-h-20 object-contain" />}
      </div>
      <p className="font-bold">{label}</p>
      {name && <p className="text-sm">{name}</p>}
    </div>
  );
}

export function AgreementGeneration() {
  const { user, lender, borrowers, loans, agreements, guarantors = [], collateral = [], refreshData } = useApp();
  const s = useCopy(agreementCopy);

  const [borrowerId, setBorrowerId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [paperLanguage, setPaperLanguage] = useState("te");
  const [witnessName, setWitnessName] = useState("");
  const [borrowerSignFile, setBorrowerSignFile] = useState(null);
  const [lenderSignFile, setLenderSignFile] = useState(null);
  const [witnessSignFile, setWitnessSignFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Version shown on the printed paper, fixed at save time so the refresh
  // after saving does not change it before printing.
  const [printed, setPrinted] = useState(null);
  useEffect(() => setPrinted(null), [loanId]);

  const borrowerSign = usePreview(borrowerSignFile);
  const lenderSign = usePreview(lenderSignFile);
  const witnessSign = usePreview(witnessSignFile);

  const selectedBorrower = borrowers.find((b) => b.id === borrowerId);
  const selectedLoan = loans.find((l) => l.id === loanId);
  const borrowerLoans = loans.filter((l) => l.borrowerId === borrowerId);
  const paper = agreementPaperCopy[paperLanguage];

  // Earlier versions of the agreement for the chosen loan.
  const previousVersions = loanId ? loanVersions(agreements, loanId) : [];
  const previous = previousVersions[previousVersions.length - 1] || null;
  const nextVersion = previous ? Math.max(...previousVersions.map((v) => v.version)) + 1 : 1;
  const loanGuarantors = loanId ? guarantors.filter((g) => g.loanId === loanId && (!g.borrowerId || g.borrowerId === borrowerId)) : [];
  const loanCollateral = loanId ? collateral.filter((c) => c.loanId === loanId && (!c.borrowerId || c.borrowerId === borrowerId)) : [];

  const paperText = useMemo(() => {
    if (!selectedBorrower || !selectedLoan) return null;
    const terms = termsFromLoan(selectedLoan) || {};
    const rate = Number.isFinite(terms.ratePercent) ? paper.rate(terms.ratePercent, terms.rateUnit) : "—";
    const fields = {
      date: new Date().toLocaleDateString(paper.dateFormat),
      borrower: borrowerName(selectedBorrower),
      village: selectedBorrower.personalInfo?.village || selectedBorrower.village || "",
      father: selectedBorrower.personalInfo?.fatherName || selectedBorrower.fatherName || "",
      lender: lender?.name || "",
      amount: loanAmount(selectedLoan),
      rate,
      method: paper.methods[terms.method] || paper.methodUnknown,
      start: toDateKey(terms.startDate) || toDateKey(selectedLoan.loanDate) || "",
      due: toDateKey(selectedLoan.dueDate) || "",
      witness: witnessName.trim()
    };
    const guarantorLines = loanGuarantors.map((g) => {
      const paise = paiseOf(g, "amountPaise", "amount") ?? paiseOf(g, "guaranteeAmountPaise", "guaranteeAmount");
      const scope = g.guaranteeScope || g.scope || g.coverage || "";
      return paper.guarantorLine({
        name: g.name || "",
        relationship: g.relationship || "",
        amount: paise ? formatPaise(paise) : "",
        scope: scope === "full" ? paper.fullLoan : scope
      });
    });
    const collateralLines = loanCollateral.map((c) => {
      const value = paiseOf({ ...c, estimatedValuePaise: c.estimatedValuePaise ?? c.valuePaise }, "estimatedValuePaise", "value");
      const isReturned = String(c.status || "").toLowerCase() === "returned" || Boolean(c.returnedAt || c.returnedDate);
      const returnedDate = toDateKey(c.returnedAt) || toDateKey(c.returnedDate);
      return paper.collateralLine({
        description: c.description || "",
        type: c.type ? paper.collateralTypes[String(c.type).toLowerCase()] || c.type : "",
        value: value ? formatPaise(value) : "",
        returned: isReturned ? returnedDate || true : false
      });
    });
    const supersedes = previous ? paper.supersedes(toDateKey(previous.agr.generatedAt) || "") : "";
    return { body: paper.body(fields), repay: paper.repay(fields), guarantorLines, collateralLines, supersedes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBorrower, selectedLoan, paper, lender, witnessName, guarantors, collateral, agreements]);

  const handleGenerate = async () => {
    setError("");
    setSuccess("");
    if (!user) return;
    if (!borrowerId || !loanId) return setError(s.needSelection);
    try {
      setLoading(true);
      const frozen = { version: nextVersion, supersedes: paperText?.supersedes || "" };
      const borrowerSignUrl = borrowerSignFile ? await uploadEvidence(user.uid, borrowerSignFile, ["agreements", loanId, "borrower"]) : "";
      const lenderSignUrl = lenderSignFile ? await uploadEvidence(user.uid, lenderSignFile, ["agreements", loanId, "lender"]) : "";
      const witnessSignUrl = witnessSignFile ? await uploadEvidence(user.uid, witnessSignFile, ["agreements", loanId, "witness"]) : "";
      await addUserRecord(user.uid, "agreements", {
        borrowerId,
        loanId,
        language: paperLanguage,
        witnessName,
        borrowerSignUrl,
        lenderSignUrl,
        witnessSignUrl,
        version: nextVersion,
        ...(previous?.agr?.id ? { supersedes: previous.agr.id } : {}),
        generatedAt: new Date().toISOString()
      });
      setPrinted(frozen);
      setSuccess(s.saved);
      await refreshData();
      setTimeout(() => window.print(), 500);
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setLoading(false);
    }
  };

  const printVersion = printed ? printed.version : nextVersion;
  const printSupersedes = printed ? printed.supersedes : paperText?.supersedes;
  const nameOf = (id) => borrowerName(borrowers.find((b) => b.id === id)) || s.unknown;
  const saved = [...agreements].sort((a, b) => String(b.generatedAt || "").localeCompare(String(a.generatedAt || "")));
  // Version and "replaced" state for every saved agreement, per loan.
  const versionInfo = new Map();
  for (const lid of new Set(agreements.map((a) => a.loanId).filter(Boolean))) {
    for (const v of loanVersions(agreements, lid)) versionInfo.set(v.agr.id, v);
  }
  // Borrower acknowledgement = an entry added by someone other than the lender.
  const borrowerAck = (a) => (Array.isArray(a.acknowledgements) ? a.acknowledgements : [])
    .filter((x) => x && x.uid && x.uid !== user?.uid && (!x.kind || x.kind === "agreement"))
    .sort((x, y) => String(y.at || "").localeCompare(String(x.at || "")))[0] || null;

  return (
    <>
      <div className="print:hidden">
        <Screen title={s.title} subtitle={s.subtitle} back>
          <Notice tone="warning" title={s.legalTitle}>{s.legalText}</Notice>

          <Card>
            <div className="grid gap-4">
              <Field label={s.borrower}>
                <Select value={borrowerId} onChange={(e) => { setBorrowerId(e.target.value); setLoanId(""); }}>
                  <option value="">{s.chooseBorrower}</option>
                  {borrowers.map((b) => <option key={b.id} value={b.id}>{borrowerName(b)}</option>)}
                </Select>
              </Field>
              <Field label={s.loan}>
                <Select value={loanId} onChange={(e) => setLoanId(e.target.value)} disabled={!borrowerId}>
                  <option value="">{s.chooseLoan}</option>
                  {borrowerLoans.map((l) => <option key={l.id} value={l.id}>{s.loanOption(loanAmount(l), toDateKey(l.loanDate))}</option>)}
                </Select>
              </Field>
              <Field label={s.docLanguage}>
                <Segmented
                  value={paperLanguage}
                  onChange={setPaperLanguage}
                  options={[{ value: "te", label: agreementPaperCopy.te.languageName }, { value: "en", label: agreementPaperCopy.en.languageName }]}
                />
              </Field>
              <Field label={s.witness}>
                <Input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} />
              </Field>
            </div>
          </Card>

          <Section title={s.signatures}>
            <div className="grid gap-3">
              <p className="px-1 text-[13px] font-medium text-ink-muted">{s.signaturesHint}</p>
              <FilePicker label={s.borrowerSign} accept="image/*" file={borrowerSignFile} onChange={setBorrowerSignFile} icon={PenLine} placeholder={s.pickPhoto} />
              <FilePicker label={s.lenderSign} accept="image/*" file={lenderSignFile} onChange={setLenderSignFile} icon={PenLine} placeholder={s.pickPhoto} />
              <FilePicker label={s.witnessSign} accept="image/*" file={witnessSignFile} onChange={setWitnessSignFile} icon={PenLine} placeholder={s.pickPhoto} />
            </div>
          </Section>

          {previous && <Notice tone="info">{s.newVersion(nextVersion)}</Notice>}

          {paperText && (
            <Card>
              <p className="text-[17px] font-extrabold text-ink">{paper.heading}{nextVersion > 1 ? ` · ${paper.version(nextVersion)}` : ""}</p>
              <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink-soft">{paperText.body}</p>
              <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink-soft">{paperText.repay}</p>
              {paperText.guarantorLines.length > 0 && (
                <>
                  <p className="mt-3 text-[15px] font-bold text-ink">{paper.guarantorsTitle}</p>
                  {paperText.guarantorLines.map((line, i) => <p key={i} className="text-[15px] font-medium text-ink-soft">{line}</p>)}
                  <p className="mt-1 text-[13px] font-medium text-ink-muted">{paper.guarantorNote}</p>
                </>
              )}
              {paperText.collateralLines.length > 0 && (
                <>
                  <p className="mt-3 text-[15px] font-bold text-ink">{paper.collateralTitle}</p>
                  {paperText.collateralLines.map((line, i) => <p key={i} className="text-[15px] font-medium text-ink-soft">{line}</p>)}
                </>
              )}
              {paperText.supersedes && <p className="mt-3 text-[13px] font-medium text-ink-muted">{paperText.supersedes}</p>}
            </Card>
          )}

          <p className="px-1 text-[13px] font-medium text-ink-muted">{s.whatHappens}</p>
          {error && <Notice tone="error">{error}</Notice>}
          {success && <Notice tone="success">{success}</Notice>}
          <Button size="lg" block icon={Printer} loading={loading} disabled={!borrowerId || !loanId} onClick={handleGenerate}>
            {loading ? s.saving : s.generate}
          </Button>

          <Section title={s.saved_list}>
            {saved.length === 0 ? (
              <Card><p className="text-[15px] font-medium text-ink-muted">{s.noSaved}</p></Card>
            ) : (
              <List>
                {saved.slice(0, 10).map((a) => {
                  const info = versionInfo.get(a.id);
                  const ack = borrowerAck(a);
                  return (
                    <ListRow
                      key={a.id}
                      icon={FileSignature}
                      title={nameOf(a.borrowerId)}
                      subtitle={`${s.savedOn(toDateKey(a.generatedAt) || toDateKey(a.createdAt) || "—")}${info ? ` · ${s.version(info.version)}` : ""}`}
                      trailing={
                        <span className="flex flex-col items-end gap-1">
                          {info && !info.latest && <Badge tone="ink">{s.replaced}</Badge>}
                          {ack ? <Badge tone="brand">{s.ackDone(toDateKey(ack.at) || "")}</Badge> : <Badge tone="amber">{s.ackPending}</Badge>}
                        </span>
                      }
                      to={a.loanId ? `/loans/${a.loanId}` : undefined}
                    />
                  );
                })}
              </List>
            )}
            {saved.length > 0 && <p className="mt-2 px-1 text-[13px] font-medium text-ink-muted">{s.ackNote}</p>}
          </Section>
        </Screen>
      </div>

      {/* Only visible when printing. */}
      <div className="hidden print:block" lang={paperLanguage}>
        {paperText && (
          <div className="rounded-lg border-2 border-black bg-[#ffffff] p-8 text-black">
            <h1 className="mb-2 text-center text-3xl font-black">{paper.heading}</h1>
            {printVersion > 1 ? <p className="mb-6 text-center text-base font-bold">{paper.version(printVersion)}</p> : <div className="mb-6" />}
            <p className="mb-4 text-lg leading-relaxed">{paperText.body}</p>
            <p className="mb-6 text-lg leading-relaxed">{paperText.repay}</p>
            {paperText.guarantorLines.length > 0 && (
              <div className="mb-6">
                <p className="text-lg font-bold">{paper.guarantorsTitle}</p>
                {paperText.guarantorLines.map((line, i) => <p key={i} className="text-lg leading-relaxed">{line}</p>)}
                <p className="mt-1 text-sm">{paper.guarantorNote}</p>
              </div>
            )}
            {paperText.collateralLines.length > 0 && (
              <div className="mb-6">
                <p className="text-lg font-bold">{paper.collateralTitle}</p>
                {paperText.collateralLines.map((line, i) => <p key={i} className="text-lg leading-relaxed">{line}</p>)}
              </div>
            )}
            {printSupersedes && <p className="mb-6 text-sm">{printSupersedes}</p>}
            <div className="mt-16 grid grid-cols-2 gap-8 pt-8">
              <SignatureBox src={borrowerSign} label={paper.borrowerSign} name={borrowerName(selectedBorrower)} />
              <SignatureBox src={lenderSign} label={paper.lenderSign} name={lender?.name} />
            </div>
            {witnessName.trim() && (
              <div className="mt-12 w-1/2">
                <SignatureBox src={witnessSign} label={paper.witnessSign} name={witnessName.trim()} />
              </div>
            )}
            <p className="mt-12 border-t border-black pt-4 text-sm">{paper.note}</p>
          </div>
        )}
      </div>
    </>
  );
}
