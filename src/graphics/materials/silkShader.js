import { configureLiquidMetalShader } from './liquidMetalShader.js';

// Reuse the original smooth heightfield in an anisotropic domain: long parallel
// folds drift gently rather than looking like an isotropic liquid surface.
export function configureSilkShader(shader, uniforms) {
  configureLiquidMetalShader(shader, uniforms);
  if (!shader.fragmentShader.includes('#include <aomap_fragment>')) throw new Error('Unsupported physical fabric shader version.');
  shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying float upetFabricValley;').replace(
    'vec3 upetWaveState = upetLiquidWave(position.xy);',
    `vec3 upetWaveState = upetLiquidWave(vec2(position.x * 1.7, position.y * 0.35));
upetWaveState.y *= 1.7;
upetWaveState.z *= 0.35;
upetFabricValley = clamp(0.5 + upetWaveState.x / max(upetWaveAmplitude * 1.8, 0.001), 0.0, 1.0);`,
  );
  // Local fold-valley occlusion suggests soft self-shadowing without allocating
  // a shadow map for each widget. Direct/indirect PBR lighting and sheen remain.
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float upetFabricValley;\nuniform float upetFabricContrast;')
    .replace('#include <aomap_fragment>', `#include <aomap_fragment>
float upetFoldOcclusion = mix(1.0 - upetFabricContrast * 0.8, 1.0, upetFabricValley);
reflectedLight.indirectDiffuse *= upetFoldOcclusion;
reflectedLight.indirectSpecular *= mix(0.75, 1.0, upetFoldOcclusion);`);
}
