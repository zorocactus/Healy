import { useState, useEffect } from "react";
import { CreditCard, User, X, Check } from "lucide-react";
import StepBar from "./StepBar";
import { MEDICAL_STEPS } from "./MedicalForm";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

function UploadZone({ id, label, hint, file, error, onChange, onRemove, c, inputKey }) {
  const { t } = useLanguage();
  const fileName =
    file instanceof File ? file.name : typeof file === "string" ? file : null;

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
          key={inputKey}
          type="file"
          id={`med-${id}`}
          accept=".jpg,.jpeg,.png"
          onChange={onChange}
          className="hidden"
        />
        <div
          className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-all relative overflow-hidden"
          style={{
            borderColor: error ? "#f87171" : file ? c.blue : c.border,
            background: error
              ? "rgba(248,113,113,0.05)"
              : file
                ? `${c.blue}18`
                : c.uploadBg,
          }}
        >
          {file && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all z-10"
            >
              <X size={14} />
            </button>
          )}

          {!file ? (
            <label
              htmlFor={`med-${id}`}
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
            >
              {id === "profilePhoto" ? (
                <User
                  size={24}
                  strokeWidth={1.5}
                  className="mb-2"
                  style={{ color: error ? "#f87171" : c.iconMuted }}
                />
              ) : (
                <CreditCard
                  size={24}
                  strokeWidth={1.5}
                  className="mb-2"
                  style={{ color: error ? "#f87171" : c.iconMuted }}
                />
              )}
              <span
                className="font-semibold text-[13px] mb-0.5"
                style={{ color: c.txt2 }}
              >
                {hint}
              </span>
              <span className="text-[11px]" style={{ color: c.txt3 }}>
                JPG, JPEG, PNG
              </span>
            </label>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 text-center">
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
                {t("auth.register.identity.added")}
              </span>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
    </div>
  );
}

export default function MedicalIdentityForm({ onComplete, onBack, savedData, serverErrors = {} }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const c = isDark
    ? {
        bg: "#0D1117",
        border: "rgba(255,255,255,0.15)",
        uploadBg: "rgba(255,255,255,0.04)",
        txt: "#FFFFFF",
        txt2: "rgba(255,255,255,0.6)",
        txt3: "rgba(255,255,255,0.35)",
        label: "rgba(255,255,255,0.7)",
        iconMuted: "rgba(255,255,255,0.3)",
        blue: "#638ECB",
        div: "rgba(255,255,255,0.12)",
        divTxt: "rgba(255,255,255,0.45)",
      }
    : {
        bg: "#F0F4F8",
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
      };

  const [files, setFiles] = useState({
    cinRecto: savedData?.cinRecto || null,
    cinVerso: savedData?.cinVerso || null,
    profilePhoto: savedData?.profilePhoto || null,
  });
  const [errors, setErrors] = useState({});
  const [inputKeys, setInputKeys] = useState({ cinRecto: 0, cinVerso: 0, profilePhoto: 0 });

  // Map backend field names to local field names and merge into errors state
  useEffect(() => {
    const fieldMap = { id_card_recto: "cinRecto", id_card_verso: "cinVerso", photo: "profilePhoto" };
    const mapped = {};
    Object.entries(serverErrors).forEach(([k, v]) => {
      const localKey = fieldMap[k];
      if (localKey) mapped[localKey] = Array.isArray(v) ? v[0] : v;
    });
    if (Object.keys(mapped).length > 0) setErrors((prev) => ({ ...prev, ...mapped }));
  }, [serverErrors]);

  const handleFile = (e, key) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [key]: e.target.files[0] }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleRemove = (key) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
    // Increment key to force input re-mount so a new file can be selected
    setInputKeys((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!files.cinRecto) newErrors.cinRecto = "Ce champ est obligatoire";
    if (!files.cinVerso) newErrors.cinVerso = "Ce champ est obligatoire";
    if (!files.profilePhoto) newErrors.profilePhoto = "Ce champ est obligatoire";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onComplete(files);
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="w-full max-w-[480px]">
        <StepBar steps={MEDICAL_STEPS} current={2} />

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: c.div }} />
          <span
            className="text-[12px] font-semibold tracking-wide uppercase"
            style={{ color: c.divTxt }}
          >
            Vérification d'identité
          </span>
          <div className="flex-1 h-px" style={{ background: c.div }} />
        </div>

        <p className="text-center text-[13px] mb-6" style={{ color: c.txt2 }}>
          Téléchargez vos documents d'identité pour valider votre compte.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <UploadZone
            id="cinRecto"
            label="CIN Recto"
            hint="CIN Recto"
            file={files.cinRecto}
            error={errors.cinRecto}
            onChange={(e) => handleFile(e, "cinRecto")}
            onRemove={() => handleRemove("cinRecto")}
            inputKey={inputKeys.cinRecto}
            c={c}
          />
          <UploadZone
            id="cinVerso"
            label="CIN Verso"
            hint="CIN Verso"
            file={files.cinVerso}
            error={errors.cinVerso}
            onChange={(e) => handleFile(e, "cinVerso")}
            onRemove={() => handleRemove("cinVerso")}
            inputKey={inputKeys.cinVerso}
            c={c}
          />
          <UploadZone
            id="profilePhoto"
            label="Photo de profil"
            hint="Photo de profil"
            file={files.profilePhoto}
            error={errors.profilePhoto}
            onChange={(e) => handleFile(e, "profilePhoto")}
            onRemove={() => handleRemove("profilePhoto")}
            inputKey={inputKeys.profilePhoto}
            c={c}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onBack(files)}
            className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "transparent",
              borderColor: c.border,
              color: c.txt2,
            }}
          >
            ← Retour
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer hover:brightness-110"
            style={{ background: c.blue }}
          >
            Continuer →
          </button>
        </div>
      </div>

      {import.meta.env.DEV && (
        <button
          onClick={() => {
            const createDummy = (name) => {
              const b64 =
                "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
              const byteString = atob(b64);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++)
                ia[i] = byteString.charCodeAt(i);
              return new File([new Blob([ab], { type: "image/gif" })], name, {
                type: "image/gif",
              });
            };
            onComplete({
              cinRecto: createDummy("cin_recto.gif"),
              cinVerso: createDummy("cin_verso.gif"),
              profilePhoto: createDummy("photo.gif"),
            });
          }}
          className="fixed bottom-4 left-4 z-50 bg-black/80 text-[#8AAEE0] text-[10px] px-3 py-1.5 rounded border border-[#2A4A7F] hover:bg-[#173253] font-mono cursor-pointer"
        >
          DEV: Auto-Fill
        </button>
      )}
    </div>
  );
}

