import React, { useMemo } from "react";
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// ─── Theme tokens (matching DoctorDashboard.jsx) ────────────────────────────
const T = {
  light: {
    bg: "#F0F4F8",
    card: "#ffffff",
    nav: "#ffffff",
    border: "#E4EAF5",
    txt: "#0D1B2E",
    txt2: "#5A6E8A",
    txt3: "#9AACBE",
    blue: "#4A6FA5",
    blueLight: "#EEF3FB",
    green: "#2D8C6F",
    amber: "#E8A838",
    red: "#E05555",
    purple: "#7B5EA7",
  },
  dark: {
    bg: "#0D1117",
    card: "#141B27",
    nav: "#141B27",
    border: "rgba(99,142,203,0.15)",
    txt: "#F0F3FA",
    txt2: "#8AAEE0",
    txt3: "#4A6080",
    blue: "#638ECB",
    blueLight: "#1A2333",
    green: "#4CAF82",
    amber: "#F0A500",
    red: "#E05555",
    purple: "#9B7FD4",
  },
};

/**
 * WeekCalendar Component
 */
const WeekCalendar = ({
  selectedDate = new Date(),
  onDateChange = () => {},
  appointmentCounts = {},
  weeklySchedules = [],
  view = "week",
  onViewChange = () => {},
  headerRight = null,
}) => {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;

  // Grid logic
  const currentStart = useMemo(() => {
    if (view === "month") return startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 });
    return startOfWeek(selectedDate, { weekStartsOn: 0 });
  }, [selectedDate, view]);

  const days = useMemo(() => {
    if (view === "month") {
      return Array.from({ length: 35 }).map((_, i) => addDays(currentStart, i));
    }
    const end = endOfWeek(currentStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: currentStart, end });
  }, [currentStart, view]);

  const navLabel = useMemo(() => format(selectedDate, "MMMM yyyy"), [selectedDate]);

  const handlePrev = () => {
    if (view === "month") onDateChange(subMonths(selectedDate, 1));
    else onDateChange(subWeeks(selectedDate, 1));
  };

  const handleNext = () => {
    if (view === "month") onDateChange(addMonths(selectedDate, 1));
    else onDateChange(addWeeks(selectedDate, 1));
  };

  const handleToday = () => onDateChange(startOfToday());

  const getDayName = (day) => {
    const names = { Sun: "DIM", Mon: "LUN", Tue: "MAR", Wed: "MER", Thu: "JEU", Fri: "VEN", Sat: "SAM" };
    return names[format(day, "eee")] || format(day, "eee").toUpperCase();
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          {/* View Toggle */}
          <div 
            className="flex p-1 rounded-xl shadow-inner border transition-all"
            style={{ background: c.bg, borderColor: c.border }}
          >
            <button
              onClick={() => onViewChange("week")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === "week" ? "shadow-sm border" : "text-gray-500 opacity-60 hover:opacity-100"
              }`}
              style={{
                background: view === "week" ? c.card : "transparent",
                borderColor: view === "week" ? c.border : "transparent",
                color: view === "week" ? c.blue : "inherit",
              }}
            >
              Semaine
            </button>
            <button
              onClick={() => onViewChange("month")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === "month" ? "shadow-sm border" : "text-gray-500 opacity-60 hover:opacity-100"
              }`}
              style={{
                background: view === "month" ? c.card : "transparent",
                borderColor: view === "month" ? c.border : "transparent",
                color: view === "month" ? c.blue : "inherit",
              }}
            >
              Mois
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            style={{ color: "#6492C9", borderColor: "#6492C933", background: c.card }}
          >
            <span className="text-lg leading-none">↩</span> Today
          </button>
        </div>

        {headerRight && (
          <div className="flex items-center gap-2">
            {headerRight}
          </div>
        )}
      </div>

      {/* 2. CALENDAR CARD */}
      <div
        className="rounded-2xl p-4 shadow-sm border transition-all duration-300"
        style={{ background: c.card, borderColor: c.border }}
      >
        <div className="flex justify-center mb-4 text-xs font-bold uppercase tracking-widest opacity-40" style={{ color: c.txt2 }}>
          {navLabel}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className={`w-10 flex items-center justify-center rounded-xl transition-all hover:bg-opacity-10 ${view === "month" ? "h-32" : "h-20"}`}
            style={{ color: c.txt3, background: c.bg + "22" }}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          <div className="flex-1 grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrToday = isToday(day);
              const isCurrentMonthDay = format(day, "MMM") === format(selectedDate, "MMM");
              const count = appointmentCounts[format(day, "yyyy-MM-dd")] || 0;
              // 0=Sun..6=Sat → convert to 0=Mon..6=Sun (backend convention)
              const dayOfWeek = (day.getDay() + 6) % 7;
              const schedule = weeklySchedules.find(s => s.day_of_week === dayOfWeek && s.is_active);

              return (
                <button
                  key={idx}
                  onClick={() => onDateChange(day)}
                  className={`flex flex-col items-center px-1 py-3 rounded-xl transition-all min-w-[50px] ${view === "month" && !isCurrentMonthDay ? "opacity-30 scale-95" : ""}`}
                  style={{
                    background: isSelected ? "#6492C9" : "transparent",
                    boxShadow: isSelected ? `0 4px 12px #6492C944` : "none",
                  }}
                >
                  <span className="text-[10px] sm:text-[11px] font-bold mb-1 uppercase tracking-wider transition-colors" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : c.txt3 }}>
                    {getDayName(day)}
                  </span>
                  <span className={`text-[16px] sm:text-[20px] font-black transition-colors ${isCurrToday && !isSelected ? "text-[#6492C9]" : ""}`} style={{ color: isSelected ? "#fff" : isCurrToday ? "#6492C9" : c.txt }}>
                    {format(day, "d")}
                  </span>
                  {schedule ? (
                    <span className="text-[9px] sm:text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-full" style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "#6492C918", color: isSelected ? "#fff" : "#6492C9" }}>
                      {schedule.start_time?.slice(0,5)}–{schedule.end_time?.slice(0,5)}
                    </span>
                  ) : (
                    <span className={`text-[9px] sm:text-[10px] font-bold mt-1 transition-opacity ${count === 0 ? "opacity-20" : "opacity-100 uppercase"}`} style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "#3DAA73" }}>
                      {count > 0 ? `${count} rdv` : "—"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className={`w-10 flex items-center justify-center rounded-xl transition-all hover:bg-opacity-10 ${view === "month" ? "h-32" : "h-20"}`}
            style={{ color: c.txt3, background: c.bg + "22" }}
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

WeekCalendar.displayName = "WeekCalendar";

export default WeekCalendar;
