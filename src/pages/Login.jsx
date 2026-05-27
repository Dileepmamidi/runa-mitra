import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Smartphone } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Field, TextInput } from "../components/FormControls";

export function Login() {
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <div className="rounded-[8px] bg-white p-5 shadow-soft">
        <Smartphone className="text-leaf-600" size={42} />
        <h1 className="mt-5 text-3xl font-black text-slate-950">మొబైల్ లాగిన్</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">OTP ద్వారా సురక్షితంగా లోపలికి వెళ్లండి.</p>
        <div id="recaptcha-container" />
        <div className="mt-6 grid gap-4">
          <Field label="Mobile number">
            <TextInput inputMode="numeric" placeholder="+91 98765 43210" />
          </Field>
          {otpSent && (
            <Field label="OTP">
              <TextInput inputMode="numeric" placeholder="6 digit OTP" />
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
          <ActionButton onClick={() => (otpSent ? navigate("/profile-setup") : setOtpSent(true))}>
            {otpSent ? "Verify OTP" : "Send OTP"}
          </ActionButton>
        </div>
      </div>
    </main>
  );
}
