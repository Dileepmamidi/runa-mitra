// Reads candidate values out of OCR text from an old handwritten loan note.
//
// Everything returned here is a SUGGESTION. The lender must look at the photo
// and confirm or correct every value before anything is saved; a loan is never
// created from these values automatically. Pure functions only (tested in
// noteParser.test.js).

const TELUGU_DIGITS = "౦౧౨౩౪౫౬౭౮౯";
const DEVANAGARI_DIGITS = "०१२३४५६७८९";

/** Telugu / Devanagari digits -> ASCII digits, and unify line endings. */
export function normaliseText(text) {
  return String(text || "")
    .replace(/[౦-౯]/g, (d) => String(TELUGU_DIGITS.indexOf(d)))
    .replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
    .replace(/\r\n?/g, "\n");
}

// A number: Indian (1,00,000) or western (100,000) grouping, or plain digits,
// with optional paise.
const NUM = String.raw`\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?`;
const CURRENCY = String.raw`₹|Rs\.?|RS\.?|rs\.?|INR|రూ\.?|రూపాయలు|రూపాయల|రూపాయి`;
const INTEREST_WORD = String.raw`వడ్డీ|వడ్డి|వడ్దీ|interest|Interest|INTEREST`;
const RUPEE_WORD = String.raw`రూపాయల|రూపాయలు|రూపాయి|రూపాయిల|రూ\.?|Rs\.?|rs\.?|rupees?|Rupees?|₹`;
const MONTH_WORD = /నెలకు|నెల|per\s*month|p\.?\s*m\.?\b|monthly|month/i;
const YEAR_WORD = /సంవత్సరానికి|సంవత్సరం|ఏడాదికి|ఏడాది|per\s*annum|per\s*year|p\.?\s*a\.?\b|yearly|annual|year/i;
const WITNESS_WORD = /సాక్షులు|సాక్షి|సాక్ష్యం|witness(?:es)?/i;
const NAME_WORD = /పేరు|name\b|అప్పు\s*తీసుకున్న(?:వారు|వారి)?|borrower|శ్రీ|గారు|s\/o|w\/o|d\/o|son\s+of|కుమారుడు|భార్య/i;

const toNumber = (raw) => Number(String(raw).replace(/,/g, ""));

/** Replace a matched span with spaces so later patterns do not match it again. */
function mask(text, start, length) {
  return text.slice(0, start) + " ".repeat(length) + text.slice(start + length);
}

function lineAt(text, index) {
  const start = text.lastIndexOf("\n", index - 1) + 1;
  const endRaw = text.indexOf("\n", index);
  return text.slice(start, endRaw === -1 ? text.length : endRaw);
}

/** Two-digit years: 00–50 -> 2000s, 51–99 -> 1900s. */
function fullYear(y) {
  if (y.length === 4) return Number(y);
  const n = Number(y);
  return n <= 50 ? 2000 + n : 1900 + n;
}

function validDateKey(d, m, y) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

/** dd/mm/yyyy, dd-mm-yy, dd.mm.yyyy (day first, as written in India). */
export function findDates(text) {
  const out = [];
  const re = /(?<!\d)(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{4}|\d{2})(?!\d)/g;
  for (const m of normaliseText(text).matchAll(re)) {
    const value = validDateKey(Number(m[1]), Number(m[2]), fullYear(m[3]));
    if (value) out.push({ value, raw: m[0], index: m.index });
  }
  return out;
}

function unitNear(text, index, length) {
  const around = text.slice(Math.max(0, index - 25), index + length + 30);
  if (MONTH_WORD.test(around)) return "month";
  if (YEAR_WORD.test(around)) return "year";
  return null;
}

/** "2%", "24 శాతం", "1.5 percent" with a per-month / per-year unit when written nearby. */
export function findPercentages(text) {
  const t = normaliseText(text);
  const out = [];
  const re = new RegExp(String.raw`(?<![\d.,])(\d{1,2}(?:\.\d{1,2})?)\s*(?:%|శాతం|percent|Percent|PERCENT)`, "g");
  for (const m of t.matchAll(re)) {
    out.push({ value: Number(m[1]), raw: m[0], index: m.index, unit: unitNear(t, m.index, m[0].length) });
  }
  return out;
}

/**
 * "2 రూపాయల వడ్డీ", "Rs 2 interest", "వడ్డీ 2 రూపాయలు": the village custom of
 * ₹N interest per ₹100 per month. Read as N% per month, but this is an
 * interpretation the lender must confirm.
 */
