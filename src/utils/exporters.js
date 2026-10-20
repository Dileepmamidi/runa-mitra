// Pure helpers for backups and spreadsheet (CSV) exports. Tested in
// exporters.test.js. Saving the file (web download / Android share) is done by
// the BackupRestore screen.

import { calculateLoan, ENGINE_VERSION, paiseToRupees, rupeesToPaise, toDateKey } from "./interestEngine.js";

export const BACKUP_FORMAT = "runa-mitra-backup";
export const BACKUP_VERSION = 1;
export const BACKUP_COLLECTIONS = [
  "borrowers", "loans", "payments", "agreements", "evidence", "reminders", "messages", "guarantors", "collateral"
];

// Cells starting with these can run as formulas in Excel / Sheets.
const FORMULA_START = /^[=+\-@\t\r]/;

/** One CSV cell: formula-safe, quoted when needed, quotes doubled. */
export function csvCell(value) {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  // A plain negative number is data, not a formula.
  if (FORMULA_START.test(s) && !/^-\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s) || s !== s.trim()) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * rows: array of objects. columns: [{ key, label }] or [key]; key may be a
 * function (row) => value. Lines end with CRLF (RFC 4180).
 */
export function toCsv(rows, columns) {
  const cols = columns.map((c) => (typeof c === "string" ? { key: c, label: c } : c));
  const header = cols.map((c) => csvCell(c.label)).join(",");
  const body = (rows || []).map((row) =>
    cols.map((c) => csvCell(typeof c.key === "function" ? c.key(row) : row?.[c.key])).join(",")
  );
  return [header, ...body].join("\r\n") + "\r\n";
}

/** Firestore Timestamps, Dates and nested values -> plain JSON. */
export function toPlain(value) {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "object") {
    if (typeof value.seconds === "number" && typeof value.nanoseconds === "number" && Object.keys(value).length === 2) {
      return new Date(value.seconds * 1000 + Math.round(value.nanoseconds / 1e6)).toISOString();
    }
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
  }
  if (typeof value === "function") return undefined;
  return value;
}

/**
 * Full backup of a lender's records. Evidence is metadata only (file links,
 * not the files themselves).
 */
export function buildBackup(data = {}, { appVersion = "", exportedAt = new Date(), lender = null } = {}) {
  const collections = {};
  const counts = {};
  for (const name of BACKUP_COLLECTIONS) {
    const list = Array.isArray(data[name]) ? data[name] : [];
    collections[name] = list.map((item) => toPlain(item));
    counts[name] = list.length;
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_VERSION,
    exportedAt: exportedAt instanceof Date ? exportedAt.toISOString() : String(exportedAt),
    appVersion,
    engineVersion: ENGINE_VERSION,
    lender: lender ? toPlain(lender) : null,
    note: "Evidence entries contain file links and details only, not the photos or files themselves.",
    counts,
    collections
  };
}

const nameOf = (b) => b?.personalInfo?.name || b?.name || "";

/** One row per loan with amounts from the interest engine (or "needs clarification"). */
export function loanRows({ loans = [], payments = [], borrowers = [] }, asOf = toDateKey(new Date()), unclearText = "needs clarification") {
  return loans.map((loan) => {
    const calc = calculateLoan(loan, payments.filter((p) => p.loanId === loan.id), asOf);
    const terms = calc.terms || {};
    const ok = calc.status === "ok";
    const rupees = (paise) => (ok ? paiseToRupees(paise) : unclearText);
    return {
      loanId: loan.id,
      borrower: nameOf(borrowers.find((b) => b.id === loan.borrowerId)) || loan.borrowerName || "",
      principal: Number.isFinite(terms.principalPaise) ? paiseToRupees(terms.principalPaise) : loan.principal ?? "",
      rate: Number.isFinite(terms.ratePercent) ? terms.ratePercent : "",
      rateUnit: terms.rateUnit || "",
      method: terms.method || "",
      compounding: terms.compounding || "",
      startDate: toDateKey(terms.startDate) || "",
      dueDate: toDateKey(loan.dueDate) || "",
      outstanding: rupees(calc.outstandingPaise),
      unpaidInterest: rupees(calc.unpaidInterestPaise),
      principalPaid: rupees(calc.principalPaidPaise),
      interestPaid: rupees(calc.interestPaidPaise),
      status: ok ? (calc.settled ? "settled" : "active") : unclearText,
      asOf
    };
  });
}

export function paymentRows({ payments = [], loans = [], borrowers = [] }) {
  return payments.map((p) => {
    const loan = loans.find((l) => l.id === p.loanId);
    const amountPaise = Number.isInteger(p.amountPaise) ? p.amountPaise : rupeesToPaise(p.amount);
    return {
      paymentId: p.id,
      date: toDateKey(p.paymentDate) || toDateKey(p.createdAt) || "",
      borrower: nameOf(borrowers.find((b) => b.id === (p.borrowerId || loan?.borrowerId))) || "",
      loanId: p.loanId || "",
      amount: Number.isFinite(amountPaise) ? paiseToRupees(amountPaise) : "",
      type: p.paymentType || "",
      method: p.method || "",
      status: p.status || "recorded",
      recordedBy: p.type === "borrower_submitted" ? "borrower" : "lender",
      note: p.notes || p.note || ""
    };
  });
}

/** File-name friendly date stamp, e.g. 2026-10-20. */
export function fileStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
