import { useEffect, useRef, useState } from "react";

const doctors = [
  { name: "Dr. Kamel Benali", specialty: "Cardiologue · Clinique privée", availability: "Disponible aujourd'hui", availColor: "#16a34a", initials: "KB", photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=85&fit=crop&crop=top" },
  { name: "Dr. Sara Meziane", specialty: "Cardiologue · CHU Mustapha", availability: "Disponible demain", availColor: "#16a34a", initials: "SM", photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=85&fit=crop&crop=top" },
  { name: "Dr. Youcef Rahmani", specialty: "Généraliste · À domicile", availability: "Dans 2h", availColor: "#16a34a", initials: "YR", photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=85&fit=crop&crop=top" },
  { name: "Dr. Amira Boudali", specialty: "Gynécologue · Clinique El Azhar", availability: "Lundi prochain", availColor: "#d97706", initials: "AB", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=85&fit=crop&crop=top" },
];


export default function Doctors() {
  const gridRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [imgError, setImgError] = useState({});

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

  return (
    <section id="doctors" style={{ fontFamily: "'DM Sans', sans-serif" }} className="bg-white py-24 px-8 lg:px-16">
      <style>{`
        @keyframes doctorDealIn {
          from { opacity: 0; transform: translateX(-80px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .doctor-card { opacity: 0; }
        .doctor-card.is-visible {
          animation: doctorDealIn 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .doctor-card, .doctor-card.is-visible {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-14">
          <span className="text-[.78rem] font-semibold uppercase tracking-widest text-[#638ECB] mb-3 block">Spécialistes</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-[2.8rem] font-bold text-[#0D1B2E] leading-tight mb-3">
            Consultez un médecin<br />
            <em className="not-italic text-[#638ECB]">n'importe où</em>, par recherche
          </h2>
          <p className="text-[.9rem] text-[#5A6E8A]">Médecins vérifiés et notés par les patients.</p>
        </div>
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.map((doc, i) => {
            const showPhoto = doc.photo && !imgError[i];
            return (
              <div
                key={i}
                className={`doctor-card ${visible ? "is-visible" : ""} rounded-[16px] overflow-hidden border border-[#E4EAF5] bg-white cursor-pointer transition-all duration-[280ms] hover:-translate-y-1.5 hover:shadow-[0_16px_44px_rgba(57,88,134,0.15)] hover:border-[#B1C9EF]`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="w-full h-[160px] bg-gradient-to-br from-[#cdd9ee] via-[#b1c9ef] to-[#8aaee0] relative flex items-center justify-center">
                  {showPhoto ? (
                    <img
                      src={doc.photo}
                      alt={doc.name}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                      onError={() => setImgError((prev) => ({ ...prev, [i]: true }))}
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-full bg-[#395886] text-white text-[1.3rem] font-bold flex items-center justify-center shadow-[0_4px_16px_rgba(57,88,134,0.3)] relative z-10">{doc.initials}</div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[.68rem] font-semibold bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.1)]" style={{ color: doc.availColor }}>
                    <div className="w-[5px] h-[5px] rounded-full" style={{ background: doc.availColor }} />
                    {doc.availability}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[1rem] font-bold text-[#0D1B2E] mb-0.5">{doc.name}</div>
                  <div className="text-[.72rem] text-[#5A6E8A] mb-2">{doc.specialty}</div>
                  <button className="w-full py-2.5 rounded-[9px] bg-[#395886] hover:bg-[#2d4570] text-white font-semibold text-[.8rem] transition-all duration-200 cursor-pointer border-none">
                    Prendre rendez-vous
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
