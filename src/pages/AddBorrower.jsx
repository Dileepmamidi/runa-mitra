import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormControls";
import { useApp } from "../context/AppContext";
import { addUserRecord, uploadEvidence, createBorrowerLink } from "../services/firebaseService";

export function AddBorrower() {
  const { user, refreshData } = useApp();
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
      setError("You must be logged in to add a borrower.");
      return;
    }

    try {
      setLoading(true);
      let photoUrl = "";

      // 1. Upload photo if provided
      if (photoFile) {
        photoUrl = await uploadEvidence(user.uid, photoFile);
      }

      // 2. Save borrower data
      const borrowerData = {
        ...formData,
        photoUrl,
        status: "active",
        pendingAmount: 0,
        createdAt: new Date() // Firestore timestamp will be created server-side, but this sets a local timestamp initially
      };

      const docRef = await addUserRecord(user.uid, "borrowers", borrowerData);
      
      // 2b. Create borrower link for role-based login
      await createBorrowerLink(formData.mobile, user.uid, docRef.id);
      
      // 3. Refresh context and navigate
      await refreshData();
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Failed to save borrower. Check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">అప్పుదారు జోడించండి</h1>
      
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
          <Field label="Mobile">
            <TextInput name="mobile" value={formData.mobile} onChange={handleChange} inputMode="numeric" placeholder="Mobile number" />
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
          <Field label="Photo (Opens Camera)">
            {/* The 'capture="environment"' attribute allows mobile phones to open the camera directly */}
            <TextInput 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={(e) => setPhotoFile(e.target.files[0])} 
            />
          </Field>
        </div>
        <ActionButton 
          className="mt-5 w-full" 
          onClick={handleSave} 
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Borrower"}
        </ActionButton>
      </Card>
    </div>
  );
}
