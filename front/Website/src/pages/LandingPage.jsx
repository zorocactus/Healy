import { useEffect } from "react";
import Navbar from "../components/Landing/Navbar";
import Hero from "../components/Landing/Hero";
import AIFeatures from "../components/Landing/AIFeatures";
import Doctors from "../components/Landing/Doctors";
import Booking from "../components/Landing/Booking";
import Ordonnances from "../components/Landing/Ordonnances";
import Features from "../components/Landing/Features";

export default function LandingPage({ onLogin, onRegister }) {
  // Inject DM Sans + Cormorant Garamond fonts (matching original design)
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&display=swap";
    document.head.appendChild(link);

    // Apply Cormorant Garamond to all h1 and h2 on the landing page
    const style = document.createElement("style");
    style.id = "landing-fonts";
    style.textContent = `
      #landing-root h1, #landing-root h2 {
        font-family: 'Cormorant Garamond', serif;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      const s = document.getElementById("landing-fonts");
      if (s) document.head.removeChild(s);
    };
  }, []);

  return (
    <div id="landing-root" className="min-h-screen bg-[#F5F7FB]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar onLogin={onLogin} onRegister={onRegister} />
      <Hero onStart={onRegister} />
      <AIFeatures />
      <Doctors />
      <Booking />
      <Ordonnances />
      <Features />
    </div>
  );
}
