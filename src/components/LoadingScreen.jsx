import { useApp } from "../context/AppContext";
import { Spinner } from "../ui";

export function LoadingScreen() {
  const { t } = useApp();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas">
      <img src="/logo.svg" alt="" className="h-16 w-16 rounded-2xl shadow-soft" />
      <Spinner label={t.loading} />
    </div>
  );
}
