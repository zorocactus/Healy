import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Languages, ChevronDown } from "lucide-react";

export default function Navbar({ onLogin, onRegister }) {
  const [stuck, setStuck] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  const NAV_LINKS = [
    { label: t('nav_ai'), href: "ai-feats" },
    { label: t('nav_doctors'), href: "doctors" },
    { label: t('nav_booking'), href: "booking" },
    { label: t('nav_prescriptions'), href: "ordonnances" },
    { label: t('nav_features'), href: "features" },
  ];

  useEffect(() => {
    const handleScroll = () => setStuck(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-[60px] bg-white transition-all duration-200
        ${stuck ? "border-b border-[#E4EAF5] shadow-[0_2px_20px_rgba(57,88,134,0.07)]" : "border-b border-transparent"}`}
    >
      {/* Logo */}
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className="flex items-center no-underline"
      >
        <img src="/healy-logo.svg" alt="Healy" className="h-9 w-auto" />
      </a>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map((link) => (
          <button
            key={link.href}
            onClick={() => scrollTo(link.href)}
            className="px-4 py-2 rounded-lg text-[.86rem] font-medium text-[#5A6E8A] hover:bg-[#EEF3FB] hover:text-[#395886] transition-all duration-200 cursor-pointer border-none bg-transparent"
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E4EAF5] text-[.8rem] font-semibold text-[#5A6E8A] hover:bg-[#EEF3FB] transition-all cursor-pointer bg-transparent"
          >
            <Languages size={14} />
            <span className="uppercase">{lang}</span>
            <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {langOpen && (
            <div className="absolute top-full mt-2 right-0 w-28 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-[#E4EAF5] overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => { setLang('fr'); setLangOpen(false); }}
                className={`w-full text-left px-4 py-2 text-[.8rem] transition-colors ${lang === 'fr' ? 'text-[#395886] font-bold bg-[#EEF3FB]' : 'text-[#5A6E8A] hover:bg-[#F8FAFC]'}`}
              >
                Français
              </button>
              <button
                onClick={() => { setLang('en'); setLangOpen(false); }}
                className={`w-full text-left px-4 py-2 text-[.8rem] transition-colors ${lang === 'en' ? 'text-[#395886] font-bold bg-[#EEF3FB]' : 'text-[#5A6E8A] hover:bg-[#F8FAFC]'}`}
              >
                English
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onLogin}
          className="px-4 py-2 text-[.86rem] font-semibold text-[#395886] border border-[#395886]/30 hover:bg-[#EEF3FB] rounded-lg transition-all duration-200 cursor-pointer bg-transparent"
        >
          {t('nav_login')}
        </button>
        <button
          onClick={onRegister}
          className="px-5 py-2 text-[.86rem] font-semibold text-white bg-[#395886] hover:bg-[#2d4570] rounded-lg transition-all duration-200 cursor-pointer shadow-[0_2px_10px_rgba(57,88,134,0.3)] border-none"
        >
          {t('nav_start')}
        </button>
      </div>
    </nav>
  );
}