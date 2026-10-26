import { configureLiquidMetalShader } from './liquidMetalShader.js';

// Analytic damped ring derivatives added to the coherent base wave. Four rings
// maximum, no frame-to-frame noise, feedback texture or full-fluid simulation.
export function configureWaterShader(shader, uniforms) {
  configureLiquidMetalShader(shader, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('vec3 upetLiquidWave(vec2 p) {', `
uniform vec4 upetRipples[4];
uniform float upetRippleRadius;
uniform float upetRippleDamping;
uniform float upetRippleSpeed;
vec3 upetWaterRipples(vec2 p) {
  vec3 wave = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 ring = upetRipples[i];
    if (ring.z < 0.0) continue;
    vec2 delta = p - ring.xy;
    float distance = max(length(delta), 0.001);
    float offset = distance - ring.z * upetRippleSpeed;
    float radiusSquared = upetRippleRadius * upetRippleRadius;
    float frequency = upetWaveFrequency * 5.0;
    float envelope = exp(-ring.z * upetRippleDamping - offset * offset / radiusSquared);
    float amplitude = ring.w * upetWaveAmplitude;
    float h = amplitude * sin(offset * frequency) * envelope;
    float slope = amplitude * envelope * (frequency * cos(offset * frequency) - 2.0 * offset / radiusSquared * sin(offset * frequency));
    wave += vec3(h, slope * delta / distance);
  }
  return wave;
}
vec3 upetLiquidWave(vec2 p) {`)
    .replace('vec3 upetWaveState = upetLiquidWave(position.xy);', 'vec3 upetWaveState = upetLiquidWave(position.xy) + upetWaterRipples(position.xy);');
}
