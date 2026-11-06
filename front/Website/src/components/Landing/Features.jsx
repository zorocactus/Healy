import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    title: "Réservation en ligne",
    desc: "Filtrez par spécialité, établissement et disponibilité. Confirmez en un clic avec rappels automatiques.",
    highlight: false,
  },
  {
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    title: "Profil médical unifié",
    desc: "Antécédents, analyses, ordonnances centralisés. Accès sécurisé pour les professionnels vérifiés.",
    highlight: true,
  },
  {
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>,
    title: "Pharmacie connectée",
    desc: "Ordonnances QR code, commandes en ligne et prise en charge carte SHIFA automatique.",
    highlight: false,
  },
  {
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    title: "Garde-malade certifié",
    desc: "Sélectionnez un garde-malade compatible avec vos antécédents médicaux. Suivi inclus.",
    highlight: false,
  },
  {
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    title: "Suivi médical continu",
    desc: "Consultez l'évolution de votre état de santé sur la durée. Alertes automatiques en cas d'anomalie détectée.",
    highlight: false,
  },
  {
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Identité vérifiée",
    desc: "Chaque professionnel est authentifié par carte d'identité et preuve de profession. Données RGPD.",
    highlight: false,
  },
];

export default function Features() {
  const gridRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
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

  const delayFor = (i, highlight) => {
    if (highlight) return 650;
    const before = features.slice(0, i).filter((x) => !x.highlight).length;
    return before * 100;
  };

  return (
    <section id="features" style={{ fontFamily: "'DM Sans', sans-serif" }} className="bg-[#0D1B2E] py-24 px-8 lg:px-16">
      <style>{`
        @keyframes featRise {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .feat-card { opacity: 0; }
        .feat-card.is-visible {
          animation: featRise 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .feat-card, .feat-card.is-visible {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-14 gap-10 flex-wrap">
          <div>
            <span className="text-[.78rem] font-semibold uppercase tracking-widest text-[#638ECB] mb-3 block">Fonctionnalités</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-[2.8rem] font-bold text-white leading-tight">
              Tout ce dont vous avez<br />besoin, <em className="not-italic text-[#638ECB]">au même endroit.</em>
            </h2>
          </div>
          <p className="text-[.93rem] text-white/45 max-w-[300px] leading-[1.75]">
            Un écosystème complet, sécurisé et certifié CNAS.
          </p>
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              style={{ animationDelay: `${delayFor(i, f.highlight)}ms` }}
              className={`feat-card ${visible ? "is-visible" : ""} rounded-[18px] p-7 transition-all duration-[280ms] hover:-translate-y-1.5 cursor-default
                ${f.highlight
                  ? "bg-gradient-to-br from-[#395886] to-[#1e3460] border border-transparent"
                  : "bg-white/[0.03] border border-[#638ECB]/12 hover:shadow-[0_12px_40px_rgba(8,15,30,0.5)] hover:border-[#638ECB]/28"
                }`}
            >
              <div className={`w-11 h-11 rounded-[11px] mb-5 flex items-center justify-center
                ${f.highlight ? "bg-white/10 border border-white/10" : "bg-[#638ECB]/10 border border-[#638ECB]/15"}`}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-[1.2rem] font-bold text-white mb-2">{f.title}</h3>
              <p className={`text-[.82rem] leading-[1.75] ${f.highlight ? "text-white/62" : "text-white/45"}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}