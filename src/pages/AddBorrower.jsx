import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, UserPlus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { addUserRecord, uploadEvidence, createBorrowerLink } from "../services/firebaseService";
import { loanLabelsCopy } from "../components/LoanBreakdown.copy";
import { BottomAction, Button, Card, Field, FilePicker, Input, Notice, Screen, Section, Select, TextArea } from "../ui";
import { addBorrowerCopy, borrowerFormCopy } from "./AddBorrower.copy";

export const emptyBorrowerForm = {
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
  familyContact: "",
  notes: ""
};

export const OCCUPATIONS = ["Farmer", "Employee", "Shopkeeper", "Business", "Daily wage", "Other"];

// 10 digits, optionally written with +91 / 91 / 0 in front.
export function isValidMobile(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(local);
}

/** Form fields shared by Add and Edit borrower. */
export function BorrowerForm({ formData, onChange, photoFile, onPhoto, mobileLocked }) {
  const f = useCopy(borrowerFormCopy);
  const labels = useCopy(loanLabelsCopy);
  const opt = (label) => `${label} (${f.optional})`;
  return (
    <>
      <Section title={f.basics}>
        <Card className="grid gap-4">
          <Field label={f.name}>
            <Input name="name" value={formData.name} onChange={onChange} placeholder={f.namePlaceholder} autoComplete="off" />
          </Field>
          <Field label={f.mobile} hint={mobileLocked ? f.mobileLocked : f.mobileHint}>
            <Input name="mobile" value={formData.mobile} onChange={onChange} inputMode="tel" readOnly={mobileLocked} disabled={mobileLocked} placeholder="98765 43210" />
          </Field>
          <Field label={f.village}>
            <Input name="village" value={formData.village} onChange={onChange} />
          </Field>
          <Field label={f.occupation}>
            <Select name="occupation" value={formData.occupation} onChange={onChange}>
              {OCCUPATIONS.map((o) => <option key={o} value={o}>{labels.occupations[o]}</option>)}
            </Select>
          </Field>
          <Field label={opt(f.fatherName)}>
            <Input name="fatherName" value={formData.fatherName} onChange={onChange} />
          </Field>
          <Field label={opt(f.whatsapp)}>
            <Input name="whatsapp" value={formData.whatsapp} onChange={onChange} inputMode="tel" />
          </Field>
          <Field label={opt(f.address)}>
            <TextArea name="address" value={formData.address} onChange={onChange} placeholder={f.addressPlaceholder} />
          </Field>
          <FilePicker label={f.photo} accept="image/*" icon={Camera} file={photoFile} onChange={onPhoto} placeholder={f.photoPick} />
        </Card>
      </Section>

      <Section title={f.contacts}>
        <Card className="grid gap-4">
          <Field label={opt(f.nomineeName)}><Input name="nomineeName" value={formData.nomineeName} onChange={onChange} /></Field>
          <Field label={opt(f.nomineeMobile)}><Input name="nomineeMobile" value={formData.nomineeMobile} onChange={onChange} inputMode="tel" /></Field>
          <Field label={opt(f.guarantorName)}><Input name="guarantorName" value={formData.guarantorName} onChange={onChange} /></Field>
          <Field label={opt(f.guarantorMobile)}><Input name="guarantorMobile" value={formData.guarantorMobile} onChange={onChange} inputMode="tel" /></Field>
          <Field label={opt(f.familyContact)}><Input name="familyContact" value={formData.familyContact} onChange={onChange} inputMode="tel" /></Field>
        </Card>
      </Section>

      <Section title={f.notes}>
        <Card>
          <Field hint={f.notesHint}>
            <TextArea name="notes" value={formData.notes} onChange={onChange} />
          </Field>
        </Card>
      </Section>
    </>
  );
}

export function AddBorrower() {
  const { user, lender, refreshData } = useApp();
  const s = useCopy(addBorrowerCopy);
  const f = useCopy(borrowerFormCopy);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(emptyBorrowerForm);
  const [photoFile, setPhotoFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    if (!formData.name.trim() || !formData.mobile.trim()) return setError(f.errRequired);
    if (!isValidMobile(formData.mobile)) return setError(f.errMobile);
    if (!user) return setError(f.errLogin);

    try {
      setLoading(true);
      let photoUrl = "";
      if (photoFile) photoUrl = await uploadEvidence(user.uid, photoFile);

      const borrowerData = {
        ...formData,
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        photoUrl,
        status: "active",
        pendingAmount: 0,
        createdAt: new Date()
      };
      const docRef = await addUserRecord(user.uid, "borrowers", borrowerData);

      // Invitation so the borrower can see their loans after signing in with this phone.
      await createBorrowerLink(borrowerData.mobile, user.uid, docRef.id, { lenderName: lender.name, borrowerName: borrowerData.name });

      await refreshData();
      navigate(`/borrowers/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError(s.saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title={s.title} subtitle={s.subtitle} back>
      <BorrowerForm formData={formData} onChange={handleChange} photoFile={photoFile} onPhoto={setPhotoFile} />
      {error && <Notice tone="error">{error}</Notice>}
      <BottomAction>
        <Button size="lg" block icon={UserPlus} onClick={handleSave} loading={loading}>
          {loading ? s.saving : s.save}
        </Button>
      </BottomAction>
    </Screen>
  );
}
