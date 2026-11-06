import { ParticlesHero, ParticlesAuth, ParticlesSubtle } from '../components/backgrounds/MedParticles';

const variants = [
  { name: 'Hero (dense)', Component: ParticlesHero },
  { name: 'Auth (moyen)', Component: ParticlesAuth },
  { name: 'Subtle (dashboard)', Component: ParticlesSubtle },
];

export default function BackgroundTest() {
  return (
    <div>
      {/* Light mode — 3 sections */}
      {variants.map(({ name, Component }) => (
        <section key={`light-${name}`} style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#F0F4F8', overflow: 'hidden' }}>
          <Component darkMode={false} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: '16px 32px', boxShadow: '0 4px 20px rgba(74,111,165,0.15)' }}>
              <h2 style={{ color: '#0D1B2E', fontSize: 32, fontWeight: 700, margin: 0 }}>{name}</h2>
              <p style={{ color: '#5A6E8A', fontSize: 16, marginTop: 6, marginBottom: 0 }}>Mode Light — fond #F0F4F8</p>
            </div>
          </div>
        </section>
      ))}

      {/* Dark mode — 3 sections */}
      {variants.map(({ name, Component }) => (
        <section key={`dark-${name}`} style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#0D1117', overflow: 'hidden' }}>
          <Component darkMode={true} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: '16px 32px' }}>
              <h2 style={{ color: 'white', fontSize: 32, fontWeight: 700, margin: 0 }}>{name} — Dark</h2>
              <p style={{ color: '#8AAEE0', fontSize: 16, marginTop: 6, marginBottom: 0 }}>Mode Dark — fond #0D1117</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
