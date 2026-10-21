import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Section, Segmented } from "../ui";
import { themePickerCopy } from "./ThemePicker.copy";

/** Light / dark / follow-the-phone choice, shown on every "More" screen. */
export function ThemePicker() {
  const { theme, setTheme } = useApp();
  const s = useCopy(themePickerCopy);
  return (
    <Section title={s.title}>
      <Segmented
        value={theme}
        onChange={setTheme}
        options={[
          { value: "system", label: s.system },
          { value: "light", label: s.light },
          { value: "dark", label: s.dark }
        ]}
      />
    </Section>
  );
}
