import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Smartphone } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Field, TextInput } from "../components/FormControls";
import { auth } from "../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

function makeVerifier() {
  return new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "normal",
    callback: () => {},
    "expired-callback": () => {}
  });
}

export function Login() {
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
    const v = makeVerifier();
    v.render().then(() => {
      verifierRef.current = v;
    }).catch(() => {});

    return () => {
      try { v.clear(); } catch (_) {}
      verifierRef.current = null;
    };
  }, []);

  const resetVerifier = () => {
    // Clear old and mount fresh verifier into container
    if (verifierRef.current) {
      try { verifierRef.current.clear(); } catch (_) {}
      verifierRef.current = null;
    }
    const v = makeVerifier();
    v.render().then(() => {
      verifierRef.current = v;
    }).catch(() => {});
  };

  const handleSendOtp = async () => {
    setError("");
    const trimmed = phone.trim().replace(/\s/g, "");
    if (!trimmed || trimmed.length < 10) {
      setError("దయచేసి valid mobile number ఇవ్వండి.");
      return;
    }
    if (!verifierRef.current) {
      setError("reCAPTCHA సిద్ధంగా లేదు. కొంచెం వేచి మళ్ళీ ప్రయత్నించండి.");
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
        <p className="mt-2 text-sm font-semibold text-slate-500">
          OTP ద్వారా సురక్షితంగా లోపలికి వెళ్లండి.
        </p>

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

          {/* reCAPTCHA — always in DOM so verifier always has a container */}
          <div className={`flex justify-center ${otpSent ? "hidden" : ""}`}>
            <div id="recaptcha-container" />
          </div>

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
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
                resetVerifier();
              }}
            >
              మొబైల్ నంబర్ మార్చండి
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
