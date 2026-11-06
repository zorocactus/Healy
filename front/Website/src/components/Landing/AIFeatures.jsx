import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    title: "Analyse des symptômes",
    desc: "Décrivez ce que vous ressentez en langage naturel. L'IA identifie les patterns cliniques et évalue le niveau d'urgence en secondes.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: "Interprétation des analyses",
    desc: "Vos résultats biologiques traduits en langage clair. L'IA met en évidence les valeurs anormales et suggère les actions à prendre.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    title: "Orientation médicale",
    desc: "L'IA vous recommande le bon spécialiste selon votre cas, avec disponibilités en temps réel et correspondance avec votre assurance.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    title: "Alertes & mode urgence",
    desc: "En cas de symptômes critiques, l'IA active le mode urgence et envoie automatiquement vos informations au contact d'urgence défini.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="1.8"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/></svg>,
    title: "Régime & mode de vie",
    desc: "L'IA propose un régime alimentaire et des ajustements de mode de vie adaptés à votre diagnostic et vos antécédents médicaux.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#638ECB" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Confidentialité totale",
    desc: "Toutes vos données médicales sont chiffrées de bout en bout. Conformité RGPD et standards CNAS. Vous contrôlez qui y accède.",
  },
];

export default function AIFeatures() {
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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="ai-feats" style={{ fontFamily: "'DM Sans', sans-serif" }} className="bg-[#0D1B2E] py-24 px-8 lg:px-16">
      <style>{`
        @keyframes aiCardRise {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ai-card { opacity: 0; }
        .ai-card.is-visible {
          animation: aiCardRise 700ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-card, .ai-card.is-visible {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      <div className="text-center mb-14 max-w-[600px] mx-auto">
        <span className="text-[.78rem] font-semibold uppercase tracking-widest text-[#638ECB] mb-3 block">
          Intelligence artificielle médicale
        </span>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-[2.8rem] font-bold text-white leading-tight mb-4">
          Ce que l'IA fait <em className="not-italic text-[#638ECB]">pour vous</em>
        </h2>
        <p className="text-[.9rem] text-white/50 leading-relaxed">
          Une IA médicale entraînée pour analyser, interpréter et guider — en toute responsabilité.
        </p>
      </div>
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1100px] mx-auto">
        {features.map((f, i) => (
          <div
            key={i}
            className={`ai-card ${visible ? "is-visible" : ""} bg-white/[0.03] border border-white/[0.07] rounded-[16px] p-6 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(8,15,30,0.5)] hover:border-[#638ECB]/28 transition-all duration-300 cursor-default`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-11 h-11 rounded-[11px] bg-[#638ECB]/10 border border-[#638ECB]/15 flex items-center justify-center mb-5">{f.icon}</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-[1.2rem] font-bold text-white mb-2">{f.title}</h3>
            <p className="text-[.82rem] text-white/45 leading-[1.75]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}