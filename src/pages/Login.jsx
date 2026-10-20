import { useState, useRef, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ShieldCheck } from "lucide-react";
import { auth } from "../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useCopy } from "../i18n/useCopy";
import { Button, Field, Input, Notice } from "../ui";
import { loginCopy } from "./Onboarding.copy";

// Returns null when the reCAPTCHA container is not on screen (for example
// while a signed-in user is being redirected away from this page).
function makeVerifier() {
  if (!document.getElementById("recaptcha-container")) return null;
  try {
    return new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "normal",
      callback: () => {},
      "expired-callback": () => {}
    });
  } catch (err) {
    console.warn("Could not start the security check", err);
    return null;
  }
}

export function Login() {
  const s = useCopy(loginCopy);
  const { user, authLoading } = useApp();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const confirmationRef = useRef(null);
  const verifierRef = useRef(null);
  const navigate = useNavigate();

  // Create & render verifier once on mount
  useEffect(() => {
    if (user) return undefined;
    const v = makeVerifier();
    if (!v) return undefined;
    v.render().then(() => {
      verifierRef.current = v;
    }).catch(() => {});

    return () => {
      try { v.clear(); } catch (_) {}
      verifierRef.current = null;
    };
  }, [user]);

  const resetVerifier = () => {
    // Clear old and mount fresh verifier into container
    if (verifierRef.current) {
      try { verifierRef.current.clear(); } catch (_) {}
      verifierRef.current = null;
    }
    const v = makeVerifier();
    v?.render().then(() => {
      verifierRef.current = v;
    }).catch(() => {});
  };

  const handleSendOtp = async () => {
    setError("");
    const trimmed = phone.trim().replace(/\s/g, "");
    if (!trimmed || trimmed.length < 10) {
      setError(s.invalidPhone);
      return;
    }
    if (!verifierRef.current) {
      setError(s.captchaNotReady);
      return;
    }
    try {
      setLoading(true);
      const formatted = trimmed.startsWith("+") ? trimmed : `+91${trimmed}`;
      const confirmation = await signInWithPhoneNumber(auth, formatted, verifierRef.current);
      confirmationRef.current = confirmation;
      setOtpSent(true);
    } catch (err) {
      console.error("OTP error:", err.code, err.message);
      resetVerifier();
      setError(s.sendFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!otp || otp.length !== 6) {
      setError(s.invalidOtp);
      return;
    }
    try {
      setLoading(true);
      await confirmationRef.current.confirm(otp);
      navigate("/home");
    } catch (err) {
      console.error("Verify error:", err);
      setError(s.wrongOtp);
    } finally {
      setLoading(false);
    }
  };

  if (user && !authLoading) return <Navigate to="/home" replace />;

  const formattedPhone = (() => {
    const trimmed = phone.trim().replace(/\s/g, "");
    return trimmed.startsWith("+") ? trimmed : `+91 ${trimmed}`;
  })();

  return (
    <main className="safe-top mx-auto flex min-h-screen max-w-md flex-col bg-canvas px-5 pb-8">
      <div className="flex-1 pt-16">
        <img src="/logo.svg" alt="" className="h-14 w-14 rounded-2xl shadow-soft" />
        <h1 className="mt-6 text-[30px] font-extrabold leading-tight text-ink">{s.title}</h1>
        <p className="mt-2 text-[16px] font-medium text-ink-soft">{otpSent ? s.sentTo(formattedPhone) : s.subtitle}</p>

        <div className="mt-8 grid gap-4">
          {error && <Notice tone="error">{error}</Notice>}

          {!otpSent ? (
            <Field label={s.phone}>
              <div className="flex gap-2">
                <span className="flex min-h-[52px] items-center rounded-xl border border-line bg-white px-4 text-[16px] font-bold text-ink-soft">+91</span>
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder={s.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </Field>
          ) : (
            <Field label={s.otp}>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={s.otpPlaceholder}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className={otp ? "tracking-[0.4em]" : ""}
              />
            </Field>
          )}

          {/* reCAPTCHA must stay in the DOM so the verifier always has a container */}
          <div className={`flex justify-center ${otpSent ? "hidden" : ""}`}>
            <div id="recaptcha-container" />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <Button size="lg" block loading={loading} onClick={otpSent ? handleVerifyOtp : handleSendOtp}>
          {loading ? s.wait : otpSent ? s.verify : s.sendOtp}
        </Button>
        {otpSent && (
          <Button
            variant="ghost"
            block
            onClick={() => {
              setOtpSent(false);
              setOtp("");
              setError("");
              resetVerifier();
            }}
          >
            {s.changeNumber}
          </Button>
        )}
        <p className="flex items-start gap-2 px-1 text-[13px] font-medium text-ink-muted">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" /> {s.privacy}
        </p>
      </div>
    </main>
  );
}
