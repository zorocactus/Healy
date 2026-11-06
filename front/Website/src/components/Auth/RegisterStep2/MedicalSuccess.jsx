import { Check } from "lucide-react";
import StepBar from "./StepBar";
import { MEDICAL_STEPS } from "./MedicalForm";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

export default function MedicalSuccess({ onComplete }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const c = isDark ? {
    bg:       "#0D1117",
    txt:      "#FFFFFF",
    txt2:     "rgba(255,255,255,0.6)",
    txt3:     "rgba(255,255,255,0.35)",
    blue:     "#638ECB",
    green:    "#4CAF82",
    div:      "rgba(255,255,255,0.12)",
    connLine: "rgba(255,255,255,0.1)",
    futBorder:"rgba(255,255,255,0.2)",
  } : {
    bg:       "#F0F4F8",
    txt:      "#0D1B2E",
    txt2:     "#5A6E8A",
    txt3:     "#9AACBE",
    blue:     "#4A6FA5",
    green:    "#2D8C6F",
    div:      "#E4EAF5",
    connLine: "#E4EAF5",
    futBorder:"#D0DBF0",
  };

  const timeline = [
    { done: true,  active: false, title: t('auth.register.successSteps.docSubmitted'),  sub: t('auth.register.successSteps.justNow') },
    { done: false, active: true,  title: t('auth.register.successSteps.verifying'),     sub: t('auth.register.successSteps.teamReviewing') },
    { done: false, active: false, title: t('auth.register.successSteps.approved'),      sub: t('auth.register.successSteps.notifByEmail') },
    { done: false, active: false, title: t('auth.register.successSteps.fullAccess'),    sub: t('auth.register.successSteps.welcomeMS') },
  ];

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="w-full max-w-[480px]">

        <StepBar steps={MEDICAL_STEPS} current={MEDICAL_STEPS.length + 1} />

        {/* Icône succès */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2"
            style={{ background: `${c.blue}20`, borderColor: c.blue }}>
            <Check size={32} strokeWidth={3} style={{ color: c.blue }} />
          </div>
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: c.txt }}>
            {t('auth.register.successMedical.title')}
          </h3>
          <p className="text-center text-[13px] max-w-[380px]" style={{ color: c.txt2 }}>
            {t('auth.register.successMedical.descFull', { hours: t('auth.register.successMedical.hours') })}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative pl-8 mb-8">
          <div className="absolute left-[7px] top-3 bottom-3 w-px" style={{ background: c.connLine }} />
          {timeline.map((item, i) => (
            <div key={i} className="relative mb-5 last:mb-0">
              <div
                className="absolute -left-8 top-1 w-[14px] h-[14px] rounded-full flex items-center justify-center z-10"
                style={{
                  background:  item.done ? c.green : item.active ? c.blue : "transparent",
                  borderWidth: item.done || item.active ? 0 : 2,
                  borderStyle: "solid",
                  borderColor: c.futBorder,
                }}
              >
                {item.done && <Check size={8} className="text-white" strokeWidth={3} />}
              </div>
              <h4 className="text-[13px] font-semibold leading-tight mb-0.5"
                style={{ color: item.done || item.active ? c.txt : c.txt3 }}>
                {item.title}
              </h4>
              <p className="text-[12px]" style={{ color: c.txt3 }}>{item.sub}</p>
            </div>
          ))}
        </div>

        <button onClick={onComplete}
          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer hover:brightness-110"
          style={{ background: c.blue, boxShadow: `0 0 16px ${c.blue}50` }}>
          {t('auth.register.successMedical.btn')}
        </button>

      </div>
    </div>
  );
}

