import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, CheckCircle2, FileSearch, FolderOpen, Gem, HandCoins, RotateCw, Save } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { addUserRecord, uploadEvidence } from "../services/firebaseService";
import { formatPaise, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { meanConfidence, suggestFields } from "../utils/noteParser";
import { Button, Card, Field, Input, Notice, Screen, Section, Segmented, Select, TextArea } from "../ui";
import { scanOldNoteCopy } from "./ScanOldNote.copy";

const borrowerName = (b) => b?.personalInfo?.name || b?.name || "";
const LOW_CONFIDENCE = 60;
const MAX_SIDE = 2000; // processed image size limit (pixels)
const FIELD_KEYS = ["name", "amount", "date", "rate", "rateUnit", "witnesses"];
const LOAN_KEYS = ["amount", "date", "rate", "rateUnit"];
const NO_CROP = { top: 0, bottom: 0, left: 0, right: 0 };

const emptyFields = () =>
  Object.fromEntries(FIELD_KEYS.map((k) => [k, { value: "", confirmed: false, confidence: null, raw: "", interpretation: false }]));

const emptySide = () => ({ file: null, img: null, url: "", rotation: 0, crop: { ...NO_CROP } });

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not open the image."));
    };
    img.src = url;
  });
}

/** Draw the side's image, turned and with edges cut, onto a canvas. */
function drawProcessed(canvas, { img, rotation, crop }, maxSide = MAX_SIDE) {
  const rot = ((rotation % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const rw = swap ? img.naturalHeight : img.naturalWidth;
  const rh = swap ? img.naturalWidth : img.naturalHeight;
  const sx = (rw * crop.left) / 100;
  const sy = (rh * crop.top) / 100;
  const sw = Math.max(1, rw * (1 - (crop.left + crop.right) / 100));
  const sh = Math.max(1, rh * (1 - (crop.top + crop.bottom) / 100));
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-sx, -sy);
  ctx.translate(rw / 2, rh / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();
  return canvas;
}

function processedCanvas(side) {
  return drawProcessed(document.createElement("canvas"), side);
}

function canvasToFile(canvas, name) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(new File([blob], name, { type: "image/jpeg" })) : reject(new Error("Could not prepare the image."))), "image/jpeg", 0.9);
  });
}

/** Words with confidence from a tesseract.js result (blocks output). */
function collectWords(data) {
  const words = [];
  for (const block of data?.blocks || []) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        for (const word of line.words || []) words.push({ text: word.text, confidence: word.confidence });
      }
    }
  }
  return words;
}

function SideEditor({ label, side, onChange, s }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (side.img && canvasRef.current) drawProcessed(canvasRef.current, side, 1200);
  }, [side]);

  const pick = async (file) => {
    if (!file) return;
    try {
      const { img, url } = await loadImage(file);
      if (side.url) URL.revokeObjectURL(side.url);
      onChange({ file, img, url, rotation: 0, crop: { ...NO_CROP } });
    } catch (err) {
      console.error(err);
    }
  };

  const setCrop = (key, value) => onChange({ ...side, crop: { ...side.crop, [key]: Number(value) } });

  return (
    <Card className="grid gap-3">
      <p className="text-[17px] font-extrabold text-ink">{label}</p>
      <label className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface px-4 text-[15px] font-bold text-brand-700 active:bg-canvas">
        <Camera size={20} />
        {side.file ? s.change : s.takePhoto}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
      </label>
      {side.img && (
        <>
          <canvas ref={canvasRef} className="mx-auto max-h-[420px] w-auto max-w-full rounded-xl border border-line bg-surface" />
          <Button variant="secondary" icon={RotateCw} onClick={() => onChange({ ...side, rotation: (side.rotation + 90) % 360 })}>{s.rotate}</Button>
          <div className="grid gap-2 rounded-xl bg-canvas p-3">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold text-ink">{s.cropTitle}</p>
              <Button variant="ghost" size="sm" onClick={() => onChange({ ...side, crop: { ...NO_CROP } })}>{s.resetCrop}</Button>
            </div>
            {[["top", s.cropTop], ["bottom", s.cropBottom], ["left", s.cropLeft], ["right", s.cropRight]].map(([key, text]) => (
              <label key={key} className="grid grid-cols-[72px_1fr] items-center gap-3 text-[14px] font-semibold text-ink-soft">
                <span>{text}</span>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={side.crop[key]}
                  onChange={(e) => setCrop(key, e.target.value)}
                  className="h-8 w-full accent-brand-600"
                  aria-label={`${s.cropTitle}: ${text}`}
                />
              </label>
            ))}
          </div>
          <p className="text-[13px] font-medium text-ink-muted">{s.originalKept}</p>
        </>
      )}
    </Card>
  );
}

