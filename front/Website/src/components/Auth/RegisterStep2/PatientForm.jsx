import PersonalInfoForm from "./PersonalInfoForm";

export const PATIENT_STEPS = [
  { key: "auth.register.steps.profile" },
  { key: "auth.register.steps.documents" },
  { key: "auth.register.steps.confirm" },
];

const DEV_DATA = {
  birthDate: "15/05/1990", sex: "Masculin", phone: "0555000000",
  idCardNumber: "10344567891", address: "12 Rue Didouche Mourad",
  postalCode: "16000", city: "Alger-Centre", wilaya: "Alger",
};

export default function PatientForm({ onComplete, onBack, savedData, serverErrors = {} }) {
  return (
    <PersonalInfoForm
      onComplete={onComplete}
      onBack={onBack}
      steps={PATIENT_STEPS}
      currentStep={1}
      devFillData={DEV_DATA}
      savedData={savedData}
      serverErrors={serverErrors}
    />
  );
}

