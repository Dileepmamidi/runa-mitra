import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Download, Eye, Upload } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card, SectionTitle } from "../components/Card";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { useApp } from "../context/AppContext";
import { addUserRecord, uploadEvidence, listUserCollection } from "../services/firebaseService";
import { useEffect } from "react";

export function DocumentsEvidence() {
  const { user, borrowers } = useApp();
  const [borrowerId, setBorrowerId] = useState(borrowers[0]?.id || "");
  const [category, setCategory] = useState("Handwritten note");
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [evidences, setEvidences] = useState([]);

  const docs = ["Handwritten note", "Borrower photo", "Voice promise", "ID proof", "Aadhaar verification", "Land document", "Gold photo"];

  useEffect(() => {
    if (user && borrowerId) {
      listUserCollection(user.uid, "evidence").then((allEvidences) => {
        setEvidences(allEvidences.filter(e => e.borrowerId === borrowerId));
      });
    }
  }, [user, borrowerId]);

  const handleUpload = async () => {
    setError("");
    setSuccess("");
    if (!user) return setError("Must be logged in.");
    if (!borrowerId) return setError("Please select a borrower.");
    if (!file) return setError("Please select a file to upload.");

    try {
      setLoading(true);
      const fileUrl = await uploadEvidence(user.uid, file, ["evidence", borrowerId]);
      
      const evidenceData = {
        borrowerId,
        category,
        fileUrl,
        fileName: file.name,
        uploadedAt: new Date(),
      };

      await addUserRecord(user.uid, "evidence", evidenceData);
      setSuccess("File uploaded securely!");
      
      // Refresh local list
      const updatedList = await listUserCollection(user.uid, "evidence");
      setEvidences(updatedList.filter(e => e.borrowerId === borrowerId));
      
      // Reset file input
      setFile(null);
      // document.getElementById("fileInput").value = "";
    } catch (err) {
      console.error(err);
      setError("Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Documents & Evidence</h1>
      
      <Link
        to="/aadhaar-verification"
        className="mt-4 flex min-h-16 items-center justify-between gap-3 rounded-[8px] bg-leaf-600 p-4 font-bold text-white shadow-soft"
      >
        <span className="flex items-center gap-3"><BadgeCheck size={22} /> Aadhaar Verification</span>
        <span className="text-sm text-leaf-100">Optional</span>
      </Link>
      
      {error && <div className="mt-4 rounded-[6px] bg-red-50 p-3 text-sm font-bold text-red-600">{error}</div>}
      {success && <div className="mt-4 rounded-[6px] bg-leaf-50 p-3 text-sm font-bold text-leaf-700">{success}</div>}

      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Borrower">
            <SelectInput value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}>
              <option value="">Select Borrower</option>
              {borrowers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Category">
            <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
              {docs.map((d) => <option key={d}>{d}</option>)}
            </SelectInput>
          </Field>
          <Field label="Scan/Upload file (Camera)">
            <TextInput 
              id="fileInput"
              type="file" 
              capture="environment"
              onChange={(e) => setFile(e.target.files[0])} 
            />
          </Field>
        </div>
        <ActionButton className="mt-4" onClick={handleUpload} disabled={loading || !file}>
          <Upload size={18} /> {loading ? "Uploading..." : "Upload securely"}
        </ActionButton>
      </Card>
      
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {evidences.length === 0 ? (
          <p className="py-4 text-sm font-bold text-slate-400">No documents uploaded for this borrower yet.</p>
        ) : (
          evidences.map((doc) => (
            <Card key={doc.id}>
              <SectionTitle title={doc.category} />
              <p className="text-sm font-semibold text-slate-500 truncate">{doc.fileName}</p>
              <div className="mt-3 flex gap-2">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200">
                  <Eye size={16} className="mr-2" /> View
                </a>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
