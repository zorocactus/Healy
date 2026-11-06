import { useState } from "react";
import {
  Check,
  ChevronDown,
  Stethoscope,
  Pill,
  Users,
  Link as LinkIcon,
  X,
} from "lucide-react";
import StepBar from "./StepBar";
import { MEDICAL_STEPS } from "./MedicalForm";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

function CustomSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = "Sélectionner...",
  error,
  c,
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-1">
      <label
        className="text-[12px] font-medium block"
        style={{ color: c.label }}
      >
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3.5 py-[10px] rounded-xl border-2 text-sm transition-all outline-none"
          style={{
            background: c.inputBg,
            borderColor: error ? "#f87171" : c.border,
          }}
        >
          <span style={{ color: value ? c.txt : c.txt3 }}>
            {value || placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            style={{ color: c.icon }}
          />
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-2xl z-50 py-1 max-h-52 overflow-y-auto"
              style={{ background: c.dropdown, borderColor: c.border }}
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm text-left transition-all"
                  style={{
                    color: value === opt ? c.blue : c.txt2,
                    background: value === opt ? c.inputBg : "transparent",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function TextField({
  name,
  label,
  placeholder,
  value,
  onChange,
  onFieldChange,
  error,
  numeric,
  maxLen,
  suffix,
  c,
}) {
  return (
    <div className="space-y-1">
      <label
        className="text-[12px] font-medium block"
        style={{ color: c.label }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode={numeric ? "numeric" : "text"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={
            numeric
              ? (e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (!maxLen || v.length <= maxLen) onFieldChange(name, v);
                }
              : onChange
          }
          className={`w-full px-3.5 ${suffix ? "pr-12" : "pr-3.5"} py-[10px] rounded-xl border-2 text-sm outline-none transition-all ${c.ph} ${error ? "border-red-400" : c.inputBorder}`}
          style={{ background: c.inputBg, color: c.txt }}
        />
        {suffix && (
          <span
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold pointer-events-none"
            style={{ color: c.icon }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function UploadZone({ id, label, value, onChange, onRemove, error, c }) {
  const { t } = useLanguage();
  const fileName =
    value instanceof File
      ? value.name
      : typeof value === "string"
        ? value
        : null;

  return (
    <div className="space-y-1">
      <label
        className="text-[12px] font-medium block"
        style={{ color: c.label }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="file"
          id={id}
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={onChange}
          className="hidden"
        />
        <div
          className="flex flex-col items-center justify-center w-full min-h-[90px] rounded-xl border-2 border-dashed transition-all relative overflow-hidden"
          style={{
            borderColor: error ? "#f87171" : value ? c.blue : c.border,
            background: error
              ? "rgba(248,113,113,0.05)"
              : value
                ? `${c.blue}18`
                : c.uploadBg,
          }}
        >
          {value && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all z-10"
            >
              <X size={14} />
            </button>
          )}

          {!value ? (
            <label
              htmlFor={id}
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer py-4"
            >
              <div
                className="w-7 h-7 rounded border flex items-center justify-center mb-1.5"
                style={{ borderColor: c.border, background: c.inputBg }}
              >
                <span
                  className="font-bold text-base"
                  style={{ color: c.iconMuted }}
                >
                  +
                </span>
              </div>
              <span
                className="font-semibold text-[13px] mb-0.5"
                style={{ color: c.txt2 }}
              >
                {t("auth.register.activity.uploadDoc")}
              </span>
              <span className="text-[11px]" style={{ color: c.txt3 }}>
                {t("auth.register.activity.filesHint")}
              </span>
            </label>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 text-center py-4">
              <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-2">
                <Check size={18} />
              </div>
              <span
                className="text-[12px] font-medium truncate max-w-full"
                style={{ color: c.blue }}
              >
                {fileName}
              </span>
              <span className="text-[10px] mt-1" style={{ color: c.txt3 }}>
                {t("auth.register.activity.documentAdded")}
              </span>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
    </div>
  );
}

function MapsInput({ label, value, onChange, placeholder, error, c }) {
  return (
    <div className="space-y-1">
      <label
        className="text-[12px] font-medium block"
        style={{ color: c.label }}
      >
        {label}
      </label>
      <div className="relative">
        <div
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: c.icon }}
        >
          <LinkIcon size={14} />
        </div>
        <input
          type="url"
          placeholder={placeholder || "https://maps.google.com/..."}
          value={value}
          onChange={onChange}
          className={`w-full pl-9 pr-3.5 py-[10px] rounded-xl border-2 outline-none text-sm transition-all ${c.ph} ${error ? "border-red-400" : c.inputBorder}`}
          style={{ background: c.inputBg, color: c.txt }}
        />
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

const SPECIALITES = [
  "Généraliste",
  "Cardiologue",
  "Dermatologue",
  "Gynécologue",
  "Neurologue",
  "Ophtalmologue",
  "Orthopédiste",
  "Pédiatre",
  "Psychiatre",
  "Radiologue",
  "Rhumatologue",
  "Urologue",
  "Endocrinologue",
  "Gastro-entérologue",
];

const QUALIFICATIONS_GM = [
  "Infirmier(ère) diplômé(e) d'État",
  "Aide-soignant(e)",
  "Garde-malade certifié(e)",
  "Auxiliaire de vie",
  "Infirmier(ère) spécialisé(e)",
  "Assistant(e) médical(e)",
];

const WILAYAS = [
  "Alger",
  "Oran",
  "Constantine",
  "Annaba",
  "Blida",
  "Batna",
  "Sétif",
  "Tlemcen",
  "Tizi Ouzou",
  "Béjaïa",
  "Jijel",
  "Médéa",
  "Mostaganem",
  "Bouira",
  "Bordj Bou Arréridj",
  "Boumerdès",
  "Tipaza",
  "Aïn Defla",
  "Tissemsilt",
  "Relizane",
  "Chlef",
  "Skikda",
  "Guelma",
  "Souk Ahras",
  "El Tarf",
  "Mila",
  "Khenchela",
  "Oum El Bouaghi",
  "Tébessa",
  "Biskra",
  "Djelfa",
  "Laghouat",
  "El Bayadh",
  "Naâma",
  "Saïda",
  "Mascara",
  "Tiaret",
  "Adrar",
  "Béchar",
  "Tamanrasset",
  "Illizi",
  "Tindouf",
  "El Oued",
  "Ouargla",
  "Ghardaïa",
  "Aïn Témouchent",
  "Sidi Bel Abbès",
  "Autres",
];

const ROLE_CONFIG = {
  Médecin: {
    icon: <Stethoscope size={16} />,
    color: "#638ECB",
    title: "Médecin",
  },
  Pharmacien: {
    icon: <Pill size={16} />,
    color: "#4CAF82",
    title: "Pharmacien",
  },
  "Garde-malade": {
    icon: <Users size={16} />,
    color: "#9B7FD4",
    title: "Garde-Malade",
  },
};

export default function MedicalInfoForm({
  onComplete,
  onBack,
  medicalRole = "Médecin",
  savedData,
  serverErrors = {},
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const c = isDark
    ? {
        bg: "#0D1117",
        inputBg: "rgba(255,255,255,0.08)",
        inputBorder: "border-white/15 focus:border-[#638ECB]",
        border: "rgba(255,255,255,0.15)",
        dropdown: "#0A1220",
        uploadBg: "rgba(255,255,255,0.04)",
        txt: "#FFFFFF",
        txt2: "rgba(255,255,255,0.7)",
        txt3: "rgba(255,255,255,0.35)",
        label: "rgba(255,255,255,0.7)",
        icon: "rgba(255,255,255,0.4)",
        iconMuted: "rgba(255,255,255,0.3)",
        blue: "#638ECB",
        div: "rgba(255,255,255,0.12)",
        divTxt: "rgba(255,255,255,0.45)",
        ph: "placeholder-white/40",
      }
    : {
        bg: "#F0F4F8",
        inputBg: "#ffffff",
        inputBorder: "border-[#E4EAF5] focus:border-[#4A6FA5]",
        border: "#E4EAF5",
        dropdown: "#ffffff",
        uploadBg: "transparent",
        txt: "#0D1B2E",
        txt2: "#5A6E8A",
        txt3: "#9AACBE",
        label: "#5A6E8A",
        icon: "#4A6FA5",
        iconMuted: "#9AACBE",
        blue: "#4A6FA5",
        div: "#E4EAF5",
        divTxt: "#9AACBE",
        ph: "placeholder-gray-400",
      };

  const config = ROLE_CONFIG[medicalRole] || ROLE_CONFIG["Médecin"];

  const [formData, setFormData] = useState({
    specialite: savedData?.specialite || "",
    nInscription: savedData?.nInscription || "",
    cabinetName: savedData?.cabinetName || "",
    mapsUrl: savedData?.mapsUrl || "",
    pharmacyName: savedData?.pharmacyName || "",
    agrement: savedData?.agrement || "",
    pharmacyMapsUrl: savedData?.pharmacyMapsUrl || "",
    qualification: savedData?.qualification || "",
    experienceYears: savedData?.experienceYears || "",
    tarifSoin: savedData?.tarifSoin || "",
    wilaya: savedData?.wilaya || "Alger",
    cnas: savedData?.cnas || "Oui",
    docFile: savedData?.docFile || null,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (medicalRole === "Médecin") {
      if (!formData.specialite)
        newErrors.specialite = t("auth.register.fieldRequired");
      if (!formData.nInscription.trim())
        newErrors.nInscription = t("auth.register.fieldRequired");
      if (!formData.cabinetName.trim())
        newErrors.cabinetName = t("auth.register.fieldRequired");
      if (!formData.experienceYears.trim())
        newErrors.experienceYears = t("auth.register.fieldRequired");
      if (!formData.mapsUrl.trim()) {
        newErrors.mapsUrl = t("auth.register.fieldRequired");
      } else if (!/^https?:\/\/(www\.)?(maps\.google\.com|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/.test(formData.mapsUrl.trim())) {
        newErrors.mapsUrl = "Veuillez entrer une URL Google Maps valide (ex: https://maps.google.com/...)";
      }
      if (!formData.docFile)
        newErrors.docFile = t("auth.register.fieldRequired");
    } else if (medicalRole === "Pharmacien") {
      if (!formData.pharmacyName.trim())
        newErrors.pharmacyName = t("auth.register.fieldRequired");
      if (!formData.agrement.trim())
        newErrors.agrement = t("auth.register.fieldRequired");
      if (!formData.pharmacyMapsUrl.trim()) {
        newErrors.pharmacyMapsUrl = t("auth.register.fieldRequired");
      } else if (!/^https?:\/\/(www\.)?(maps\.google\.com|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/.test(formData.pharmacyMapsUrl.trim())) {
        newErrors.pharmacyMapsUrl = "Veuillez entrer une URL Google Maps valide (ex: https://maps.google.com/...)";
      }
      if (!formData.docFile)
        newErrors.docFile = t("auth.register.fieldRequired");
    } else if (medicalRole === "Garde-malade") {
      if (!formData.qualification)
        newErrors.qualification = t("auth.register.fieldRequired");
      if (!formData.experienceYears.trim())
        newErrors.experienceYears = t("auth.register.fieldRequired");
      if (!formData.tarifSoin.trim())
        newErrors.tarifSoin = t("auth.register.fieldRequired");
      if (!formData.wilaya) newErrors.wilaya = t("auth.register.fieldRequired");
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const result = { ...formData, medicalRole };
    if (medicalRole !== "Garde-malade") delete result.wilaya;
    onComplete(result);
  };

  const handleDevFill = () => {
    const f = new File([""], "dev.pdf", { type: "application/pdf" });
    const d =
      medicalRole === "Médecin"
        ? {
            specialite: "Cardiologue",
            nInscription: "161234",
            cabinetName: "Cabinet Dr. Dev",
            experienceYears: "5",
            mapsUrl: "https://maps.google.com/?q=Alger",
            cnas: "Oui",
            docFile: f,
          }
        : medicalRole === "Pharmacien"
          ? {
              pharmacyName: "Pharmacie Dev",
              agrement: "20241001",
              pharmacyMapsUrl: "https://maps.google.com/?q=Alger",
              cnas: "Oui",
              docFile: f,
            }
          : {
              qualification: "Infirmier(ère) diplômé(e) d'État",
              experienceYears: "5",
              tarifSoin: "2000",
              wilaya: "Alger",
              cnas: "Oui",
            };
    onComplete({ ...d, medicalRole });
  };

  const docChangeHandler = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((p) => ({ ...p, docFile: e.target.files[0] }));
      if (errors.docFile) setErrors((p) => ({ ...p, docFile: "" }));
    }
  };

  const handleRemoveDoc = () => {
    setFormData((p) => ({ ...p, docFile: null }));
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="w-full max-w-[480px]">
        <StepBar steps={MEDICAL_STEPS} current={4} />

        {/* Badge rôle */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: c.div }} />
          <div
            className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide uppercase"
            style={{ color: config.color }}
          >
            {config.icon} {config.title}
          </div>
          <div className="flex-1 h-px" style={{ background: c.div }} />
        </div>

        {/* ══ MÉDECIN ══════════════════════════════════════════════════════════ */}
        {medicalRole === "Médecin" && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="col-span-2">
              <CustomSelect
                label={t("auth.register.activity.medicalSpecialty")}
                value={formData.specialite}
                options={SPECIALITES}
                onSelect={(v) => handleField("specialite", v)}
                error={errors.specialite || serverErrors?.specialty?.[0]}
                c={c}
              />
            </div>
            <TextField
              name="nInscription"
              label={t("auth.register.activity.orderRegistration")}
              placeholder={t("auth.register.activity.registrationHint")}
              value={formData.nInscription}
              onChange={handleChange}
              onFieldChange={handleField}
              numeric
              maxLen={10}
              error={errors.nInscription || serverErrors?.order_number?.[0]}
              c={c}
            />
            <TextField
              name="cabinetName"
              label={t("auth.register.activity.clinicName")}
              placeholder={t("auth.register.activity.clinicNameHint")}
              value={formData.cabinetName}
              onChange={handleChange}
              onFieldChange={handleField}
              error={errors.cabinetName || serverErrors?.clinic_name?.[0]}
              c={c}
            />
            <TextField
              name="experienceYears"
              label={t("auth.register.activity.experienceYears")}
              placeholder={t("auth.register.activity.experienceHint")}
              value={formData.experienceYears}
              onChange={handleChange}
              onFieldChange={handleField}
              numeric
              maxLen={2}
              suffix="ans"
              error={
                errors.experienceYears || serverErrors?.experience_years?.[0]
              }
              c={c}
            />
            <MapsInput
              label={t("auth.register.activity.googleMaps")}
              value={formData.mapsUrl}
              onChange={(e) => handleField("mapsUrl", e.target.value)}
              error={errors.mapsUrl}
              c={c}
            />
            <div className="col-span-2">
              <UploadZone
                id="autorisationFile"
                label={t("auth.register.activity.exerciseAuth")}
                value={formData.docFile}
                onChange={docChangeHandler}
                onRemove={handleRemoveDoc}
                error={
                  errors.docFile || serverErrors?.practice_authorization?.[0]
                }
                c={c}
              />
            </div>
          </div>
        )}

        {/* ══ PHARMACIEN ═══════════════════════════════════════════════════════ */}
        {medicalRole === "Pharmacien" && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <TextField
              name="pharmacyName"
              label={t("auth.register.activity.pharmacyName")}
              placeholder={t("auth.register.activity.pharmacyNameHint")}
              value={formData.pharmacyName}
              onChange={handleChange}
              onFieldChange={handleField}
              error={errors.pharmacyName || serverErrors?.name?.[0]}
              c={c}
            />
            <TextField
              name="agrement"
              label={t("auth.register.activity.nationalAgreement")}
              placeholder={t("auth.register.activity.pharmacyLicenseHint")}
              value={formData.agrement}
              onChange={handleChange}
              onFieldChange={handleField}
              numeric
              maxLen={12}
              error={errors.agrement || serverErrors?.agreement_number?.[0]}
              c={c}
            />
            <div className="col-span-2">
              <MapsInput
                label={t("auth.register.activity.googleMaps")}
                value={formData.pharmacyMapsUrl}
                onChange={(e) => handleField("pharmacyMapsUrl", e.target.value)}
                error={errors.pharmacyMapsUrl}
                c={c}
              />
            </div>
            <div className="col-span-2">
              <UploadZone
                id="registreFile"
                label={t("auth.register.activity.tradeRegister")}
                value={formData.docFile}
                onChange={docChangeHandler}
                onRemove={handleRemoveDoc}
                error={errors.docFile || serverErrors?.registre_commerce?.[0]}
                c={c}
              />
            </div>
          </div>
        )}

        {/* ══ GARDE-MALADE ═════════════════════════════════════════════════════ */}
        {medicalRole === "Garde-malade" && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="col-span-2">
              <CustomSelect
                label={t("auth.register.activity.qualification")}
                value={formData.qualification}
                options={QUALIFICATIONS_GM}
                onSelect={(v) => handleField("qualification", v)}
                error={errors.qualification}
                c={c}
              />
            </div>
            <TextField
              name="experienceYears"
              label={t("auth.register.activity.experienceYears")}
              placeholder={t("auth.register.activity.experienceHint")}
              value={formData.experienceYears}
              onChange={handleChange}
              onFieldChange={handleField}
              numeric
              maxLen={2}
              suffix="ans"
              error={
                errors.experienceYears || serverErrors?.experience_years?.[0]
              }
              c={c}
            />
            <TextField
              name="tarifSoin"
              label={t("auth.register.activity.careRate")}
              placeholder={t("auth.register.activity.rateHint")}
              value={formData.tarifSoin}
              onChange={handleChange}
              onFieldChange={handleField}
              numeric
              maxLen={6}
              suffix="DZD"
              error={errors.tarifSoin || serverErrors?.tarif_de_base?.[0]}
              c={c}
            />
            <div className="col-span-2">
              <CustomSelect
                label={t("auth.register.activity.interventionZone")}
                value={formData.wilaya}
                options={WILAYAS}
                onSelect={(v) => handleField("wilaya", v)}
                placeholder={t("auth.register.personalInfo.wilayaHint")}
                error={errors.wilaya || serverErrors?.availability_area?.[0]}
                c={c}
              />
            </div>
          </div>
        )}

        {/* CNAS */}
        <div className="flex flex-col items-center mb-6">
          <span
            className="text-[12px] font-semibold mb-3 uppercase tracking-wide"
            style={{ color: c.divTxt }}
          >
            {t("auth.register.activity.cnasConvention")}
          </span>
          <div className="flex items-center gap-6">
            {["Oui", "Non"].map((val) => (
              <label
                key={val}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleField("cnas", val)}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: formData.cnas === val ? c.blue : c.border,
                  }}
                >
                  {formData.cnas === val && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: c.blue }}
                    />
                  )}
                </div>
                <span
                  className="text-sm"
                  style={{
                    color: formData.cnas === val ? c.txt : c.txt2,
                    fontWeight: formData.cnas === val ? 500 : 400,
                  }}
                >
                  {val}
                </span>
                <input
                  type="radio"
                  name="cnas"
                  value={val}
                  checked={formData.cnas === val}
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onBack(formData)}
            className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "transparent",
              borderColor: c.border,
              color: c.txt2,
            }}
          >
            {t("auth.register.back")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer hover:brightness-110"
            style={{ background: c.blue }}
          >
            {t("auth.register.continue")}
          </button>
        </div>
      </div>

    </div>
  );
}

