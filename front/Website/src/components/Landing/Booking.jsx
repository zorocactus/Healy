import { useEffect, useRef, useState } from "react";

const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const CALENDAR = [
  [{ d: 24, other: true }, { d: 25, other: true }, { d: 26, other: true }, { d: 27, other: true }, { d: 28, other: true }, { d: 1, wkend: true, other: true }, { d: 2, wkend: true, other: true }],
  [{ d: 3 }, { d: 4 }, { d: 5 }, { d: 6 }, { d: 7 }, { d: 8, wkend: true }, { d: 9, wkend: true }],
  [{ d: 10 }, { d: 11 }, { d: 12 }, { d: 13 }, { d: 14 }, { d: 15, wkend: true }, { d: 16, wkend: true, today: true }],
  [{ d: 17 }, { d: 18, sel: true, has: true }, { d: 19, has: true }, { d: 20, has: true }, { d: 21 }, { d: 22, wkend: true }, { d: 23, wkend: true }],
  [{ d: 24, has: true }, { d: 25 }, { d: 26, has: true }, { d: 27 }, { d: 28 }, { d: 29, wkend: true }, { d: 30, wkend: true }],
  [{ d: 31 }, { d: 1, other: true }, { d: 2, other: true }, { d: 3, other: true }, { d: 4, other: true }, { d: 5, wkend: true, other: true }, { d: 6, wkend: true, other: true }],
];
const SLOTS = [
  { time: "08:00", na: true }, { time: "09:00" }, { time: "09:30" }, { time: "10:00", na: true },
  { time: "10:30", picked: true }, { time: "11:00" }, { time: "14:00", na: true }, { time: "15:30" },
];

export default function Booking() {
  const [selectedSlot, setSelectedSlot] = useState("10:30");
  const [selectedDay, setSelectedDay] = useState(18);
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="booking" ref={sectionRef} style={{ fontFamily: "'DM Sans', sans-serif" }} className="py-24 px-8 lg:px-16 bg-[#EEF3FB]">
      <style>{`
        @keyframes bookingSlideLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bookingScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .booking-left { opacity: 0; }
        .booking-left.is-visible {
          animation: bookingSlideLeft 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .booking-right { opacity: 0; }
        .booking-right.is-visible {
          animation: bookingScaleIn 700ms ease-out 300ms forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .booking-left, .booking-right,
          .booking-left.is-visible, .booking-right.is-visible {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT — text */}
        <div className={`booking-left ${visible ? "is-visible" : ""}`}>
          <span className="text-[.78rem] font-semibold uppercase tracking-widest text-[#638ECB] mb-3 block">Prendre rendez-vous</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-[2.8rem] font-bold text-[#0D1B2E] leading-tight mb-4">
            Réservez un RDV<br />aujourd'hui, en ligne.
          </h2>
          <p className="text-[.95rem] text-[#5A6E8A] leading-relaxed mb-8 max-w-[420px]">
            Healy accepte la plupart des assurances. Que vous soyez assuré CNAS ou non, trouvez un spécialiste qui vous convient.
          </p>
          <div className="flex flex-col gap-3 mb-8">
            {["Médecins disponibles en temps réel", "Spécialités les plus recherchées", "Ordonnance numérique après consultation"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-[.88rem] text-[#0D1B2E] font-medium">
                <div className="w-5 h-5 rounded-full bg-[#395886] flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                {item}
              </div>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#395886] hover:bg-[#2d4570] text-white font-semibold text-[.9rem] rounded-xl transition-all duration-200 shadow-[0_4px_16px_rgba(57,88,134,0.3)] hover:-translate-y-0.5 cursor-pointer border-none">
            Voir les disponibilités
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* RIGHT — calendar card */}
        <div className={`booking-right ${visible ? "is-visible" : ""} bg-white rounded-[20px] shadow-[0_8px_32px_rgba(57,88,134,0.12)] border border-[#E4EAF5] p-5`}>
          {/* Doctor strip */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#E4EAF5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#b1c9ef] to-[#638ECB] flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&q=80&fit=crop&crop=top" alt="Dr. Kamel Benali" className="w-full h-full object-cover" onError={(e) => e.target.style.display = "none"} />
              </div>
              <div>
                <div className="text-[.88rem] font-bold text-[#0D1B2E]">Dr. Kamel Benali</div>
                <div className="text-[.72rem] text-[#5A6E8A]">Cardiologue</div>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-[#EEF3FB] hover:bg-[#638ECB]/20 text-[#395886] text-[.75rem] font-semibold transition-all cursor-pointer border-none">
              Sélectionner
            </button>
          </div>

          {/* Calendar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <button className="w-7 h-7 rounded-lg bg-[#F5F7FB] hover:bg-[#EEF3FB] flex items-center justify-center text-[#5A6E8A] cursor-pointer border-none text-lg">‹</button>
              <span className="text-[.88rem] font-bold text-[#0D1B2E]">Mars 2026</span>
              <button className="w-7 h-7 rounded-lg bg-[#F5F7FB] hover:bg-[#EEF3FB] flex items-center justify-center text-[#5A6E8A] cursor-pointer border-none text-lg">›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => <div key={d} className={`text-center text-[.68rem] font-semibold py-1 ${d === "Sa" || d === "Di" ? "text-[#B1C9EF]" : "text-[#9AACBE]"}`}>{d}</div>)}
            </div>
            {CALENDAR.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => (
                  <button
                    key={di}
                    onClick={() => !day.na && !day.other && setSelectedDay(day.d)}
                    className={`h-8 w-8 mx-auto rounded-full text-[.8rem] font-medium transition-all cursor-pointer border-none
                      ${day.other ? "text-[#C8D8EE] cursor-default" : ""}
                      ${!day.other && day.wkend ? "text-[#B1C9EF]" : ""}
                      ${!day.other && !day.wkend ? "text-[#0D1B2E]" : ""}
                      ${day.today ? "ring-2 ring-[#638ECB]" : ""}
                      ${day.has && !day.other ? "font-bold" : ""}
                      ${selectedDay === day.d && !day.other ? "bg-[#395886] text-white" : ""}
                      ${!day.other && selectedDay !== day.d ? "hover:bg-[#EEF3FB]" : ""}
                    `}
                  >
                    {day.d}
                    {day.has && !day.other && selectedDay !== day.d && (
                      <span className="block w-1 h-1 rounded-full bg-[#638ECB] mx-auto -mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Slots */}
          <div>
            <div className="text-[.72rem] font-semibold text-[#9AACBE] uppercase tracking-wide mb-2">
              Créneaux — {selectedDay} Mars
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SLOTS.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => !slot.na && setSelectedSlot(slot.time)}
                  className={`py-2 rounded-lg text-[.75rem] font-semibold transition-all border cursor-pointer
                    ${slot.na ? "bg-[#F5F7FB] text-[#C8D8EE] border-[#E4EAF5] cursor-not-allowed" : ""}
                    ${!slot.na && selectedSlot === slot.time ? "bg-[#395886] text-white border-[#395886]" : ""}
                    ${!slot.na && selectedSlot !== slot.time ? "bg-white text-[#5A6E8A] border-[#E4EAF5] hover:border-[#638ECB] hover:text-[#395886]" : ""}
                  `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full mt-4 py-3 rounded-xl bg-[#395886] hover:bg-[#2d4570] text-white font-semibold text-[.88rem] transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(57,88,134,0.25)]">
            Confirmer le rendez-vous
          </button>
        </div>
      </div>
    </section>
  );
}