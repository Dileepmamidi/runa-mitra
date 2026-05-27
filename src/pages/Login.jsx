import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Smartphone } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Field, TextInput } from "../components/FormControls";
import { auth } from "../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const confirmationRef = useRef(null);
  const verifierRef = useRef(null);
  const navigate = useNavigate();

  // Setup reCAPTCHA once when component mounts
  useEffect(() => {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          verifierRef.current = null;
        }
      });
      // Pre-render it so it's ready when user clicks
      verifierRef.current.render().catch(() => {});
    }
    return () => {
      // cleanup on unmount
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch (_) {}
        verifierRef.current = null;
      }
    };
  }, []);

  const handleSendOtp = async () => {
    setError("");
    const trimmed = phone.trim().replace(/\s/g, "");
    if (!trimmed || trimmed.length < 10) {
      setError("దయచేసి valid mobile number ఇవ్వండి.");
      return;
    }
    try {
      setLoading(true);
      const formatted = trimmed.startsWith("+") ? trimmed : `+91${trimmed}`;

      // If verifier was cleared due to expiry, recreate it
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
        await verifierRef.current.render();
      }

      const confirmation = await signInWithPhoneNumber(auth, formatted, verifierRef.current);
      confirmationRef.current = confirmation;
      setOtpSent(true);
    } catch (err) {
      console.error("OTP error:", err);
      // Reset verifier on error so it can be recreated fresh
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch (_) {}
        verifierRef.current = null;
      }
      setError("OTP పంపడంలో తప్పు జరిగింది: " + (err.message || "మళ్ళీ ప్రయత్నించండి."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!otp || otp.length !== 6) {
      setError("6 digit OTP ఇవ్వండి.");
      return;
    }
    try {
      setLoading(true);
      await confirmationRef.current.confirm(otp);
      navigate("/home");
    } catch (err) {
      console.error("Verify error:", err);
      setError("OTP తప్పు లేదా expired అయింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <div className="rounded-[8px] bg-white p-5 shadow-soft">
        <Smartphone className="text-leaf-600" size={42} />
        <h1 className="mt-5 text-3xl font-black text-slate-950">మొబైల్ లాగిన్</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">OTP ద్వారా సురక్షితంగా లోపలికి వెళ్లండి.</p>

        {/* reCAPTCHA mounts here — must stay in DOM */}
        <div id="recaptcha-container" />

        {error && (
          <div className="mt-3 rounded-[6px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4">
          <Field label="Mobile number">
            <TextInput
              inputMode="numeric"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={otpSent}
            />
          </Field>
          {otpSent && (
            <Field label="OTP">
              <TextInput
                inputMode="numeric"
                placeholder="6 digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </Field>
          )}
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <input type="checkbox" className="h-5 w-5 accent-leaf-600" defaultChecked />
            Remember this device
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <input type="checkbox" className="h-5 w-5 accent-leaf-600" />
            <LockKeyhole size={17} /> Enable PIN lock
          </label>
          <ActionButton
            onClick={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={loading}
          >
            {loading ? "వేచి ఉండండి..." : otpSent ? "Verify OTP" : "Send OTP"}
          </ActionButton>
          {otpSent && (
            <button
              className="text-sm font-semibold text-leaf-600 underline"
              onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
            >
              మొబైల్ నంబర్ మార్చండి
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
