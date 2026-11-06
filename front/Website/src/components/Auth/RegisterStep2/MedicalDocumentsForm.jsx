import { useState } from "react";
import {
  Stethoscope,
  Pill,
  Users,
  X,
  Check,
  Plus,
  Trash2,
  Calendar,
  School,
  Award,
  FileText,
  Pencil,
} from "lucide-react";
import StepBar from "./StepBar";
import { MEDICAL_STEPS } from "./MedicalForm";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

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

function TextField({
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  c,
  icon: Icon,
  mask = false,
}) {
  const handleChange = (e) => {
    if (mask) {
      let v = e.target.value.replace(/\D/g, "");
      if (v.length > 8) v = v.substring(0, 8);
      let masked = v;
      if (v.length > 2) masked = v.substring(0, 2) + "/" + v.substring(2);
      if (v.length > 4) masked = masked.substring(0, 5) + "/" + v.substring(4);
      e.target.value = masked;
    }
    onChange(e);
  };

  return (
    <div className="space-y-1">
      <label
        className="text-[12px] font-medium block"
        style={{ color: c.label }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: c.iconMuted }}
          />
        )}
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={`w-full ${Icon ? "pl-9" : "px-3.5"} py-[10px] rounded-xl border-2 text-sm outline-none transition-all ${c.ph} ${error ? "border-red-400" : c.inputBorder}`}
          style={{ background: c.inputBg, color: c.txt }}
        />
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

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

