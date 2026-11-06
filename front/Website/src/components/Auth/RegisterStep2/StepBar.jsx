import { Check } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

export default function StepBar({ steps, current }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const c = isDark ? {
    done:         "#4CAF82",
    active:       "#638ECB",
    futureBorder: "rgba(255,255,255,0.2)",
    futureTxt:    "rgba(255,255,255,0.3)",
    connDone:     "#4CAF82",
    connPending:  "rgba(255,255,255,0.12)",
    activeTxt:    "rgba(255,255,255,0.85)",
    doneTxt:      "#4CAF82",
  } : {
    done:         "#2D8C6F",
    active:       "#4A6FA5",
    futureBorder: "#D0DBF0",
    futureTxt:    "#9AACBE",
    connDone:     "#2D8C6F",
    connPending:  "#D0DBF0",
    activeTxt:    "#4A6FA5",
    doneTxt:      "#2D8C6F",
  };

  const compact = steps.length > 5;
  const colWidth = compact ? 56 : 64;
  const connectorWidth = compact ? 22 : 32;

  return (
    <div className="flex items-start justify-center mb-8">
      {steps.map((step, i) => {
        const idx      = i + 1;
        const isDone   = idx < current;
        const isActive = idx === current;
        return (
          <div key={i} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: colWidth }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all flex-shrink-0"
                style={{
                  background:  isDone ? c.done : isActive ? c.active : "transparent",
                  borderColor: isDone ? c.done : isActive ? c.active : c.futureBorder,
                  color:       isDone || isActive ? "#ffffff" : c.futureTxt,
                  boxShadow:   isActive ? `0 0 14px ${c.active}70` : "none",
                }}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : idx}
              </div>
              <span
                className="text-[10px] font-medium text-center leading-tight"
                style={{ color: isDone ? c.doneTxt : isActive ? c.activeTxt : c.futureTxt }}
              >
                {step.key ? t(step.key) : step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-[2px] mt-4 flex-shrink-0"
                style={{ width: connectorWidth, background: isDone ? c.connDone : c.connPending }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

