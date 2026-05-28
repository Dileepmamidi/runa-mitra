import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Field, SelectInput, TextInput } from "../components/FormControls";
import { useApp } from "../context/AppContext";
import { saveUserProfile, uploadEvidence } from "../services/firebaseService";

export function ProfileSetup() {
  const navigate = useNavigate();
  const { user, lender, refreshData } = useApp();
  
  const [formData, setFormData] = useState({
    name: "",
    village: "",
    businessType: "Money Lender",
    preferredLanguage: "Telugu"
  });
  const [photoFile, setPhotoFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If the lender object is already populated, fill the form
    if (lender.name) {
      setFormData({
        name: lender.name,
        village: lender.village || "",
        businessType: lender.businessType || "Money Lender",
        preferredLanguage: lender.preferredLanguage || "Telugu"
      });
    }
  }, [lender]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setError("");
    
    if (!formData.name) {
      return setError("Name is required.");
    }
    
    try {
      setLoading(true);
      
      let photoUrl = lender.photoUrl || "";
      if (photoFile) {
        photoUrl = await uploadEvidence(user.uid, photoFile, ["profile"]);
      }
      
      await saveUserProfile(user.uid, {
        ...formData,
        photoUrl
      });
      
      await refreshData();
      navigate("/home");
      
    } catch (err) {
      console.error(err);
      setError("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = photoFile ? URL.createObjectURL(photoFile) : lender.photoUrl;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8 md:ml-56">
      <h1 className="text-3xl font-black text-slate-950">
        {lender.name ? "Edit Profile" : "లెండర్ వివరాలు (Setup)"}
      </h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        {lender.name ? "Update your personal and business details." : "మీ పుస్తకం ఎవరిదో గుర్తించడానికి."}
      </p>
      
      {error && <div className="mt-4 rounded-[6px] bg-red-50 p-3 text-sm font-bold text-red-600">{error}</div>}

      <div className="mt-6 rounded-[8px] bg-white p-5 shadow-soft">
        <label className="mb-5 flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-leaf-100 text-leaf-700 relative group">
          {previewUrl ? (
            <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <Camera size={30} />
          )}
          <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white">
            <Camera size={24} />
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={e => setPhotoFile(e.target.files[0])} 
          />
        </label>
        
        <div className="grid gap-4">
          <Field label="Lender Name">
            <TextInput name="name" value={formData.name} onChange={handleChange} placeholder="రాములు గారు" />
          </Field>
          
          <Field label="Village / Town / Address">
            <TextInput name="village" value={formData.village} onChange={handleChange} placeholder="పెద్దపల్లి" />
          </Field>
          
          <Field label="Profession / Business type">
            <SelectInput name="businessType" value={formData.businessType} onChange={handleChange}>
              <option>Farmer</option>
              <option>Shopkeeper</option>
              <option>Small finance provider</option>
              <option>Personal lender</option>
              <option>Money Lender</option>
            </SelectInput>
          </Field>
          
          <Field label="Preferred language">
            <SelectInput name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange}>
              <option>Telugu</option>
              <option>English</option>
            </SelectInput>
          </Field>
          
          <ActionButton onClick={handleSave} disabled={loading} className="mt-4">
            {loading ? "Saving..." : <><Save size={18} className="mr-2" /> Save Profile</>}
          </ActionButton>
        </div>
      </div>
    </main>
  );
}
