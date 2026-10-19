import { Inbox } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Button, Card, NotAvailable, Screen, Section } from "../ui";
import { extensionCopy } from "./RepaymentExtension.copy";

// Borrower extension requests are handled in the Inbox. Giving an extension
// directly from here is not built yet, so this screen saves nothing.
export function RepaymentExtension() {
  const { t } = useApp();
  const s = useCopy(extensionCopy);
  return (
    <Screen title={s.title} back="/more">
      <Card>
        <p className="text-[17px] font-bold text-ink">{s.howTitle}</p>
        <p className="mt-1 text-[15px] font-medium text-ink-soft">{s.howText}</p>
        <div className="mt-4">
          <Button icon={Inbox} size="lg" block to="/inbox">{s.openInbox}</Button>
        </div>
      </Card>
      <Section title={s.planTitle}>
        <NotAvailable title={t.notAvailable} text={t.notAvailableText} />
        <Card className="mt-3">
          <ul className="grid list-disc gap-2 pl-5 text-[15px] font-medium text-ink">
            {s.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </Card>
      </Section>
    </Screen>
  );
}
