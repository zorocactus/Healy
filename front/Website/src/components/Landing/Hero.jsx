import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, History } from "lucide-react";
import { ParticlesHero } from "../backgrounds/MedParticles";

const QUICK_CHIPS = ["Maux de tête", "Fatigue", "Douleur thoracique", "Fièvre"];

const DEMO_SCRIPT = [
  {
    userMsg: "J'ai des douleurs thoraciques légères et de la fatigue depuis 2 jours.",
    response: {
      urgency: "med",
      urgencyLabel: "Urgence modérée",
      intro: "J'analyse vos symptômes…",
      body: "Les douleurs thoraciques associées à la fatigue méritent une attention médicale sous 24h. Je vous recommande Dr. Benali, cardiologue disponible aujourd'hui à la Clinique El Azhar.",
      tags: ["Consultation sous 24h", "Éviter l'effort physique", "Dr. Benali disponible"],
    },
  },
  {
    userMsg: "Merci. Est-ce que je peux prendre du paracétamol en attendant ?",
    response: {
      urgency: "low",
      urgencyLabel: "Conseil médical",
      intro: "Oui, avec quelques précautions :",
      body: "Le paracétamol 1g toutes les 6h maximum est approprié. Évitez l'ibuprofène en cas de douleur thoracique. Reposez-vous jusqu'à votre consultation.",
      tags: ["Paracétamol 1g max", "Pas d'ibuprofène", "Repos strict", "Boire 1.5L/jour"],
    },
  },
];

const URGENCY_STYLE = {
  low:  "bg-[rgba(74,222,128,0.1)]  text-[#4ade80]  border border-[rgba(74,222,128,0.2)]",
  med:  "bg-[rgba(251,191,36,0.1)]  text-[#fbbf24]  border border-[rgba(251,191,36,0.2)]",
  high: "bg-[rgba(248,113,113,0.1)] text-[#f87171]  border border-[rgba(248,113,113,0.2)]",
};

/* ── Typewriter hook ── */
function useTypewriter(text, speed, onDone) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); onDone?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return displayed;
}

