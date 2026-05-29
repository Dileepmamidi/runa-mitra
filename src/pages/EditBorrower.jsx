import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormControls";
import { useApp } from "../context/AppContext";
import { updateUserRecord, uploadEvidence, deleteUserRecord, createBorrowerLink } from "../services/firebaseService";

export function EditBorrower() {
  const { id } = useParams();
  const { user, borrowers, loans, refreshData } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    mobile: "",
    whatsapp: "",
    village: "",
    occupation: "Farmer",
    address: "",
    nomineeName: "",
    nomineeMobile: "",
    guarantorName: "",
    guarantorMobile: "",
    familyContact: ""
  });

  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    const borrower = borrowers.find(b => b.id === id);
    if (borrower) {
      setFormData({
        name: borrower.name || "",
        fatherName: borrower.fatherName || "",
        mobile: borrower.mobile || "",
        whatsapp: borrower.whatsapp || "",
        village: borrower.village || "",
        occupation: borrower.occupation || "Farmer",
        address: borrower.address || "",
        nomineeName: borrower.nomineeName || "",
        nomineeMobile: borrower.nomineeMobile || "",
        guarantorName: borrower.guarantorName || "",
        guarantorMobile: borrower.guarantorMobile || "",
        familyContact: borrower.familyContact || ""
      });
    }
  }, [id, borrowers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    if (!formData.name || !formData.mobile) {
      setError("Name and Mobile are required.");
      return;
    }
    if (!user) {
      setError("You must be logged in to edit a borrower.");
      return;
    }

    try {
      setLoading(true);
      let updates = { ...formData };

      // 1. Upload photo if provided
      if (photoFile) {
        updates.photoUrl = await uploadEvidence(user.uid, photoFile);
      }

      // 2. Update borrower data
      await updateUserRecord(user.uid, "borrowers", id, updates);
      
      // Note: We sync the link here to heal any broken multi-lender links automatically.
      if (formData.mobile) {
        await createBorrowerLink(formData.mobile, user.uid, id);
      }

      await refreshData();
      navigate(`/borrowers/${id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to update borrower. Check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    // Check if borrower has active loans
    const borrowerLoans = loans.filter(l => l.borrowerId === id);
    const activeBalance = borrowerLoans.reduce((sum, l) => sum + l.balance, 0);
    
    if (activeBalance > 0) {
      alert(`Cannot delete! This borrower still owes ${activeBalance}. Please clear their loans first.`);
      return;
    }
    
    if (!window.confirm("Are you sure you want to completely delete this borrower? This cannot be undone.")) return;
    
    try {
      setLoading(true);
      await deleteUserRecord(user.uid, "borrowers", id);
      await refreshData();
      navigate("/borrowers");
    } catch (err) {
      console.error(err);
      setError("Failed to delete borrower.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">అప్పుదారు సవరించండి (Edit Borrower)</h1>
      
      {error && (
        <div className="mt-4 rounded-[6px] bg-red-50 p-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <TextInput name="name" value={formData.name} onChange={handleChange} placeholder="Borrower name" />
          </Field>
          <Field label="Father name">
            <TextInput name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Father name" />
          </Field>
          <Field label="Mobile (Cannot change login mobile)">
            <TextInput name="mobile" value={formData.mobile} onChange={handleChange} inputMode="numeric" placeholder="Mobile number" readOnly className="bg-slate-50 cursor-not-allowed text-slate-500" />
          </Field>
          <Field label="WhatsApp">
            <TextInput name="whatsapp" value={formData.whatsapp} onChange={handleChange} inputMode="numeric" placeholder="WhatsApp number" />
          </Field>
          <Field label="Village">
            <TextInput name="village" value={formData.village} onChange={handleChange} placeholder="Village" />
          </Field>
          <Field label="Occupation">
            <SelectInput name="occupation" value={formData.occupation} onChange={handleChange}>
              <option>Farmer</option>
              <option>Employee</option>
              <option>Shopkeeper</option>
              <option>Business</option>
              <option>Daily wage</option>
              <option>Other</option>
            </SelectInput>
          </Field>
          <Field label="Address">
            <TextArea name="address" value={formData.address} onChange={handleChange} placeholder="Street, landmark, village" />
          </Field>
          <Field label="Nominee name">
            <TextInput name="nomineeName" value={formData.nomineeName} onChange={handleChange} placeholder="Nominee name" />
          </Field>
          <Field label="Nominee mobile">
            <TextInput name="nomineeMobile" value={formData.nomineeMobile} onChange={handleChange} inputMode="numeric" placeholder="Nominee mobile number" />
          </Field>
          <Field label="Guarantor name optional">
            <TextInput name="guarantorName" value={formData.guarantorName} onChange={handleChange} placeholder="Guarantor name" />
          </Field>
          <Field label="Guarantor mobile optional">
            <TextInput name="guarantorMobile" value={formData.guarantorMobile} onChange={handleChange} inputMode="numeric" placeholder="Guarantor mobile number" />
          </Field>
          <Field label="Family contact mobile">
            <TextInput name="familyContact" value={formData.familyContact} onChange={handleChange} inputMode="numeric" placeholder="Emergency family mobile" />
          </Field>
          <Field label="Update Photo (Opens Camera)">
            <TextInput 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={(e) => setPhotoFile(e.target.files[0])} 
            />
          </Field>
        </div>
        <div className="mt-5 flex gap-2 w-full">
          <ActionButton 
            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-0" 
            onClick={handleDelete} 
            disabled={loading}
          >
            Delete
          </ActionButton>
          <ActionButton 
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(`/borrowers/${id}`)}
          >
            Cancel
          </ActionButton>
          <ActionButton 
            className="flex-1" 
            onClick={handleSave} 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </ActionButton>
        </div>
      </Card>
    </div>
  );
}
