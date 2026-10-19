import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { useApp } from "../context/AppContext";

const text = {
  te: {
    title: "రుణ ఆహ్వానాలు",
    intro: "ఈ రుణదాతలు మీ ఫోన్ నంబర్‌తో మీ రుణ వివరాలు పంచుకోవాలనుకుంటున్నారు. ఇది మీదే అయితే మాత్రమే అంగీకరించండి.",
    from: "రుణదాత",
    as: "మీ పేరు (రుణదాత నమోదు చేసినది)",
    accept: "అవును, ఇది నేనే",
    decline: "ఇది నేను కాదు",
    none: "కొత్త ఆహ్వానాలు లేవు.",
    skip: "తర్వాత చూస్తాను",
    error: "ఆహ్వానాన్ని అంగీకరించలేకపోయాం. మళ్ళీ ప్రయత్నించండి.",
    unknown: "తెలియదు"
  },
  en: {
    title: "Loan invitations",
    intro: "These lenders want to share your loan records with this phone number. Accept only if this is you.",
    from: "Lender",
    as: "Your name (as entered by the lender)",
    accept: "Yes, this is me",
    decline: "This is not me",
    none: "No new invitations.",
    skip: "Later",
    error: "Could not accept the invitation. Please try again.",
    unknown: "Not given"
  }
};

export function Invitations() {
  const { language, pendingInvites, respondToInvite } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const s = text[language] || text.te;

  const respond = async (invite, accept) => {
    setError("");
    setBusy(invite.id);
    try {
      await respondToInvite(invite, accept);
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-black text-slate-950">{s.title}</h1>
      <p className="mt-2 text-base font-semibold text-slate-600">{s.intro}</p>
      {error && <p className="mt-4 rounded-[8px] bg-danger-50 p-3 font-bold text-danger-500">{error}</p>}
      <div className="mt-4 grid gap-3">
        {pendingInvites.length === 0 && <Card><p className="font-bold text-slate-600">{s.none}</p></Card>}
        {pendingInvites.map((invite) => (
          <Card key={invite.id}>
            <p className="text-sm font-bold text-slate-500">{s.from}</p>
            <p className="text-lg font-black text-slate-950">{invite.lenderName || s.unknown}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">{s.as}</p>
            <p className="text-lg font-black text-slate-950">{invite.borrowerName || s.unknown}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ActionButton disabled={busy === invite.id} onClick={() => respond(invite, true)}>{s.accept}</ActionButton>
              <ActionButton variant="secondary" disabled={busy === invite.id} onClick={() => respond(invite, false)}>{s.decline}</ActionButton>
            </div>
          </Card>
        ))}
      </div>
      <ActionButton variant="secondary" className="mt-6 w-full" onClick={() => navigate("/home")}>{s.skip}</ActionButton>
    </div>
  );
}
