import { useApp } from "../context/AppContext";
import { Logo } from "./Logo";

// Start-up screen: the logo pieces come together, then the name appears.
export function BrandSplash({ showSpinner = false }) {
  const { t } = useApp();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#cdeee8] px-6 text-center dark:bg-canvas">
      <Logo size={132} animated />
      <h1
        className="mt-6 text-[34px] font-black tracking-tight text-[#15474a] dark:text-ink"
        style={{ animation: "fade-up 500ms cubic-bezier(.2,.7,.2,1) 650ms both" }}
      >
        {t.appName}
      </h1>
      <p
        className="mt-1 max-w-xs text-[15px] font-semibold text-[#2f6264] dark:text-ink-soft"
        style={{ animation: "fade-up 500ms cubic-bezier(.2,.7,.2,1) 800ms both" }}
      >
        {t.tagline}
      </p>
      {showSpinner && (
        <span
          className="mt-8 h-1.5 w-28 overflow-hidden rounded-full bg-[#15474a]/10"
          style={{ animation: "fade-in 300ms ease-out 1000ms both" }}
        >
          <span className="block h-full w-1/3 animate-[shimmer_1.2s_linear_infinite] rounded-full bg-[#15474a]/40" />
        </span>
      )}
    </div>
  );
}

export function LoadingScreen() {
  return <BrandSplash showSpinner />;
}