function ValueField({ label, field, onValue, onConfirm, s, children }) {
  const low = !field.confirmed && field.confidence !== null && field.confidence < LOW_CONFIDENCE;
  return (
    <div className={`grid gap-2 rounded-xl p-3 ${low ? "border-2 border-amber-400 bg-amber-50" : "border border-line bg-surface"}`}>
      <p className="text-[15px] font-bold text-ink">{label}</p>
      {children || <Input value={field.value} onChange={(e) => onValue(e.target.value)} />}
      {field.raw && <p className="text-[13px] font-medium text-ink-muted">{s.readAs(field.raw)}</p>}
      {low && <p className="text-[13px] font-bold text-amber-800">{s.pleaseCheck}</p>}
      {onConfirm && (
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={field.confirmed} onChange={(e) => onConfirm(e.target.checked)} />
          <span className={`text-[15px] font-bold ${field.confirmed ? "text-brand-700" : "text-ink"}`}>{s.confirm}</span>
        </label>
      )}
    </div>
  );
}

// Keeps a photo of an old handwritten note with the borrower, and lets the
// lender record what it says. Reading the writing (OCR) only fills in
// suggestions; nothing becomes a loan unless the lender confirms each value
// and then chooses to open the loan form.
export function ScanOldNote() {
  const { user, borrowers, loans, hasFeature, refreshData } = useApp();
  const s = useCopy(scanOldNoteCopy);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const canOcr = hasFeature("ocr");

  const [front, setFront] = useState(emptySide);
  const [back, setBack] = useState(emptySide);
  const [fields, setFields] = useState(emptyFields);
  const [ocr, setOcr] = useState(null); // { text, meanConfidence, extractedAt }
  const [ocrState, setOcrState] = useState({ busy: false, status: "", progress: 0, message: "", tone: "info" });
  const [imageUnclear, setImageUnclear] = useState(false);
  const [borrowerId, setBorrowerId] = useState(() => (borrowers.some((b) => b.id === params.get("borrower")) ? params.get("borrower") : ""));
  const [loanId, setLoanId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");

  const sides = useRef({ front, back });
  sides.current = { front, back };
  useEffect(() => () => {
    for (const side of Object.values(sides.current)) if (side.url) URL.revokeObjectURL(side.url);
  }, []);

  const borrowerLoans = useMemo(() => loans.filter((l) => l.borrowerId === borrowerId), [loans, borrowerId]);

  // After saving, edits and ticks only affect the optional loan form below.
  const setValue = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: { ...prev[key], value, confirmed: false } }));
  };
  const setConfirmed = (key, confirmed) => {
    setFields((prev) => ({ ...prev, [key]: { ...prev[key], confirmed } }));
  };

  const readPhoto = async () => {
    if (!front.img) {
      setOcrState({ busy: false, status: "", progress: 0, message: s.needPhoto, tone: "warning" });
      return;
    }
    setOcrState({ busy: true, status: s.loadingEngine, progress: 0, message: "", tone: "info" });
    let worker = null;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("tel+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrState((prev) => ({ ...prev, status: s.reading, progress: Math.round((m.progress || 0) * 100) }));
          }
        }
      });
      let text = "";
      let words = [];
      for (const side of [front, back]) {
        if (!side.img) continue;
        const { data } = await worker.recognize(processedCanvas(side), {}, { text: true, blocks: true });
        text += `${data.text || ""}\n`;
        words = words.concat(collectWords(data));
      }
      const mean = meanConfidence(words);
      const { fields: suggested } = suggestFields(text, words);
      setFields((prev) => {
        const next = { ...prev };
        for (const key of FIELD_KEYS) {
          const sug = suggested[key];
          // Never overwrite something the lender already typed or confirmed.
          if (prev[key].value || prev[key].confirmed || !sug.value) continue;
          next[key] = { value: sug.value, confirmed: false, confidence: sug.confidence ?? mean, raw: sug.raw, interpretation: Boolean(sug.interpretation) };
        }
        return next;
      });
      setOcr({ text: text.trim(), meanConfidence: mean, extractedAt: new Date().toISOString() });
      const found = FIELD_KEYS.some((k) => suggested[k].value);
      setOcrState({
        busy: false,
        status: "",
        progress: 100,
        message: !found ? s.nothingFound : mean === null ? s.readDoneNoScore : s.readDone(mean),
        tone: found ? "success" : "warning"
      });
    } catch (err) {
      console.error(err);
      setOcrState({ busy: false, status: "", progress: 0, message: s.readError, tone: "error" });
    } finally {
      if (worker) worker.terminate().catch(() => {});
    }
  };

  const save = async () => {
    setError("");
    if (!user) return setError(s.errLogin);
    if (!front.file || !front.img) return setError(s.needPhoto);
    setSaving(true);
    try {
      const pathParts = ["notes", borrowerId || "unlinked"];
      const upload = (file) => uploadEvidence(user.uid, file, pathParts);
      const originalFrontUrl = await upload(front.file);
      const frontUrl = await upload(await canvasToFile(processedCanvas(front), "note-front.jpg"));
      let originalBackUrl = "";
      let backUrl = "";
      if (back.file && back.img) {
        originalBackUrl = await upload(back.file);
        backUrl = await upload(await canvasToFile(processedCanvas(back), "note-back.jpg"));
      }
      const savedFields = Object.fromEntries(FIELD_KEYS.map((k) => [k, { value: fields[k].value, confirmed: fields[k].confirmed }]));
      const ref = await addUserRecord(user.uid, "evidence", {
        category: "Handwritten note",
        borrowerId: borrowerId || "",
        loanId: loanId || "",
        fileUrl: frontUrl,
        fileName: front.file.name,
        frontUrl,
        backUrl,
        originalFrontUrl,
        originalBackUrl,
        imageUnclear,
        fields: savedFields,
        ocr: ocr
          ? {
              engine: "tesseract.js",
              languages: "tel+eng",
              text: ocr.text,
              meanConfidence: ocr.meanConfidence,
              extractedAt: ocr.extractedAt,
              fields: savedFields
            }
          : null,
        notes,
        uploadedAt: new Date()
      });
      setSaved({ id: ref?.id || "" });
      refreshData().catch(() => {});
    } catch (err) {
      console.error(err);
      setError(s.saveError);
    } finally {
      setSaving(false);
    }
  };

  const loanReady = Boolean(borrowerId) && LOAN_KEYS.every((k) => fields[k].confirmed && fields[k].value);

  const createLoan = () => {
    if (!loanReady) return;
    const noteLines = [s.loanNote];
    if (fields.witnesses.confirmed && fields.witnesses.value) noteLines.push(`${s.witnesses}: ${fields.witnesses.value}`);
    if (notes.trim()) noteLines.push(notes.trim());
    navigate(`/loans/new?borrower=${encodeURIComponent(borrowerId)}`, {
      state: {
        prefill: {
          principal: fields.amount.value,
          rate: fields.rate.value,
          rateUnit: fields.rateUnit.value,
          loanDate: fields.date.value,
          notes: noteLines.join("\n")
        }
      }
    });
  };

  const reset = () => {
    for (const side of [front, back]) if (side.url) URL.revokeObjectURL(side.url);
    setFront(emptySide());
    setBack(emptySide());
    setFields(emptyFields());
    setOcr(null);
    setOcrState({ busy: false, status: "", progress: 0, message: "", tone: "info" });
    setImageUnclear(false);
    setLoanId("");
    setNotes("");
    setSaved(null);
    setError("");
  };

  const rateField = fields.rate;

  return (
    <Screen title={s.title} subtitle={s.subtitle} back="/more">
      <Notice tone="warning">{s.legal}</Notice>

      <Section title={s.photosTitle}>
        <div className="grid gap-3">
          <SideEditor label={s.front} side={front} onChange={setFront} s={s} />
          <SideEditor label={s.back} side={back} onChange={setBack} s={s} />
        </div>
      </Section>

      <Section title={s.readTitle}>
        {canOcr ? (
          <Card className="grid gap-3">
            <p className="text-[15px] font-medium text-ink-soft">{s.readText}</p>
            <Button size="lg" block icon={FileSearch} loading={ocrState.busy} disabled={ocrState.busy || !front.img} onClick={readPhoto}>
              {s.readButton}
            </Button>
            {ocrState.busy && (
              <div className="grid gap-1.5">
                <p className="text-[14px] font-semibold text-ink-soft">{ocrState.status}</p>
                <div className="h-3 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuenow={ocrState.progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${ocrState.progress}%` }} />
                </div>
              </div>
            )}
            {ocrState.message && <Notice tone={ocrState.tone}>{ocrState.message}</Notice>}
          </Card>
        ) : (
          <Card className="grid gap-3 border-amber-200 bg-amber-50">
            <p className="text-[17px] font-extrabold text-ink">{s.ocrLockedTitle}</p>
            <p className="text-[15px] font-medium text-ink-soft">{s.ocrLockedText}</p>
            <Button to="/plans" icon={Gem}>{s.seePlans}</Button>
          </Card>
        )}
      </Section>

      <Section title={s.valuesTitle}>
        <div className="grid gap-3">
          <p className="px-1 text-[15px] font-medium text-ink-soft">{s.valuesText}</p>
          <ValueField label={s.name} field={fields.name} onValue={(v) => setValue("name", v)} onConfirm={(c) => setConfirmed("name", c)} s={s} />
          <ValueField label={s.amount} field={fields.amount} onConfirm={(c) => setConfirmed("amount", c)} s={s}>
            <Input type="number" inputMode="decimal" min="0" value={fields.amount.value} onChange={(e) => setValue("amount", e.target.value)} />
            {Number(fields.amount.value) > 0 && (
              <p className="text-[14px] font-bold text-ink">{formatPaise(rupeesToPaise(fields.amount.value))}</p>
            )}
          </ValueField>
          <ValueField label={s.date} field={fields.date} onConfirm={(c) => setConfirmed("date", c)} s={s}>
            <Input type="date" value={fields.date.value} onChange={(e) => setValue("date", e.target.value)} />
          </ValueField>
          {rateField.interpretation && rateField.raw && !rateField.confirmed && (
            <Notice tone="warning">{s.rupeeInterest(rateField.raw, rateField.value)}</Notice>
          )}
          <ValueField label={s.rate} field={rateField} onConfirm={(c) => setConfirmed("rate", c)} s={s}>
            <Input type="number" inputMode="decimal" min="0" step="0.01" value={rateField.value} onChange={(e) => setValue("rate", e.target.value)} />
          </ValueField>
          <ValueField label={s.rateUnit} field={{ ...fields.rateUnit, raw: "" }} onConfirm={(c) => setConfirmed("rateUnit", c)} s={s}>
            <Segmented
              value={fields.rateUnit.value}
              onChange={(v) => setValue("rateUnit", v)}
              options={[{ value: "month", label: s.perMonth }, { value: "year", label: s.perYear }]}
            />
            {!fields.rateUnit.value && <p className="text-[13px] font-medium text-ink-muted">{s.unitUnknown}</p>}
          </ValueField>
          <ValueField label={s.witnesses} field={fields.witnesses} onConfirm={(c) => setConfirmed("witnesses", c)} s={s}>
            <TextArea className="min-h-20" value={fields.witnesses.value} onChange={(e) => setValue("witnesses", e.target.value)} />
          </ValueField>
          <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-amber-500" checked={imageUnclear} onChange={(e) => setImageUnclear(e.target.checked)} />
            <span>
              <span className="block text-[15px] font-bold text-ink">{s.unclear}</span>
              <span className="block text-[13px] font-medium text-ink-muted">{s.unclearHelp}</span>
            </span>
          </label>
        </div>
      </Section>

      <Section title={s.linkTitle}>
        <Card className="grid gap-4">
          <Field label={s.borrower}>
            <Select value={borrowerId} disabled={Boolean(saved)} onChange={(e) => { setBorrowerId(e.target.value); setLoanId(""); }}>
              <option value="">{s.noBorrower}</option>
              {borrowers.map((b) => <option key={b.id} value={b.id}>{borrowerName(b)}{b.village ? ` · ${b.village}` : ""}</option>)}
            </Select>
          </Field>
          {borrowerLoans.length > 0 && (
            <Field label={s.loan}>
              <Select value={loanId} disabled={Boolean(saved)} onChange={(e) => setLoanId(e.target.value)}>
                <option value="">{s.noLoan}</option>
                {borrowerLoans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {s.loanOption(formatPaise((l.terms?.principalPaise ?? rupeesToPaise(l.principal)) || 0), toDateKey(l.terms?.startDate) || toDateKey(l.loanDate) || "")}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label={s.notes}>
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </Card>
      </Section>

      {error && <Notice tone="error">{error}</Notice>}

      {!saved ? (
        <Button size="lg" block icon={Save} loading={saving} disabled={saving || !front.img} onClick={save}>
          {saving ? s.saving : s.save}
        </Button>
      ) : (
        <>
          <Notice tone="success">{s.saved}</Notice>
          <Card className="grid gap-3 border-2 border-brand-500">
            <p className="text-[17px] font-extrabold text-ink">{s.createTitle}</p>
            <p className="text-[15px] font-medium text-ink-soft">{s.createText}</p>
            {!loanReady && <Notice tone="warning">{s.createNeeds}</Notice>}
            <Button size="lg" block icon={HandCoins} disabled={!loanReady} onClick={createLoan}>{s.createButton}</Button>
          </Card>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={FolderOpen} to={borrowerId ? `/documents?borrower=${borrowerId}` : "/documents"}>{s.openDocuments}</Button>
            <Button variant="secondary" icon={CheckCircle2} onClick={reset}>{s.scanAnother}</Button>
          </div>
        </>
      )}
    </Screen>
  );
}
