import { useState } from "react";
import { Check, Stethoscope, Users, Pill } from "lucide-react";
import StepBar from "./StepBar";
import { MEDICAL_STEPS } from "./MedicalForm";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

const ROLE_KEYS = [
  {
    id: "Médecin",
    icon: <Stethoscope size={26} />,
    descKey: "auth.register.role.doctorDesc",
  },
  {
    id: "Garde-malade",
    icon: <Users size={26} />,
    descKey: "auth.register.role.caretakerDesc",
  },
  {
    id: "Pharmacien",
    icon: <Pill size={26} />,
    descKey: "auth.register.role.pharmacistDesc",
  },
];

export default function MedicalRoleForm({ onComplete, onBack, savedData }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const c = isDark
    ? {
        bg: "#0D1117",
        border: "rgba(255,255,255,0.15)",
        txt: "#FFFFFF",
        txt2: "rgba(255,255,255,0.7)",
        txt3: "rgba(255,255,255,0.35)",
        blue: "#638ECB",
        div: "rgba(255,255,255,0.12)",
        divTxt: "rgba(255,255,255,0.45)",
        // cartes
        cardIdleBg: "rgba(255,255,255,0.05)",
        cardSelBg: "rgba(100,146,203,0.15)",
        cardSelBorder: "#638ECB",
        iconIdleBg: "rgba(255,255,255,0.08)",
        iconIdleColor: "rgba(255,255,255,0.4)",
        iconSelBg: "#638ECB",
        iconSelColor: "#FFFFFF",
      }
    : {
        bg: "#F0F4F8",
        border: "#E4EAF5",
        txt: "#0D1B2E",
        txt2: "#5A6E8A",
        txt3: "#9AACBE",
        blue: "#4A6FA5",
        div: "#E4EAF5",
        divTxt: "#9AACBE",
        cardIdleBg: "#ffffff",
        cardSelBg: "#EEF3FB",
        cardSelBorder: "#4A6FA5",
        iconIdleBg: "#E4EAF5",
        iconIdleColor: "#9AACBE",
        iconSelBg: "#4A6FA5",
        iconSelColor: "#FFFFFF",
      };

  const [medicalRole, setMedicalRole] = useState(
    savedData?.medicalRole || "Médecin",
  );

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="w-full max-w-[480px]">
        <StepBar steps={MEDICAL_STEPS} current={3} />

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: c.div }} />
          <span
            className="text-[12px] font-semibold tracking-wide uppercase"
            style={{ color: c.divTxt }}
          >
            {t("auth.register.role.title")}
          </span>
          <div className="flex-1 h-px" style={{ background: c.div }} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {ROLE_KEYS.map(({ id, icon, descKey }) => {
            const isSelected = medicalRole === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMedicalRole(id)}
                className={`flex flex-col items-center justify-center py-5 px-3 rounded-xl border-2 cursor-pointer transition-all duration-100 active:scale-95 ${!isSelected ? 'card-hover' : ''}`}
                style={{
                  background: isSelected ? c.cardSelBg : c.cardIdleBg,
                  borderColor: isSelected ? c.cardSelBorder : c.border,
                  boxShadow: isSelected ? `0 0 18px ${c.blue}30` : "none",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all"
                  style={{
                    background: isSelected ? c.iconSelBg : c.iconIdleBg,
                    color: isSelected ? c.iconSelColor : c.iconIdleColor,
                  }}
                >
                  {icon}
                </div>
                <span
                  className="font-bold text-[13px] mb-1"
                  style={{ color: isSelected ? c.txt : c.txt2 }}
                >
                  {id}
                </span>
                <span
                  className="text-[11px] text-center leading-tight"
                  style={{ color: isSelected ? c.txt2 : c.txt3 }}
                >
                  {t(descKey)}
                </span>
                {isSelected && (
                  <div
                    className="mt-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: c.blue }}
                  >
                    <Check size={11} strokeWidth={3} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onBack({ medicalRole })}
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
            onClick={() => onComplete({ medicalRole })}
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

