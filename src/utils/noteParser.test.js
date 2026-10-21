import { test } from "node:test";
import assert from "node:assert/strict";
import {
  confidenceFor,
  findAmounts,
  findDates,
  findNames,
  findPercentages,
  findRupeeInterest,
  findWitnesses,
  meanConfidence,
  normaliseText,
  suggestFields
} from "./noteParser.js";

const values = (list) => list.map((x) => x.value);

test("amounts with ₹, Rs, రూ. and Indian commas", () => {
  assert.deepEqual(values(findAmounts("Received ₹50,000 only")), [50000]);
  assert.deepEqual(values(findAmounts("Rs. 1,00,000/-")), [100000]);
  assert.deepEqual(values(findAmounts("రూ. 25000 అప్పు")), [25000]);
  assert.deepEqual(values(findAmounts("మొత్తం 2,50,000 తీసుకున్నాను")), [250000]);
  assert.deepEqual(values(findAmounts("10000 రూపాయలు")), [10000]);
  assert.deepEqual(values(findAmounts("Rs 1,500.50")), [1500.5]);
});

test("amounts ignore dates, percentages and rupee-interest phrases", () => {
  const text = "తేదీ 12/03/2024 రూ. 40,000 కి 2 రూపాయల వడ్డీ, 3% నెలకు";
  assert.deepEqual(values(findAmounts(text)), [40000]);
});

test("Telugu digits are read", () => {
  assert.equal(normaliseText("౫౦౦౦"), "5000");
  assert.deepEqual(values(findAmounts("రూ. ౫౦,౦౦౦")), [50000]);
});

test("dates dd/mm/yyyy, dd-mm-yy, dd.mm.yyyy", () => {
  assert.deepEqual(values(findDates("on 05/01/2024")), ["2024-01-05"]);
  assert.deepEqual(values(findDates("తేదీ 15-08-23")), ["2023-08-15"]);
  assert.deepEqual(values(findDates("3.11.1998")), ["1998-11-03"]);
  assert.deepEqual(values(findDates("31/02/2024 invalid")), []);
  assert.deepEqual(values(findDates("13/13/2024")), []);
});

test("percentages with unit", () => {
  const [p] = findPercentages("వడ్డీ 2% నెలకు");
  assert.equal(p.value, 2);
  assert.equal(p.unit, "month");
  const [q] = findPercentages("24 శాతం సంవత్సరానికి");
  assert.equal(q.value, 24);
  assert.equal(q.unit, "year");
  const [r] = findPercentages("1.5 percent");
  assert.equal(r.value, 1.5);
  assert.equal(r.unit, null);
});

test("rupee interest is read as % per month and flagged as an interpretation", () => {
  const [a] = findRupeeInterest("నూటికి 2 రూపాయల వడ్డీ");
  assert.equal(a.ratePercent, 2);
  assert.equal(a.unit, "month");
  assert.equal(a.interpretation, true);
  assert.equal(findRupeeInterest("Rs 3 interest")[0].ratePercent, 3);
  assert.equal(findRupeeInterest("1.5 rupees interest")[0].ratePercent, 1.5);
  assert.equal(findRupeeInterest("వడ్డీ 2 రూపాయలు")[0].ratePercent, 2);
  // Large numbers are amounts, not a per-₹100 rate.
  assert.deepEqual(findRupeeInterest("5000 రూపాయల వడ్డీ"), []);
});

test("witness lines", () => {
  assert.deepEqual(findWitnesses("సాక్షి: రాము\nమరొకటి"), ["రాము"]);
  assert.deepEqual(findWitnesses("Witnesses\n1. Ravi Kumar\n2. Sita"), ["Ravi Kumar", "Sita"]);
  assert.deepEqual(findWitnesses("no one here"), []);
});

test("name candidates exclude witnesses", () => {
  const names = findNames("పేరు: వెంకట్ రెడ్డి\nసాక్షి: శ్రీ రాము గారు");
  assert.deepEqual(names, ["వెంకట్ రెడ్డి"]);
  assert.deepEqual(findNames("Name - Lakshmi"), ["Lakshmi"]);
});

test("confidence of a value is the lowest matching word confidence", () => {
  const words = [{ text: "రూ.", confidence: 90 }, { text: "40,000", confidence: 45 }];
  assert.equal(confidenceFor("రూ. 40,000", words), 45);
  assert.equal(confidenceFor("nothing", words), null);
  assert.equal(meanConfidence(words), 68);
  assert.equal(meanConfidence([]), null);
});

test("suggestFields picks the largest amount and prefers a written percentage", () => {
  const text = "పేరు: సుబ్బారావు\nతేదీ 05/01/2024\nరూ. 50,000 అప్పు, రూ. 500 ముందుగా\n2 రూపాయల వడ్డీ\nసాక్షి: రాము";
  const { fields } = suggestFields(text);
  assert.equal(fields.amount.value, "50000");
  assert.equal(fields.date.value, "2024-01-05");
  assert.equal(fields.rate.value, "2");
  assert.equal(fields.rateUnit.value, "month");
  assert.equal(fields.rate.interpretation, true);
  assert.equal(fields.name.value, "సుబ్బారావు");
  assert.equal(fields.witnesses.value, "రాము");

  const withPct = suggestFields("Rs 10,000 at 24% per year").fields;
  assert.equal(withPct.rate.value, "24");
  assert.equal(withPct.rateUnit.value, "year");
  assert.equal(withPct.rate.interpretation, false);
});

test("empty text gives empty suggestions", () => {
  const { fields } = suggestFields("");
  assert.equal(fields.amount.value, "");
  assert.equal(fields.rate.value, "");
  assert.equal(fields.amount.confidence, null);
});
