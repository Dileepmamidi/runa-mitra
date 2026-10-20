import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { PLANS } from "../config/plans";
import { buyPlan } from "../services/planCheckout";
import { formatPaise } from "../utils/interestEngine";
import { Badge, Button, Card, Notice, Screen, Section } from "../ui";
import { plansCopy } from "./Plans.copy";

const BASE_FEATURES = ["core", "borrowerAccess", "collateral"];
const ORDER = ["simple", "regular", "advanced"];

const toDate = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null);

export function Plans() {
  const { plan, subscription, borrowers, lender, user, language, refreshData } = useApp();
  const s = useCopy(plansCopy);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null); // { tone, text }

  const locale = language === "te" ? "te-IN" : "en-IN";
  const fmt = (d) => d?.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const activeBorrowers = borrowers.filter((b) => b.status !== "inactive").length;
  const paidUntil = plan.id !== "simple" ? toDate(subscription?.currentPeriodEnd) : null;

  const choose = async (planId) => {
    setMessage(null);
    setBusy(planId);
    try {
      const result = await buyPlan({
        planId,
        description: s.names[planId],
        prefillName: lender.name,
        prefillContact: user?.phoneNumber
      });
      await refreshData();
      setMessage({ tone: "success", text: s.success(s.names[result.planId], fmt(new Date(result.currentPeriodEnd || Date.now()))) });
    } catch (err) {
      const text = s.errors[err.code] || s.errors.server;
      setMessage({ tone: err.code === "dismissed" ? "info" : "error", text });
    } finally {
      setBusy("");
    }
  };

  return (
    <Screen title={s.title} subtitle={s.subtitle} back="/more">
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card>
        <p className="text-sm font-bold text-ink-muted">{s.current}</p>
        <p className="mt-1 text-2xl font-extrabold text-ink">{s.names[plan.id]}</p>
        <p className="text-[15px] font-medium text-ink-soft">{paidUntil ? s.activeUntil(fmt(paidUntil)) : s.freeForever}</p>
        <p className="mt-2 text-[15px] font-semibold text-ink">{s.usage(activeBorrowers, plan.borrowerLimit)}</p>
      </Card>

      {ORDER.map((id) => {
        const p = PLANS[id];
        const isCurrent = plan.id === id;
        const features = [...BASE_FEATURES, ...p.features];
        return (
          <Card key={id} className={isCurrent ? "border-2 border-brand-500" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold text-ink">{s.names[id]}</p>
                <p className="mt-0.5 text-[15px] font-semibold text-ink-soft">{s.borrowers(p.borrowerLimit)}</p>
              </div>
              <div className="text-right">
                <p className="tabular text-2xl font-extrabold text-brand-700">{p.pricePaise ? formatPaise(p.pricePaise) : s.free}</p>
                {p.pricePaise > 0 && <p className="text-xs font-semibold text-ink-muted">{s.perMonth}</p>}
              </div>
            </div>
            <ul className="mt-3 grid gap-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[15px] font-medium text-ink">
                  <Check size={18} className="mt-0.5 shrink-0 text-brand-600" /> {s.features[f]}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              {id === "simple" ? (
                isCurrent && <Badge tone="brand">{s.yourPlan}</Badge>
              ) : (
                <Button block size="lg" variant={isCurrent ? "secondary" : "primary"} loading={busy === id} disabled={Boolean(busy)} onClick={() => choose(id)}>
                  {busy === id ? s.processing : isCurrent ? s.renew : s.choose}
                </Button>
              )}
            </div>
          </Card>
        );
      })}

      <Section>
        <div className="grid gap-3">
          <Notice tone="success" title={<span className="inline-flex items-center gap-1"><ShieldCheck size={16} /></span>}>{s.protection}</Notice>
          <Notice tone="info">{s.secure} {s.period}</Notice>
          {import.meta.env.VITE_RAZORPAY_MODE !== "live" && <Notice tone="warning">{s.testMode}</Notice>}
        </div>
      </Section>
    </Screen>
  );
}