export function findRupeeInterest(text) {
  const t = normaliseText(text);
  const out = [];
  const patterns = [
    new RegExp(String.raw`(?<![\d.,])(\d{1,2}(?:\.\d{1,2})?)\s*(?:${RUPEE_WORD})\s*(?:ల\s*)?(?:${INTEREST_WORD})`, "g"),
    new RegExp(String.raw`(?:${RUPEE_WORD})\s*(\d{1,2}(?:\.\d{1,2})?)(?![\d,])\s*(?:${INTEREST_WORD})`, "g"),
    new RegExp(String.raw`(?:${INTEREST_WORD})\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)(?![\d,%])\s*(?:${RUPEE_WORD})`, "g")
  ];
  for (const re of patterns) {
    for (const m of t.matchAll(re)) {
      const value = Number(m[1]);
      if (!(value > 0 && value <= 10)) continue; // larger values are amounts, not a per-₹100 rate
      if (out.some((o) => o.index === m.index)) continue;
      out.push({ value, ratePercent: value, unit: "month", raw: m[0], index: m.index, interpretation: true });
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Money amounts: with ₹ / Rs / రూ., followed by రూపాయలు or /-, or with comma grouping. */
export function findAmounts(text) {
  let t = normaliseText(text);
  // Remove dates, percentages and rupee-interest phrases first.
  for (const d of findDates(t)) t = mask(t, d.index, d.raw.length);
  for (const p of findPercentages(t)) t = mask(t, p.index, p.raw.length);
  for (const r of findRupeeInterest(t)) t = mask(t, r.index, r.raw.length);

  const out = [];
  const add = (raw, numRaw, index) => {
    const value = toNumber(numRaw);
    if (!(value > 0) || out.some((o) => o.index === index)) return;
    out.push({ value, raw: raw.trim(), index });
  };
  const prefixed = new RegExp(String.raw`(?:${CURRENCY})\s*[:.\-]?\s*(${NUM})`, "g");
  for (const m of t.matchAll(prefixed)) add(m[0], m[1], m.index + m[0].indexOf(m[1]));
  const suffixed = new RegExp(String.raw`(?<![\d.,])(${NUM})\s*(?:/-|రూపాయలు|రూపాయల|rupees|Rupees|only)`, "g");
  for (const m of t.matchAll(suffixed)) add(m[0], m[1], m.index);
  const grouped = /(?<![\d.,])(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)(?![\d,])/g;
  for (const m of t.matchAll(grouped)) add(m[0], m[1], m.index);

  return out.sort((a, b) => a.index - b.index);
}

const cleanName = (s) =>
  s.replace(NAME_WORD, " ").replace(/[:\-–—=_.,;|]+/g, " ").replace(/\s+/g, " ").trim();

/** Lines after a సాక్షి / witness word (same line, or the next lines). */
export function findWitnesses(text) {
  const lines = normaliseText(text).split("\n").map((l) => l.trim());
  const out = [];
  lines.forEach((line, i) => {
    const m = WITNESS_WORD.exec(line);
    if (!m) return;
    const rest = line.slice(m.index + m[0].length).replace(/^[\s:\-–—.)0-9]+/, "").trim();
    if (rest) out.push(rest);
    else {
      for (const next of lines.slice(i + 1, i + 3)) {
        const v = next.replace(/^[\s:\-–—.)0-9]+/, "").trim();
        if (v && !WITNESS_WORD.test(v)) out.push(v);
      }
    }
  });
  return [...new Set(out)];
}

/** Lines that look like they name a person (పేరు, శ్రీ, గారు, S/o, …), excluding witness lines. */
export function findNames(text) {
  const out = [];
  for (const line of normaliseText(text).split("\n")) {
    if (!NAME_WORD.test(line) || WITNESS_WORD.test(line)) continue;
    const name = cleanName(line.replace(/[0-9₹%/]+/g, " "));
    if (name.length >= 2) out.push(name);
  }
  return [...new Set(out)];
}

/** All candidates found in the text. */
export function parseNote(text) {
  return {
    amounts: findAmounts(text),
    dates: findDates(text),
    percentages: findPercentages(text),
    rupeeInterest: findRupeeInterest(text),
    names: findNames(text),
    witnesses: findWitnesses(text)
  };
}

/**
 * Lowest OCR confidence (0–100) among the recognised words that make up `raw`,
 * or null when the value cannot be matched to any word.
 * words: [{ text, confidence }]
 */
export function confidenceFor(raw, words = []) {
  const tokens = normaliseText(raw).split(/\s+/).filter((x) => x.length > 0);
  if (!tokens.length || !words.length) return null;
  let min = null;
  for (const token of tokens) {
    const w = words.find((word) => {
      const text = normaliseText(word.text || "").trim();
      return text && (text.includes(token) || token.includes(text));
    });
    if (w && Number.isFinite(w.confidence)) min = min === null ? w.confidence : Math.min(min, w.confidence);
  }
  return min;
}

/**
 * One suggested value per field for the review form. The largest amount is
 * suggested as the amount given; a written percentage is preferred over a
 * rupee-interest phrase (which is flagged as an interpretation).
 */
export function suggestFields(text, words = []) {
  const parsed = parseNote(text);
  const conf = (raw) => confidenceFor(raw, words);
  const field = (value, raw, extra = {}) => ({ value: value ?? "", raw: raw || "", confidence: raw ? conf(raw) : null, ...extra });

  const amount = parsed.amounts.reduce((best, a) => (!best || a.value > best.value ? a : best), null);
  const date = parsed.dates[0] || null;
  const pct = parsed.percentages[0] || null;
  const rupee = parsed.rupeeInterest[0] || null;
  const rate = pct || rupee;
  const rateUnit = pct ? pct.unit || "" : rupee ? "month" : "";

  return {
    parsed,
    fields: {
      name: field(parsed.names[0], parsed.names[0]),
      amount: field(amount ? String(amount.value) : "", amount?.raw),
      date: field(date?.value, date?.raw),
      rate: field(rate ? String(rate.value) : "", rate?.raw, { interpretation: Boolean(!pct && rupee) }),
      rateUnit: field(rateUnit, rate?.raw, { interpretation: Boolean(!pct && rupee) }),
      witnesses: field(parsed.witnesses.join(", "), parsed.witnesses.join(" "))
    }
  };
}

/** Mean of word confidences (0–100), or null. */
export function meanConfidence(words = []) {
  const values = words.map((w) => w.confidence).filter((c) => Number.isFinite(c));
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
