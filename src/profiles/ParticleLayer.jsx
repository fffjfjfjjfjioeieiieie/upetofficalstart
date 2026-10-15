import React, { useMemo } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const init = async (engine) => { await loadSlim(engine); };
export default function ParticleLayer({ color = '#28a8f6', intensity = 50 }) {
  const options = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: 30,
    pauseOnBlur: true,
    background: { color: { value: 'transparent' } },
    particles: {
      color: { value: color },
      number: { value: Math.round(12 + intensity * .35), density: { enable: true, area: 900 } },
      opacity: { value: { min: .12, max: .4 } },
      size: { value: { min: 1, max: 3 } },
      move: { enable: true, speed: .35 + intensity / 100, outModes: { default: 'out' } },
    },
    detectRetina: true,
  }), [color, intensity]);
  return <ParticlesProvider init={init}><Particles id="userpet-profile-particles" options={options} style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }} /></ParticlesProvider>;
}
