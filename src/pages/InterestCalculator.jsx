import { useMemo, useState } from "react";
import { useCopy } from "../i18n/useCopy";
import { addMonths, calculateLoan, daysBetween, formatPaise, monthsAndDays, rupeesToPaise, toDateKey } from "../utils/interestEngine";
import { Card, DetailRow, Field, Input, MoneyHero, Notice, Screen, Section, Segmented } from "../ui";
import { calculatorCopy } from "./InterestCalculator.copy";

// Uses the same interest engine as real loans, on a made-up loan with no
// payments. Nothing is saved.
export function InterestCalculator() {
  const s = useCopy(calculatorCopy);
  const today = toDateKey(new Date());
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState("2");
  const [rateUnit, setRateUnit] = useState("month");
  const [method, setMethod] = useState("simple");
  const [compounding, setCompounding] = useState("monthly");
  const [startDate, setStartDate] = useState(addMonths(today, -6));
  const [asOf, setAsOf] = useState(today);

  const calc = useMemo(() => {
    const principalPaise = rupeesToPaise(amount);
    const ratePercent = rate === "" ? NaN : Number(rate);
    const loan = {
      terms: {
        principalPaise,
        ratePercent,
        rateUnit,
        method,
        ...(method === "compound" ? { compounding } : {}),
        startDate,
        pauses: []
      }
    };
    return calculateLoan(loan, [], asOf);
  }, [amount, rate, rateUnit, method, compounding, startDate, asOf]);

  const ok = calc.status === "ok";
  const span = ok ? { ...monthsAndDays(startDate, asOf), total: daysBetween(startDate, asOf) } : null;
  const p = ok ? formatPaise(calc.principalPaise) : "";
  const i = ok ? formatPaise(calc.interestAccruedPaise) : "";

  return (
    <Screen title={s.title} subtitle={s.subtitle} back>
      <Card>
        <div className="grid gap-4">
          <Field label={s.amount}>
            <Input type="number" inputMode="decimal" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={s.rate} hint={s.rateHint}>
            <Input type="number" inputMode="decimal" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
          <Field label={s.per}>
            <Segmented value={rateUnit} onChange={setRateUnit} options={[{ value: "month", label: s.perMonth }, { value: "year", label: s.perYear }]} />
          </Field>
          <Field label={s.method}>
            <Segmented value={method} onChange={setMethod} options={[{ value: "simple", label: s.simple }, { value: "compound", label: s.compound }]} />
          </Field>
          {method === "compound" && (
            <Field label={s.compounding}>
              <Segmented
                value={compounding}
                onChange={setCompounding}
                options={[{ value: "weekly", label: s.weekly }, { value: "monthly", label: s.monthly }, { value: "yearly", label: s.yearly }]}
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label={s.startDate}>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label={s.asOf}>
              <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>

      {!ok ? (
        <Notice tone="warning">{s.fixInputs}</Notice>
      ) : (
        <>
          <MoneyHero label={s.total} value={formatPaise(calc.outstandingPaise)} caption={`${s.period}: ${s.duration(span.months, span.days, span.total)}`} />
          <Section title={s.result}>
            <Card>
              <DetailRow label={s.principal} value={p} />
              <DetailRow label={s.interest} value={i} />
              <DetailRow label={s.total} value={formatPaise(calc.outstandingPaise)} strong />
            </Card>
          </Section>
          <Notice tone="info">
            <p>
              {method === "simple"
                ? s.explainSimple(p, rate, s.unitText[rateUnit], i)
                : s.explainCompound(p, rate, s.unitText[rateUnit], s.everyText[compounding], i)}
            </p>
            <p className="mt-2">{rateUnit === "month" ? s.timeRuleMonth : s.timeRuleYear}</p>
            <p className="mt-2">{s.noPayments}</p>
          </Notice>
        </>
      )}
    </Screen>
  );
}
