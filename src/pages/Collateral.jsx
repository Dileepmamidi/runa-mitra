import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Card, Notice, NotAvailable, Screen, Section } from "../ui";
import { collateralCopy } from "./Collateral.copy";

// Honest placeholder: this feature is not built yet and saves nothing.
export function Collateral() {
  const { t } = useApp();
  const s = useCopy(collateralCopy);
  return (
    <Screen title={s.title} back="/more">
      <NotAvailable title={t.notAvailable} text={t.notAvailableText} />
      <Section title={s.planTitle}>
        <Card>
          <ul className="grid list-disc gap-2 pl-5 text-[15px] font-medium text-ink">
            {s.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </Card>
      </Section>
      <Notice tone="info">{s.today}</Notice>
    </Screen>
  );
}
