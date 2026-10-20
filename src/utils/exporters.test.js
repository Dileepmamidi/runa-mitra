import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBackup, BACKUP_COLLECTIONS, csvCell, loanRows, paymentRows, toCsv, toPlain } from "./exporters.js";

test("csvCell escapes quotes, commas and newlines", () => {
  assert.equal(csvCell("plain"), "plain");
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(undefined), "");
  assert.equal(csvCell(0), "0");
  assert.equal(csvCell("తెలుగు పేరు"), "తెలుగు పేరు");
});

test("csvCell neutralises spreadsheet formulas", () => {
  assert.equal(csvCell("=SUM(A1:A2)"), "'=SUM(A1:A2)");
  assert.equal(csvCell("+91 98765"), "'+91 98765");
  assert.equal(csvCell("-2+3+cmd|' /C calc'!A0"), "'-2+3+cmd|' /C calc'!A0");
  assert.equal(csvCell("@HYPERLINK(x)"), "'@HYPERLINK(x)");
  assert.equal(csvCell('=HYPERLINK("x","y")'), `"'=HYPERLINK(""x"",""y"")"`);
  // Plain negative numbers stay numbers.
  assert.equal(csvCell(-500), "-500");
});

test("toCsv builds header and rows with CRLF", () => {
  const csv = toCsv(
    [{ name: "Ravi, K", amount: 100 }, { name: "=bad", amount: 2 }],
    [{ key: "name", label: "Name" }, { key: (r) => r.amount * 2, label: "Double" }]
  );
  assert.equal(csv, 'Name,Double\r\n"Ravi, K",200\r\n\'=bad,4\r\n');
  assert.equal(toCsv([], ["a", "b"]), "a,b\r\n");
});

test("toPlain converts timestamps and dates", () => {
  const ts = { toDate: () => new Date("2026-01-05T00:00:00Z") };
  assert.deepEqual(toPlain({ a: ts, b: [new Date("2026-02-01T00:00:00Z")], c: { seconds: 0, nanoseconds: 0 } }), {
    a: "2026-01-05T00:00:00.000Z",
    b: ["2026-02-01T00:00:00.000Z"],
    c: "1970-01-01T00:00:00.000Z"
  });
});

test("buildBackup includes every collection, counts and versions", () => {
  const backup = buildBackup(
    { borrowers: [{ id: "b1", name: "Ravi" }], loans: [{ id: "l1" }] },
    { appVersion: "1.0.0", exportedAt: new Date("2026-10-20T10:00:00Z") }
  );
  assert.equal(backup.format, "runa-mitra-backup");
  assert.equal(backup.exportedAt, "2026-10-20T10:00:00.000Z");
  assert.equal(backup.appVersion, "1.0.0");
  assert.equal(typeof backup.engineVersion, "number");
  assert.deepEqual(Object.keys(backup.collections), BACKUP_COLLECTIONS);
  assert.equal(backup.counts.borrowers, 1);
  assert.equal(backup.counts.payments, 0);
  assert.deepEqual(backup.collections.payments, []);
});

test("loanRows uses the interest engine or marks the loan as unclear", () => {
  const data = {
    borrowers: [{ id: "b1", name: "Ravi" }],
    loans: [
      { id: "l1", borrowerId: "b1", terms: { principalPaise: 2000000, ratePercent: 2, rateUnit: "month", method: "simple", startDate: "2026-01-05", pauses: [] } },
      { id: "l2", borrowerId: "b1", terms: { principalPaise: 100000, rateUnit: "month", method: "simple", startDate: "2026-01-05" } }
    ],
    payments: []
  };
  const [ok, unclear] = loanRows(data, "2026-04-05", "check");
  assert.equal(ok.borrower, "Ravi");
  assert.equal(ok.principal, 20000);
  assert.equal(ok.outstanding, 21200);
  assert.equal(ok.unpaidInterest, 1200);
  assert.equal(ok.status, "active");
  assert.equal(unclear.outstanding, "check");
  assert.equal(unclear.status, "check");
});

test("paymentRows", () => {
  const [row] = paymentRows({
    payments: [{ id: "p1", loanId: "l1", amount: 500, paymentDate: "2026-02-01", method: "Cash" }],
    loans: [{ id: "l1", borrowerId: "b1" }],
    borrowers: [{ id: "b1", personalInfo: { name: "Sita" } }]
  });
  assert.equal(row.borrower, "Sita");
  assert.equal(row.amount, 500);
  assert.equal(row.date, "2026-02-01");
  assert.equal(row.recordedBy, "lender");
});
