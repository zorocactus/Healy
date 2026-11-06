import PersonalInfoForm from "./PersonalInfoForm";

export const MEDICAL_STEPS = [
  { key: "auth.register.steps.profile" },
  { key: "auth.register.steps.identity" },
  { key: "auth.register.steps.role" },
  { key: "auth.register.steps.activity" },
  { key: "auth.register.steps.documents" },
  { key: "auth.register.steps.confirm" },
];

const DEV_DATA = {
  birthDate: "1985-03-20", sex: "Masculin", phone: "0555000001",
  idCardNumber: "10344567891", address: "24 Rue Ben M'hidi",
  postalCode: "16000", city: "Alger-Centre", wilaya: "Alger",
};

export default function MedicalForm({ onComplete, onBack, savedData, serverErrors = {} }) {
  return (
    <PersonalInfoForm
      onComplete={onComplete}
      onBack={onBack}
      steps={MEDICAL_STEPS}
      currentStep={1}
      devFillData={DEV_DATA}
      savedData={savedData}
      serverErrors={serverErrors}
    />
  );
}

