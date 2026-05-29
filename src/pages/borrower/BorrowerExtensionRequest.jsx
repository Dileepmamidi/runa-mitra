import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Mic, Send } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { addUserRecord, uploadEvidence } from "../../services/firebaseService";
import { Card, SectionTitle } from "../../components/Card";
import { Field, TextArea, SelectInput, TextInput } from "../../components/FormControls";
import { ActionButton } from "../../components/ActionButton";

export function BorrowerExtensionRequest() {
  const [searchParams] = useSearchParams();
  const initialLoanId = searchParams.get("loanId") || "";
  
  const { user, borrowerLink, loans } = useApp();
  const navigate = useNavigate();
  
  const [loanId, setLoanId] = useState(initialLoanId);
  const [reason, setReason] = useState("");
  const [requestedDays, setRequestedDays] = useState("15");
  const [voiceFile, setVoiceFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeLoans = loans.filter(l => l.balance > 0);
  const selectedLoan = loans.find(l => l.id === loanId);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!loanId) return setError("Please select a loan.");
    if (!reason) return setError("Please provide a reason.");
    
    try {
      setLoading(true);
      let voiceUrl = "";
      
      if (voiceFile) {
        // Here we upload to the lender's storage bucket since the link contains lenderUid
        voiceUrl = await uploadEvidence(selectedLoan.lenderUid, voiceFile, ["extensions", selectedLoan._borrowerId]);
      }
      
      const requestData = {
        borrowerId: selectedLoan._borrowerId,
        loanId,
        reason,
        requestedDays: Number(requestedDays),
        voiceUrl,
        status: "pending",
        requestedAt: new Date()
      };

      // Save to lender's messages collection
      await addUserRecord(selectedLoan.lenderUid, "messages", { ...requestData, type: "extension_request" });
      
      setSuccess("మీ అభ్యర్థన పంపబడింది! (Request sent successfully!)");
      setTimeout(() => navigate("/home"), 2000);
      
    } catch (err) {
      console.error(err);
      setError("Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-3xl font-black text-slate-950 mb-6">సమయం కోరండి (Request Time)</h2>
      
      {error && <div className="mb-4 rounded-[8px] bg-red-50 p-4 font-bold text-red-600">{error}</div>}
      {success && <div className="mb-4 rounded-[8px] bg-leaf-50 p-4 font-bold text-leaf-700">{success}</div>}

      <Card>
        <SectionTitle title="గడువు పెంపు అభ్యర్థన (Extension Form)" />
        
        <div className="mt-4 grid gap-4">
          <Field label="ఏ రుణం కోసం? (Select Loan)">
            <SelectInput value={loanId} onChange={e => setLoanId(e.target.value)}>
              <option value="">Select a loan</option>
              {activeLoans.map(l => (
                <option key={l.id} value={l.id}>Principal: ₹{l.principal} (Due: {l.dueDate || "N/A"})</option>
              ))}
            </SelectInput>
          </Field>
          
          <Field label="ఎన్ని రోజులు కావాలి? (Requested Days)">
            <SelectInput value={requestedDays} onChange={e => setRequestedDays(e.target.value)}>
              <option value="7">1 వారం (1 Week)</option>
              <option value="15">15 రోజులు (15 Days)</option>
              <option value="30">1 నెల (1 Month)</option>
              <option value="60">2 నెలలు (2 Months)</option>
            </SelectInput>
          </Field>
          
          <Field label="కారణం ఏమిటి? (Reason for delay)">
            <TextArea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="ఉదాహరణకు: పంట రాలేదు, లేదా జీతం ఆలస్యం..." 
              rows={3} 
            />
          </Field>
          
          <Field label="వాయిస్ రికార్డ్ చేయండి (Voice Message) - Optional">
            <TextInput 
              type="file" 
              accept="audio/*" 
              capture="microphone" 
              onChange={e => setVoiceFile(e.target.files[0])} 
            />
          </Field>
          
          <ActionButton onClick={handleSubmit} disabled={loading || !loanId || !reason} className="mt-4 w-full h-14 text-lg">
            {loading ? "Sending..." : <><Send size={20} className="mr-2" /> అభ్యర్థన పంపండి (Send Request)</>}
          </ActionButton>
        </div>
      </Card>
    </div>
  );
}
