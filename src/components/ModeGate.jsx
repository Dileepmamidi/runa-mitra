import { Eye, Settings as SettingsIcon } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Button, EmptyState } from "../ui";
import { modeGateCopy } from "./ModeGate.copy";

// Display modes control how much detail is shown. They are not paid plans.
// "Simple" is the older name for "Basic".
const rank = { Basic: 1, Simple: 1, Regular: 2, Advanced: 3 };

export function ModeGate({ min = "Regular", children, label }) {
  const { appMode } = useApp();
  const s = useCopy(modeGateCopy);
  if ((rank[appMode] || 1) >= rank[min]) return children;

  return (
    <EmptyState
      icon={Eye}
      title={label || s.title(s.modes[min] || min)}
      text={s.text}
      action={<Button variant="secondary" icon={SettingsIcon} to="/settings">{s.openSettings}</Button>}
    />
  );
}