/* ── Bot bubble with result card ── */
function BotBubble({ intro, body, tags, urgency, urgencyLabel, onDone }) {
  const [showCard, setShowCard] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [bodyDone, setBodyDone] = useState(false);

  const introText = useTypewriter(intro, 24, () => setShowCard(true));
  const bodyText  = useTypewriter(showCard ? body : "", 14, () => {
    setBodyDone(true);
    setTimeout(() => { setShowTags(true); }, 80);
    setTimeout(() => onDone?.(), 1800);
  });

  return (
    <div className="flex flex-col max-w-[88%] self-start" style={{ animation: "bubbleIn .35s ease" }}>
      <div className="px-[14px] py-[10px] rounded-[14px] rounded-bl-[4px] text-[.8rem] leading-[1.65] bg-white/[0.07] border border-white/[0.08] text-white/80">
        <span>{introText}</span>
        {!introText && <span className="inline-block w-[2px] h-[12px] bg-white/50 ml-0.5 animate-pulse align-middle" />}

        {showCard && (
          <div className="mt-2.5 bg-white/[0.05] border border-white/[0.08] rounded-[12px] p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[.66rem] font-bold uppercase tracking-[1.5px] text-white/35">Diagnostic IA</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[.68rem] font-semibold ${URGENCY_STYLE[urgency]}`}>
                {urgencyLabel}
              </span>
            </div>
            <div className="text-[.78rem] leading-[1.65] text-white/70 mb-2">
              {bodyText}
              {!bodyDone && <span className="inline-block w-[2px] h-[12px] bg-[#638ECB] ml-0.5 animate-pulse align-middle" />}
            </div>
            {showTags && (
              <div className="flex flex-wrap gap-1.5 mt-2" style={{ animation: "bubbleIn .4s ease" }}>
                {tags.map((t) => (
                  <span key={t} className="px-2.5 py-[3px] rounded-full text-[.65rem] font-medium bg-[rgba(99,142,203,0.12)] text-[#8AAEE0] border border-[rgba(99,142,203,0.15)]">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── User bubble ── */
function UserBubble({ text }) {
  return (
    <div className="flex flex-col max-w-[88%] self-end" style={{ animation: "bubbleIn .35s ease" }}>
      <div className="px-[14px] py-[10px] rounded-[14px] rounded-br-[4px] text-[.8rem] leading-[1.65] bg-[rgba(99,142,203,0.18)] border border-[rgba(99,142,203,0.25)] text-white/90">
        {text}
      </div>
    </div>
  );
}

/* ── Typing dots ── */
function TypingDots() {
  return (
    <div className="self-start flex items-center gap-1 px-[14px] py-[10px] bg-white/[0.07] border border-white/[0.08] rounded-[14px] rounded-bl-[4px]">
      {[0, 200, 400].map((d) => (
        <div key={d} className="w-[5px] h-[5px] rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
  );
}

export default function Hero({ onStart }) {
  const [messages, setMessages]     = useState([]);
  const [inputVal, setInputVal]     = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [demoIdx, setDemoIdx]       = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);
  const msgsRef   = useRef(null);
  const inputRef  = useRef(null);
  const timeouts  = useRef([]);

  /* auto-scroll — observe DOM changes inside msgs container for real-time scroll during typewriter */
  useEffect(() => {
    const el = msgsRef.current;
    if (!el) return;
    const observer = new MutationObserver(() => {
      el.scrollTop = el.scrollHeight;
    });
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  /* typewriter into the input field */
  function typeInInput(text, speed, onDone) {
    let i = 0;
    setInputVal("");
    const iv = setInterval(() => {
      i++;
      setInputVal(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); onDone?.(); }
    }, speed);
    timeouts.current.push(iv);
  }

  function addMsg(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  /* run one demo step */
  const runStep = useCallback((idx) => {
    if (idx >= DEMO_SCRIPT.length) {
      // loop
      const t = setTimeout(() => {
        setMessages([]);
        setInputVal("");
        setShowTyping(false);
        setTimeout(() => runStep(0), 400);
      }, 4000);
      timeouts.current.push(t);
      return;
    }

    const step = DEMO_SCRIPT[idx];

    // 1. type user message into input
    typeInInput(step.userMsg, 38, () => {
      // 2. pause then "send"
      const t1 = setTimeout(() => {
        setInputVal("");
        addMsg({ id: Date.now(), type: "user", text: step.userMsg });

        // 3. typing dots
        const t2 = setTimeout(() => {
          setShowTyping(true);

          // 4. bot response
          const t3 = setTimeout(() => {
            setShowTyping(false);
            addMsg({ id: Date.now() + 1, type: "bot", ...step.response, onDone: () => runStep(idx + 1) });
          }, 1200);
          timeouts.current.push(t3);
        }, 400);
        timeouts.current.push(t2);
      }, 600);
      timeouts.current.push(t1);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runStep(0), 1200);
    timeouts.current.push(t);
    return () => timeouts.current.forEach((x) => { clearInterval(x); clearTimeout(x); });
  }, []);

  /* manual send */
  function sendMessage(text) {
    if (!text.trim()) return;
    timeouts.current.forEach((x) => { clearInterval(x); clearTimeout(x); });
    timeouts.current = [];
    setInputVal("");
    setShowTyping(false);
    addMsg({ id: Date.now(), type: "user", text: text.trim() });
    setTimeout(() => setShowTyping(true), 300);
    setTimeout(() => {
      setShowTyping(false);
      addMsg({
        id: Date.now() + 1,
        type: "bot",
        urgency: "low",
        urgencyLabel: "Conseil médical",
        intro: "Analyse en cours…",
        body: "Je détecte des symptômes qui nécessitent une consultation. Je vous recommande un spécialiste disponible aujourd'hui.",
        tags: ["Consultation recommandée", "Suivi nécessaire"],
        onDone: () => {},
      });
    }, 1500);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputVal); }
  }

  return (
    <>
      <style>{`
        @keyframes bubbleIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes tdot { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        .aw-msgs::-webkit-scrollbar { width: 4px; }
        .aw-msgs::-webkit-scrollbar-track { background: transparent; }
        .aw-msgs::-webkit-scrollbar-thumb { background: rgba(99,142,203,0.25); border-radius: 99px; }
        .aw-msgs::-webkit-scrollbar-thumb:hover { background: rgba(99,142,203,0.45); }

        @keyframes heroSlideInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroSlideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .hero-anim-left {
          opacity: 0;
          animation: heroSlideInLeft 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms forwards;
        }
        .hero-anim-right {
          opacity: 0;
          animation: heroSlideInRight 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 250ms forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-anim-left, .hero-anim-right {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <section
        id="hero"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="min-h-screen pt-[60px] grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden bg-[#F5F7FB]"
      >
        <ParticlesHero darkMode={false} />
        {/* Blobs */}
        <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] rounded-full bg-[#B1C9EF]/20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-[#638ECB]/15 blur-[80px] pointer-events-none" />

        {/* LEFT */}
        <div className="hero-anim-left flex flex-col justify-center px-10 lg:px-16 py-16 lg:py-0 relative z-10">


          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E4EAF5] bg-white text-[.78rem] font-medium text-[#5A6E8A] mb-8 w-fit shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#3DAA73]" />
            IA Médicale · Algérie
          </div>
          <h1 className="text-[3rem] lg:text-[3.6rem] font-bold text-[#0D1B2E] leading-[1.1] mb-6 tracking-[-1px]">
            Votre diagnostic,<br />
            <em className="not-italic text-[#638ECB]">intelligent</em><br />
            &amp; instantané.
          </h1>
          <p className="text-[1rem] text-[#5A6E8A] leading-relaxed mb-8 max-w-[480px]">
            Décrivez vos symptômes en langage naturel. Healy analyse, évalue le niveau d'urgence et vous oriente vers le bon spécialiste.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={onStart}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#395886] hover:bg-[#2d4570] text-white font-semibold text-[.9rem] rounded-xl transition-all duration-200 shadow-[0_4px_16px_rgba(57,88,134,0.3)] hover:-translate-y-0.5 cursor-pointer border-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
              </svg>
              Démarrer le diagnostic
            </button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-[#EEF3FB] text-[#395886] font-semibold text-[.9rem] rounded-xl border border-[#E4EAF5] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4V8z" />
              </svg>
              Voir les fonctionnalités
            </button>
          </div>
        </div>

        {/* RIGHT — Glassmorphism Chat Window */}
        <div className="hero-anim-right flex items-center justify-center px-8 py-16 relative z-10">
          {/* Glow behind */}
          <div className="absolute w-[420px] h-[520px] bg-[#395886]/15 rounded-[40px] blur-[70px] pointer-events-none" />
          <div className="absolute w-[280px] h-[280px] bg-[#638ECB]/10 rounded-full blur-[60px] translate-x-16 pointer-events-none" />



          {/* Dark card — backdrop-blur, no white wrapper */}
          <div className="relative w-full max-w-[500px] rounded-[20px] overflow-hidden border border-white/[0.08] shadow-[0_32px_80px_rgba(8,15,30,0.5)]"
            style={{ background: "rgba(10, 27, 51, 1)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
          >

              {/* Chrome bar */}
              <div className="flex items-center justify-between px-5 py-4.5 bg-white/[0.03] border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[#395886] rounded-lg flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="6" y="1" width="4" height="14" rx="1.5" fill="white" />
                      <rect x="1" y="6" width="14" height="4" rx="1.5" fill="white" />
                    </svg>
                  </div>
                  <span className="text-[.82rem] font-semibold text-white/80">Healy IA — Diagnostic</span>
                </div>
                <div className="flex items-center gap-1.5 text-[.68rem] text-white/35">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                  En ligne · Analyse activée
                </div>
              </div>

              {/* Messages */}
              <div ref={msgsRef} className="aw-msgs h-[280px] overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
                {messages.map((msg) =>
                  msg.type === "user"
                    ? <UserBubble key={msg.id} text={msg.text} />
                    : <BotBubble key={msg.id} {...msg} />
                )}
                {showTyping && <TypingDots />}
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-2 px-4 pb-3 pt-2 border-t border-white/[0.05]">
                {QUICK_CHIPS.map((chip) => (
                  <button key={chip} onClick={() => sendMessage(chip)}
                    className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-[#638ECB]/30 border border-white/10 text-white/60 hover:text-white/90 text-[.74rem] font-medium transition-all cursor-pointer">
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input area */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2 focus-within:border-[#638ECB]/40 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Décrivez vos symptômes en détail…"
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-white/80 placeholder-white/25 text-[0.95rem] leading-normal max-h-20 py-2"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button onClick={() => sendMessage(inputVal)}
                    className="w-9 h-9 rounded-full bg-[#638ECB] hover:bg-[#395886] flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 cursor-pointer border-none">
                    <Send size={18} color="white" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2 px-1">
                  <button className="flex items-center gap-1.5 text-[.78rem] text-white/30 hover:text-white/60 transition-colors cursor-pointer border-none bg-transparent">
                    <Paperclip size={14} /> Joindre
                  </button>
                  <button className="flex items-center gap-1.5 text-[.78rem] text-white/30 hover:text-white/60 transition-colors cursor-pointer border-none bg-transparent">
                    <History size={14} /> Historique
                  </button>
                  <span className="ml-auto text-[.63rem] text-white/20">IA médicale — Non substitutif à un médecin</span>
                </div>
              </div>

          </div>
        </div>
      </section>
    </>
  );
}