import { Sparkles } from "lucide-react";
import { planForFeature } from "../config/plans";
import { useCopy } from "../i18n/useCopy";
import { Button, Card } from "../ui";
import { upgradeCardCopy } from "./UpgradeCard.copy";

/** Shown in place of a plan feature. Pass `feature`, or `limit` for the borrower limit. */
export function UpgradeCard({ feature, limit, text }) {
  const s = useCopy(upgradeCardCopy);
  const planId = feature ? planForFeature(feature) : "regular";
  return (
    <Card className="border-2 border-dashed border-brand-200 bg-brand-50/60">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700">
          <Sparkles size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold text-ink">{limit !== undefined ? s.limitTitle : s.title(s.plans[planId] || planId)}</p>
          {(text || limit !== undefined) && (
            <p className="mt-1 text-[15px] font-medium text-ink-soft">{text || s.limitText(limit)}</p>
          )}
          <Button className="mt-3" to="/plans">{s.button}</Button>
        </div>
      </div>
    </Card>
  );
}
