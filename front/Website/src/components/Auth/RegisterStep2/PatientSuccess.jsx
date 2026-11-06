import { Clock } from "lucide-react";
import StepBar from "./StepBar";
import { PATIENT_STEPS } from "./PatientForm";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

export default function PatientSuccess({ onComplete }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const c = isDark ? {
    bg:          "#0D1117",
    txt:         "#FFFFFF",
    txt2:        "rgba(255,255,255,0.6)",
    txt3:        "rgba(255,255,255,0.35)",
    blue:        "#638ECB",
    amber:       "#F0A500",
    amberBg:     "rgba(240,165,0,0.10)",
    amberBorder: "rgba(240,165,0,0.25)",
    div:         "rgba(255,255,255,0.12)",
    connLine:    "rgba(255,255,255,0.1)",
    green:       "#4CAF82",
  } : {
    bg:          "#F0F4F8",
    txt:         "#0D1B2E",
    txt2:        "#5A6E8A",
    txt3:        "#9AACBE",
    blue:        "#4A6FA5",
    amber:       "#E8A838",
    amberBg:     "#FFF8EC",
    amberBorder: "rgba(232,168,56,0.30)",
    div:         "#E4EAF5",
    connLine:    "#E4EAF5",
    green:       "#2D8C6F",
  };

  const steps = [
    { done: true,  title: t("auth.register.successSteps.registered"),      sub: t("auth.register.successSteps.justNow") },
    { done: true,  title: t("auth.register.successSteps.docsReceived"),    sub: t("auth.register.successSteps.underReview") },
    { done: false, title: t("auth.register.successSteps.adminValidation"), sub: t("auth.register.successSteps.delay") },
    { done: false, title: t("auth.register.successSteps.welcomeEmail"),    sub: t("auth.register.successSteps.thenLogin") },
  ];

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="w-full max-w-[480px]">
        <StepBar steps={PATIENT_STEPS} current={PATIENT_STEPS.length + 1} />

        {/* Icône attente */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2"
            style={{ background: c.amberBg, borderColor: c.amber }}
          >
            <Clock size={30} strokeWidth={2} style={{ color: c.amber }} />
          </div>
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: c.txt }}>
            {t("auth.register.successPatient.title")}
          </h3>
          <p className="text-center text-[13px] max-w-[360px]" style={{ color: c.txt2 }}>
            {t("auth.register.successPatient.desc")}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative pl-8 mb-8">
          <div className="absolute left-[7px] top-3 bottom-3 w-px" style={{ background: c.connLine }} />
          {steps.map((item, i) => (
            <div key={i} className="relative mb-5 last:mb-0">
              <div
                className="absolute -left-8 top-1 w-[14px] h-[14px] rounded-full flex items-center justify-center z-10"
                style={{
                  background:  item.done ? c.green : "transparent",
                  borderWidth: item.done ? 0 : 2,
                  borderStyle: "solid",
                  borderColor: item.done ? c.green : c.div,
                }}
              >
                {item.done && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <h4 className="text-[13px] font-semibold leading-tight mb-0.5" style={{ color: item.done ? c.txt : c.txt3 }}>
                {item.title}
              </h4>
              <p className="text-[12px]" style={{ color: c.txt3 }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div
          className="rounded-xl px-4 py-3 mb-6 text-[12px] leading-relaxed"
          style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: c.txt2 }}
        >
          {t("auth.register.successPatient.info")}
        </div>

        <button
          onClick={onComplete}
          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer hover:brightness-110"
          style={{ background: c.blue, boxShadow: `0 0 16px ${c.blue}50` }}
        >
          {t("auth.register.successPatient.btn")}
        </button>
      </div>
    </div>
  );
}

