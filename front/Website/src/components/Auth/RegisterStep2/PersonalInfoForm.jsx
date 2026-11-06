import { useState, useEffect } from "react";
import { Phone, User, Home, ChevronDown } from "lucide-react";
import StepBar from "./StepBar";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

const SEXE_OPTIONS = ["Masculin", "Féminin"];
const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Inconnu",
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
  "Autre",
];

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
              className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border shadow-2xl z-50 py-1 max-h-52 overflow-y-auto"
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

function Field({ label, icon, error, children, c }) {
  return (
    <div className="space-y-1">
      <label
        className="text-[12px] font-medium block"
        style={{ color: c.label }}
      >
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: c.icon }}
          >
            {icon}
          </span>
        )}
        {children}
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

export default function PersonalInfoForm({
  onComplete,
  onBack,
  steps,
  currentStep,
  devFillData,
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
        txt: "#FFFFFF",
        txt2: "rgba(255,255,255,0.7)",
        txt3: "rgba(255,255,255,0.4)",
        icon: "rgba(255,255,255,0.4)",
        label: "rgba(255,255,255,0.7)",
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
        txt: "#0D1B2E",
        txt2: "#5A6E8A",
        txt3: "#9AACBE",
        icon: "#4A6FA5",
        label: "#5A6E8A",
        blue: "#4A6FA5",
        div: "#E4EAF5",
        divTxt: "#9AACBE",
        ph: "placeholder-[#9AACBE]",
      };

  const [formData, setFormData] = useState({
    birthDate: savedData?.birthDate || "",
    sex: savedData?.sex || "Masculin",
    phone: savedData?.phone || "",
    idCardNumber: savedData?.idCardNumber || "",
    address: savedData?.address || "",
    postalCode: savedData?.postalCode || "",
    city: savedData?.city || "",
    wilaya: savedData?.wilaya || "Alger",
    bloodGroup: savedData?.bloodGroup || "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fieldMap = {
      phone: 'phone', address: 'address', city: 'city', wilaya: 'wilaya',
      postal_code: 'postalCode', date_of_birth: 'birthDate', id_card_number: 'idCardNumber',
    };
    const mapped = {};
    Object.entries(serverErrors).forEach(([k, v]) => {
      const local = fieldMap[k];
      if (local) mapped[local] = Array.isArray(v) ? v[0] : v;
    });
    if (Object.keys(mapped).length > 0) setErrors(prev => ({ ...prev, ...mapped }));
  }, [serverErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-mask pour la date (JJ/MM/AAAA)
    if (name === "birthDate") {
      let v = value.replace(/\D/g, "");
      if (v.length > 8) v = v.substring(0, 8);

      let masked = v;
      if (v.length > 2) masked = v.substring(0, 2) + "/" + v.substring(2);
      if (v.length > 4) masked = masked.substring(0, 5) + "/" + v.substring(4);

      setFormData((prev) => ({ ...prev, birthDate: masked }));
      if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNumberChange = (e, field, maxLength) => {
    const onlyNumbers = e.target.value.replace(/\D/g, "");
    if (onlyNumbers.length <= maxLength) {
      setFormData((prev) => ({ ...prev, [field]: onlyNumbers }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = () => {
    // bloodGroup est optionnel (cf spec) — ne pas bloquer la suite du formulaire.
    const required = [
      "birthDate",
      "phone",
      "idCardNumber",
      "address",
      "postalCode",
      "city",
    ];
    const newErrors = {};
    required.forEach((f) => {
      if (!formData[f]?.trim()) newErrors[f] = t("auth.register.fieldRequired");
    });

    // Validation stricte de la date
    if (formData.birthDate) {
      const parts = formData.birthDate.split("/");
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        const dateObj = new Date(y, m - 1, d);
        const currentYear = new Date().getFullYear();

        const isValid =
          parts[2].length === 4 &&
          dateObj.getFullYear() === y &&
          dateObj.getMonth() === m - 1 &&
          dateObj.getDate() === d &&
          y >= 1900 &&
          y <= currentYear;

        if (!isValid) {
          newErrors.birthDate = t("auth.register.invalidDate");
        }
      } else {
        newErrors.birthDate = t("auth.register.invalidDate");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onComplete(formData);
  };

  // border dans className → focus: fonctionne correctement (pas de borderColor inline)
  const inputCls = (hasIcon, err) =>
    `w-full ${hasIcon ? "pl-9" : "pl-3.5"} pr-3.5 py-[10px] rounded-xl text-sm outline-none transition-all border-2 ${c.ph} ${err ? "border-red-400" : c.inputBorder}`;

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="w-full max-w-[480px]">
        {steps && <StepBar steps={steps} current={currentStep} />}

        {/* Section — Informations personnelles */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: c.div }} />
            <span
              className="text-[12px] font-semibold tracking-wide uppercase"
              style={{ color: c.divTxt }}
            >
              {t("auth.register.personalInfo.title")}
            </span>
            <div className="flex-1 h-px" style={{ background: c.div }} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field
              label={t("auth.register.personalInfo.birthDate")}
              error={errors.birthDate}
              c={c}
            >
              <input
                type="text"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                placeholder={t(
                  "auth.register.personalInfo.birthDatePlaceholder",
                )}
                maxLength={10}
                className={inputCls(false, errors.birthDate)}
                style={{ background: c.inputBg, color: c.txt }}
              />
            </Field>
            <CustomSelect
              label={t("auth.register.personalInfo.sex")}
              value={formData.sex}
              options={SEXE_OPTIONS}
              onSelect={(v) => handleField("sex", v)}
              error={errors.sex}
              c={c}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <CustomSelect
              label={t("auth.register.personalInfo.bloodGroup")}
              value={formData.bloodGroup}
              options={BLOOD_GROUPS}
              onSelect={(v) => handleField("bloodGroup", v)}
              placeholder={t("auth.register.personalInfo.selectBloodGroup")}
              error={errors.bloodGroup}
              c={c}
            />
            <Field
              label={t("auth.register.personalInfo.nationalId")}
              icon={<User size={14} />}
              error={errors.idCardNumber}
              c={c}
            >
              <input
                type="text"
                name="idCardNumber"
                placeholder={t("auth.register.personalInfo.nationalIdHint")}
                value={formData.idCardNumber}
                onChange={(e) => handleNumberChange(e, "idCardNumber", 18)}
                className={inputCls(true, errors.idCardNumber)}
                style={{ background: c.inputBg, color: c.txt }}
              />
            </Field>
          </div>

          <div className="mb-3">
            <Field
              label={t("auth.register.personalInfo.phone")}
              icon={<Phone size={14} />}
              error={errors.phone}
              c={c}
            >
              <input
                type="text"
                name="phone"
                placeholder={t("auth.register.personalInfo.phonePlaceholder")}
                value={formData.phone}
                onChange={(e) => handleNumberChange(e, "phone", 10)}
                className={inputCls(true, errors.phone)}
                style={{ background: c.inputBg, color: c.txt }}
              />
            </Field>
          </div>
        </div>

        {/* Section — Adresse */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: c.div }} />
            <span
              className="text-[12px] font-semibold tracking-wide uppercase"
              style={{ color: c.divTxt }}
            >
              {t("auth.register.personalInfo.residentialAddress")}
            </span>
            <div className="flex-1 h-px" style={{ background: c.div }} />
          </div>

          <div className="space-y-3">
            <Field
              label={t("auth.register.personalInfo.address")}
              icon={<Home size={14} />}
              error={errors.address}
              c={c}
            >
              <input
                type="text"
                name="address"
                placeholder={t("auth.register.personalInfo.streetHint")}
                value={formData.address}
                onChange={handleChange}
                className={inputCls(true, errors.address)}
                style={{ background: c.inputBg, color: c.txt }}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t("auth.register.personalInfo.postalCode")}
                error={errors.postalCode}
                c={c}
              >
                <input
                  type="text"
                  name="postalCode"
                  placeholder={t("auth.register.personalInfo.postalCodeHint")}
                  value={formData.postalCode}
                  onChange={(e) => handleNumberChange(e, "postalCode", 5)}
                  className={inputCls(false, errors.postalCode)}
                  style={{ background: c.inputBg, color: c.txt }}
                />
              </Field>
              <Field
                label={t("auth.register.personalInfo.city")}
                error={errors.city}
                c={c}
              >
                <input
                  type="text"
                  name="city"
                  placeholder={t("auth.register.personalInfo.cityHint")}
                  value={formData.city}
                  onChange={handleChange}
                  className={inputCls(false, errors.city)}
                  style={{ background: c.inputBg, color: c.txt }}
                />
              </Field>
            </div>

            <CustomSelect
              label={t("auth.register.personalInfo.wilaya")}
              value={formData.wilaya}
              options={WILAYAS}
              onSelect={(v) => handleField("wilaya", v)}
              c={c}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
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

