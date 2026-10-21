import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { saveUserProfile, uploadEvidence } from "../services/firebaseService";
import { Avatar, BottomAction, Button, Card, Field, FilePicker, Input, Notice, Screen, Segmented, Select } from "../ui";
import { profileSetupCopy } from "./ProfileSetup.copy";

const BUSINESS_TYPES = ["Money Lender", "Personal lender", "Farmer", "Shopkeeper", "Small finance provider"];

// Older versions stored "Telugu"/"English"; the app uses "te"/"en".
const toLangCode = (value, fallback) => (value === "English" || value === "en" ? "en" : value === "Telugu" || value === "te" ? "te" : fallback);

export function ProfileSetup() {
  const navigate = useNavigate();
  const { user, lender, language, setLanguage, refreshData } = useApp();
  const s = useCopy(profileSetupCopy);
  const isEdit = Boolean(lender.name);

  const [formData, setFormData] = useState({
    name: "",
    village: "",
    businessType: "Money Lender",
    preferredLanguage: language
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (lender.name) {
      setFormData({
        name: lender.name,
        village: lender.village || "",
        businessType: lender.businessType || "Money Lender",
        preferredLanguage: toLangCode(lender.preferredLanguage, language)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lender.name, lender.village, lender.businessType, lender.preferredLanguage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const chooseLanguage = (code) => {
    setFormData((prev) => ({ ...prev, preferredLanguage: code }));
    setLanguage(code);
  };

  const handleSave = async () => {
    if (!user) return;
    setError("");
    if (!formData.name.trim()) return setError(s.errName);
    try {
      setLoading(true);
      let photoUrl = lender.photoUrl || "";
      if (photoFile) photoUrl = await uploadEvidence(user.uid, photoFile, ["profile"]);
      await saveUserProfile(user.uid, { ...formData, name: formData.name.trim(), photoUrl });
      await refreshData();
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError(s.saveError);
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = photoFile ? URL.createObjectURL(photoFile) : lender.photoUrl;
  const businessTypes = BUSINESS_TYPES.includes(formData.businessType) ? BUSINESS_TYPES : [...BUSINESS_TYPES, formData.businessType];

  return (
    <Screen title={isEdit ? s.titleEdit : s.titleNew} subtitle={isEdit ? s.subtitleEdit : s.subtitleNew} back={isEdit ? "/profile" : undefined}>
      <Card className="grid gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={formData.name} src={previewUrl || undefined} size={72} />
          <div className="min-w-0 flex-1">
            <FilePicker label={s.photo} accept="image/*" icon={Camera} file={photoFile} onChange={setPhotoFile} placeholder={s.photoPick} />
          </div>
        </div>
        <Field label={s.name}>
          <Input name="name" value={formData.name} onChange={handleChange} placeholder={s.namePlaceholder} />
        </Field>
        <Field label={s.village}>
          <Input name="village" value={formData.village} onChange={handleChange} />
        </Field>
        <Field label={s.businessType}>
          <Select name="businessType" value={formData.businessType} onChange={handleChange}>
            {businessTypes.map((b) => <option key={b} value={b}>{s.businessTypes[b] || b}</option>)}
          </Select>
        </Field>
        <div>
          <p className="mb-1.5 text-[15px] font-bold text-ink">{s.language}</p>
          <Segmented
            value={formData.preferredLanguage}
            onChange={chooseLanguage}
            options={[{ value: "te", label: "తెలుగు" }, { value: "en", label: "English" }]}
          />
        </div>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      <BottomAction>
        <Button size="lg" block icon={Save} onClick={handleSave} loading={loading}>{loading ? s.saving : s.save}</Button>
      </BottomAction>
    </Screen>
  );
}
