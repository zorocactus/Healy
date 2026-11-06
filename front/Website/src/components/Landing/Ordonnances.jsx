import { useEffect, useRef, useState } from "react";

export default function Ordonnances() {
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
    <section id="ordonnances" ref={sectionRef} style={{ fontFamily: "'DM Sans', sans-serif" }} className="bg-[#F5F7FB] py-24 px-8 lg:px-16">
      <style>{`
        @keyframes ordoSlideLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ordoSlideRight {
          from { opacity: 0; transform: translateX(50px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ordo-left { opacity: 0; }
        .ordo-left.is-visible {
          animation: ordoSlideLeft 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .ordo-card { opacity: 0; }
        .ordo-card.is-visible {
          animation: ordoSlideRight 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .ordo-left, .ordo-card,
          .ordo-left.is-visible, .ordo-card.is-visible {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* LEFT */}
        <div className={`ordo-left ${visible ? "is-visible" : ""}`}>
          <span className="text-[.78rem] font-semibold uppercase tracking-widest text-[#638ECB] mb-3 block">Ordonnances numériques</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-[2.8rem] font-bold text-[#0D1B2E] leading-tight mb-4">
            Vos ordonnances,<br />directement <em className="not-italic text-[#638ECB]">dans l'appli.</em>
          </h2>
          <p className="text-[.95rem] text-[#5A6E8A] leading-relaxed mb-8 max-w-[420px]">
            Après chaque consultation, votre médecin émet une ordonnance numérique intégrée. Scannez le QR code en pharmacie — zéro papier, zéro erreur.
          </p>
          <div className="flex flex-col gap-3">
            {["QR code scannable en pharmacie", "Prise en charge CNAS automatique", "Historique complet & renouvellement"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-[.88rem] text-[#0D1B2E] font-medium">
                <div className="w-5 h-5 rounded-full bg-[#395886] flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — ordonnance cards */}
        <div className="flex flex-col gap-4">
          {/* Card 1 — active */}
          <div
            className={`ordo-card ${visible ? "is-visible" : ""} bg-white border border-[#E4EAF5] rounded-[16px] p-5 shadow-[0_4px_20px_rgba(57,88,134,0.07)] hover:border-[#B1C9EF] hover:-translate-y-0.5 transition-all cursor-pointer`}
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#638ECB] to-[#395886] flex items-center justify-center text-white text-[.8rem] font-bold flex-shrink-0">KB</div>
                <div>
                  <div className="text-[.85rem] font-bold text-[#0D1B2E]">Dr. Kamel Benali</div>
                  <div className="text-[.7rem] text-[#5A6E8A]">15 Mars 2026 · Cardiologue</div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[.66rem] font-semibold bg-green-50 text-green-600 border border-green-100">
                <svg width="5" height="5" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4" /></svg>
                Active
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["Amlodipine 5mg", "Aspirine 100mg", "Atorvastatine 20mg"].map((med) => (
                <span key={med} className="px-2.5 py-1 rounded-[5px] bg-[#EEF3FB] border border-[#B1C9EF]/30 text-[.68rem] text-[#395886] font-medium">{med}</span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#E4EAF5]">
              <div className="flex items-center gap-2 text-[.7rem] text-[#5A6E8A]">
                <div className="w-7 h-7 rounded-[6px] bg-[#F5F7FB] border border-[#E4EAF5] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#395886" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 14h4M14 17v4"/>
                  </svg>
                </div>
                Scanner en pharmacie
              </div>
              <div className="flex items-center gap-1.5 text-[.7rem] text-green-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />Disponible
              </div>
            </div>
          </div>

          {/* Card 2 — pending */}
          <div
            className={`ordo-card ${visible ? "is-visible" : ""} bg-white border border-[#E4EAF5] rounded-[16px] p-5 shadow-[0_4px_20px_rgba(57,88,134,0.07)] hover:border-[#B1C9EF] hover:-translate-y-0.5 transition-all cursor-pointer`}
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-white text-[.8rem] font-bold flex-shrink-0">SM</div>
                <div>
                  <div className="text-[.85rem] font-bold text-[#0D1B2E]">Dr. Sara Meziane</div>
                  <div className="text-[.7rem] text-[#5A6E8A]">10 Mars 2026 · Cardiologue</div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[.66rem] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                <svg width="5" height="5" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4" /></svg>
                En attente
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["Metformine 500mg", "Vitamine D3"].map((med) => (
                <span key={med} className="px-2.5 py-1 rounded-[5px] bg-[#EEF3FB] border border-[#B1C9EF]/30 text-[.68rem] text-[#395886] font-medium">{med}</span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#E4EAF5]">
              <div className="text-[.7rem] text-[#5A6E8A]">QR code disponible après validation</div>
              <div className="text-[.7rem] text-amber-600 font-medium">Validation CNAS</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
