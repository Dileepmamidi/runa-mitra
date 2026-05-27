import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Field, SelectInput, TextInput } from "../components/FormControls";

export function ProfileSetup() {
  const navigate = useNavigate();
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <h1 className="text-3xl font-black text-slate-950">లెండర్ వివరాలు</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">మీ పుస్తకం ఎవరిదో గుర్తించడానికి.</p>
      <div className="mt-6 rounded-[8px] bg-white p-5 shadow-soft">
        <button className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
          <Camera size={30} />
        </button>
        <div className="grid gap-4">
          <Field label="Lender name"><TextInput placeholder="రాములు గారు" /></Field>
          <Field label="Village / town"><TextInput placeholder="పెద్దపల్లి" /></Field>
          <Field label="Business type">
            <SelectInput defaultValue="Shopkeeper">
              <option>Farmer</option>
              <option>Shopkeeper</option>
              <option>Small finance provider</option>
              <option>Personal lender</option>
            </SelectInput>
          </Field>
          <Field label="Preferred language">
            <SelectInput defaultValue="Telugu">
              <option>Telugu</option>
              <option>English</option>
            </SelectInput>
          </Field>
          <ActionButton onClick={() => navigate("/home")}>Start Loan Notebook</ActionButton>
        </div>
      </div>
    </main>
  );
}
