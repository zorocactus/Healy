import Particles from './Particles';

const COLORS_LIGHT = ['#4A6FA5', '#2D8C6F', '#638ECB'];
const COLORS_DARK  = ['#638ECB', '#4CAF82', '#8AAEE0'];

const wrapStyle = {
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
};

/**
 * ParticlesHero — dense, 100 particles, moveParticlesOnHover=true
 */
export function ParticlesHero({ darkMode = false }) {
  return (
    <div style={wrapStyle}>
      <Particles
        particleCount={100}
        particleSpread={10}
        speed={0.1}
        particleColors={darkMode ? COLORS_DARK : COLORS_LIGHT}
        moveParticlesOnHover={false}
        particleHoverFactor={1.2}
        alphaParticles={true}
        particleBaseSize={120}
        sizeRandomness={1}
        cameraDistance={20}
        disableRotation={false}
      />
    </div>
  );
}

/**
 * ParticlesAuth — medium, 60 particles, moveParticlesOnHover=true
 */
export function ParticlesAuth({ darkMode = false }) {
  return (
    <div style={wrapStyle}>
      <Particles
        particleCount={60}
        particleSpread={8}
        speed={0.08}
        particleColors={darkMode ? COLORS_DARK : COLORS_LIGHT}
        moveParticlesOnHover={false}
        particleHoverFactor={1}
        alphaParticles={true}
        particleBaseSize={100}
        sizeRandomness={1}
        cameraDistance={20}
        disableRotation={false}
      />
    </div>
  );
}

/**
 * ParticlesSubtle — light, 25 particles, opacity 0.4, pointer-events:none, moveParticlesOnHover=false
 */
export function ParticlesSubtle({ darkMode = false }) {
  return (
    <div style={{ ...wrapStyle, opacity: 0.4, pointerEvents: 'none' }}>
      <Particles
        particleCount={25}
        particleSpread={6}
        speed={0.05}
        particleColors={darkMode ? COLORS_DARK : COLORS_LIGHT}
        moveParticlesOnHover={false}
        alphaParticles={true}
        particleBaseSize={80}
        sizeRandomness={0.8}
        cameraDistance={20}
        disableRotation={false}
      />
    </div>
  );
}