export default function MedicalDocumentsForm({
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
        uploadBg: "rgba(255,255,255,0.04)",
        txt: "#FFFFFF",
        txt2: "rgba(255,255,255,0.7)",
        txt3: "rgba(255,255,255,0.35)",
        label: "rgba(255,255,255,0.7)",
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
        uploadBg: "transparent",
        txt: "#0D1B2E",
        txt2: "#5A6E8A",
        txt3: "#9AACBE",
        label: "#5A6E8A",
        iconMuted: "#9AACBE",
        blue: "#4A6FA5",
        div: "#E4EAF5",
        divTxt: "#9AACBE",
        ph: "placeholder-gray-400",
      };

  const config = ROLE_CONFIG[medicalRole] || ROLE_CONFIG["Médecin"];

  const [formData, setFormData] = useState({
    diplomas: savedData?.diplomas || [],
    criminalRecordFile: savedData?.criminalRecordFile || null,
    agreementFile: savedData?.agreementFile || null,
    orderNumber: savedData?.orderNumber || "",
  });

  const [showDiplomaForm, setShowDiplomaForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newDiploma, setNewDiploma] = useState({
    title: "",
    institution: "",
    date_obtained: "",
    specialization: "",
    file: null,
  });
  const [dipErrors, setDipErrors] = useState({});
  const [errors, setErrors] = useState({});

  const handleFile = (key) => (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((p) => ({ ...p, [key]: e.target.files[0] }));
      if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    }
  };

  const handleRemoveFile = (key) => {
    setFormData((p) => ({ ...p, [key]: null }));
  };

  const handleText = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleDiplomaChange = (e) => {
    const { name, value } = e.target;
    setNewDiploma((prev) => ({ ...prev, [name]: value }));
    if (dipErrors[name]) setDipErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDiplomaFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewDiploma((prev) => ({ ...prev, file: e.target.files[0] }));
      if (dipErrors.file) setDipErrors((prev) => ({ ...prev, file: "" }));
    }
  };

  const handleRemoveDiplomaFile = () => {
    setNewDiploma((prev) => ({ ...prev, file: null }));
  };

  const confirmDiploma = () => {
    const errs = {};
    if (!newDiploma.title.trim()) errs.title = t("auth.register.fieldRequired");
    if (!newDiploma.institution.trim())
      errs.institution = t("auth.register.fieldRequired");
    if (!newDiploma.date_obtained.trim())
      errs.date_obtained = t("auth.register.fieldRequired");
    if (!newDiploma.file) errs.file = t("auth.register.fieldRequired");

    if (Object.keys(errs).length > 0) {
      setDipErrors(errs);
      return;
    }

    if (editingId) {
      setFormData((prev) => ({
        ...prev,
        diplomas: prev.diplomas.map((d) =>
          d.id === editingId ? { ...newDiploma, id: editingId } : d,
        ),
      }));
      setEditingId(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        diplomas: [...prev.diplomas, { ...newDiploma, id: Date.now() }],
      }));
    }
    setNewDiploma({
      title: "",
      institution: "",
      date_obtained: "",
      specialization: "",
      file: null,
    });
    setShowDiplomaForm(false);
  };

  const editDiploma = (dip) => {
    setNewDiploma({ ...dip });
    setEditingId(dip.id);
    setShowDiplomaForm(true);
    setDipErrors({});
  };

  const removeDiploma = (id) => {
    setFormData((prev) => ({
      ...prev,
      diplomas: prev.diplomas.filter((d) => d.id !== id),
    }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (medicalRole === "Médecin" || medicalRole === "Garde-malade") {
      if (formData.diplomas.length === 0)
        newErrors.diplomas = "Veuillez ajouter au moins un diplôme";
    }

    if (medicalRole === "Garde-malade") {
      if (!formData.criminalRecordFile)
        newErrors.criminalRecordFile = t("auth.register.fieldRequired");
    } else if (medicalRole === "Pharmacien") {
      if (!formData.agreementFile)
        newErrors.agreementFile = t("auth.register.fieldRequired");
      if (!formData.orderNumber.trim())
        newErrors.orderNumber = t("auth.register.fieldRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onComplete({ ...formData, medicalRole });
  };

  const sectionTitle =
    medicalRole === "Pharmacien"
      ? t("auth.register.documents.agreementTitle")
      : t("auth.register.documents.title");

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="w-full max-w-[520px]">
        <StepBar steps={MEDICAL_STEPS} current={5} />

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

        <p className="text-center text-[13px] mb-6" style={{ color: c.txt2 }}>
          {sectionTitle}
        </p>

        {/* ══ DIPLÔMES (Médecin / Garde-malade) ═════════════════════════════════ */}
        {(medicalRole === "Médecin" || medicalRole === "Garde-malade") && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-bold" style={{ color: c.txt }}>
                Mes Diplômes
              </label>
              <button
                type="button"
                onClick={() => setShowDiplomaForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105"
                style={{ background: c.blue, color: "#fff" }}
              >
                <Plus size={14} /> Ajouter un diplôme
              </button>
            </div>

            {errors.diplomas && (
              <p className="text-[11px] text-red-400 text-center mb-2">
                {errors.diplomas}
              </p>
            )}

            {/* Liste des diplômes */}
            <div className="space-y-3">
              {formData.diplomas.map((dip) => (
                <div
                  key={dip.id}
                  className="relative group p-4 rounded-xl border-2 card-hover"
                  style={{ background: c.inputBg, borderColor: c.border }}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      type="button"
                      onClick={() => editDiploma(dip)}
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDiploma(dip.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${c.blue}15`, color: c.blue }}
                    >
                      <Award size={20} />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <h4
                        className="text-[14px] font-bold truncate"
                        style={{ color: c.txt }}
                      >
                        {dip.title}
                      </h4>
                      <p
                        className="text-[12px] flex items-center gap-1 mt-0.5"
                        style={{ color: c.txt2 }}
                      >
                        <School size={12} /> {dip.institution}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span
                          className="text-[11px] flex items-center gap-1"
                          style={{ color: c.txt3 }}
                        >
                          <Calendar size={11} /> {dip.date_obtained}
                        </span>
                        <span
                          className="text-[11px] flex items-center gap-1 truncate"
                          style={{ color: c.blue }}
                        >
                          <FileText size={11} />{" "}
                          {dip.file instanceof File ? dip.file.name : dip.file}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {formData.diplomas.length === 0 && !showDiplomaForm && (
                <div
                  className="py-8 text-center rounded-xl border-2 border-dashed"
                  style={{ borderColor: c.border, background: c.uploadBg }}
                >
                  <Award
                    size={32}
                    className="mx-auto mb-2 opacity-20"
                    style={{ color: c.txt3 }}
                  />
                  <p className="text-[13px]" style={{ color: c.txt3 }}>
                    Aucun diplôme ajouté pour le moment
                  </p>
                </div>
              )}
            </div>

            {/* Formulaire Inline */}
            {showDiplomaForm && (
              <div
                className="p-5 rounded-xl border-2 border-blue-400/30 animate-in fade-in slide-in-from-top-1 duration-100"
                style={{
                  background: isDark
                    ? "rgba(99,142,203,0.05)"
                    : "rgba(74,111,165,0.05)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-[14px] font-bold flex items-center gap-2"
                    style={{ color: c.blue }}
                  >
                    {editingId ? <Pencil size={16} /> : <Plus size={16} />}
                    {editingId ? "Modifier le diplôme" : "Nouveau diplôme"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiplomaForm(false);
                      setEditingId(null);
                      setNewDiploma({
                        title: "",
                        institution: "",
                        date_obtained: "",
                        specialization: "",
                        file: null,
                      });
                    }}
                    style={{ color: c.txt3 }}
                    className="hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="col-span-2">
                    <TextField
                      name="title"
                      label="Intitulé du diplôme"
                      placeholder="ex: Doctorat en Médecine"
                      value={newDiploma.title}
                      onChange={handleDiplomaChange}
                      error={dipErrors.title}
                      c={c}
                      icon={Award}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <TextField
                      name="institution"
                      label="Établissement / Université"
                      placeholder="ex: Université d'Alger"
                      value={newDiploma.institution}
                      onChange={handleDiplomaChange}
                      error={dipErrors.institution}
                      c={c}
                      icon={School}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <TextField
                      name="date_obtained"
                      label="Date d'obtention"
                      placeholder="JJ/MM/AAAA"
                      value={newDiploma.date_obtained}
                      onChange={handleDiplomaChange}
                      error={dipErrors.date_obtained}
                      c={c}
                      icon={Calendar}
                      mask
                    />
                  </div>
                  <div className="col-span-2">
                    <TextField
                      name="specialization"
                      label="Spécialisation (optionnel)"
                      placeholder="ex: Cardiologie"
                      value={newDiploma.specialization}
                      onChange={handleDiplomaChange}
                      c={c}
                      icon={Check}
                    />
                  </div>
                  <div className="col-span-2">
                    <UploadZone
                      id="dip-file"
                      label="Fichier justificatif (PDF ou JPG, 5MB max)"
                      value={newDiploma.file}
                      onChange={handleDiplomaFile}
                      onRemove={handleRemoveDiplomaFile}
                      error={dipErrors.file}
                      c={c}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={confirmDiploma}
                  className="w-full py-2.5 rounded-xl text-white text-[13px] font-bold shadow-lg hover:scale-[1.01] active:scale-95 transition-all duration-100"
                  style={{ background: c.blue }}
                >
                  {editingId
                    ? "Enregistrer les modifications"
                    : "Confirmer ce diplôme"}
                </button>
              </div>
            )}
          </div>
        )}

        {medicalRole === "Garde-malade" && (
          <div className="space-y-3 mb-6">
            <UploadZone
              id="doc-criminal"
              label={t("auth.register.documents.criminalRecord")}
              value={formData.criminalRecordFile}
              onChange={handleFile("criminalRecordFile")}
              onRemove={() => handleRemoveFile("criminalRecordFile")}
              error={
                errors.criminalRecordFile ||
                serverErrors?.criminal_record_scan?.[0]
              }
              c={c}
            />
          </div>
        )}

        {medicalRole === "Pharmacien" && (
          <div className="space-y-3 mb-6">
            <UploadZone
              id="doc-agreement"
              label={t("auth.register.documents.agreementScan")}
              value={formData.agreementFile}
              onChange={handleFile("agreementFile")}
              onRemove={() => handleRemoveFile("agreementFile")}
              error={errors.agreementFile || serverErrors?.agreement_scan?.[0]}
              c={c}
            />
            <TextField
              name="orderNumber"
              label={t("auth.register.activity.orderRegistration")}
              placeholder={t("auth.register.activity.registrationHint")}
              value={formData.orderNumber}
              onChange={handleText}
              error={
                errors.orderNumber ||
                serverErrors?.order_registration_number?.[0]
              }
              c={c}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onBack(formData)}
            className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-100 cursor-pointer active:scale-95"
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
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-100 cursor-pointer hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            disabled={showDiplomaForm}
            style={{ background: c.blue }}
          >
            {t("auth.register.activity.submit")}
          </button>
        </div>
      </div>

    </div>
  );
}

