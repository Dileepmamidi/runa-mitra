import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Button, Card, Notice, NotAvailable, Screen, Section } from "../ui";
import { scanOldNoteCopy } from "./ScanOldNote.copy";

// Honest placeholder: this feature is not built yet and saves nothing.
export function ScanOldNote() {
  const { t } = useApp();
  const s = useCopy(scanOldNoteCopy);
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
      <Button variant="secondary" size="lg" block to="/documents">{s.openDocuments}</Button>
    </Screen>
  );
}
