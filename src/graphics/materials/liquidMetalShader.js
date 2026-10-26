// Fixed, original coherent wave field. Profile data supplies bounded numbers,
// never shader source. Analytic derivatives keep the reflected normals smooth.
export function configureLiquidMetalShader(shader, uniforms) {
  for (const chunk of ['common', 'beginnormal_vertex', 'begin_vertex']) {
    if (!shader.vertexShader.includes(`#include <${chunk}>`)) throw new Error('Unsupported physical material shader version.');
  }
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
uniform float upetTime;
uniform float upetWaveAmplitude;
uniform float upetWaveFrequency;
vec3 upetLiquidWave(vec2 p) {
  float f = upetWaveFrequency;
  float t = upetTime;
  float a = p.x * f + t;
  float b = p.y * f * 0.8 - t * 0.7;
  float c = p.x * f * 0.7 + p.y * f * 0.6 + t * 0.5;
  float h = upetWaveAmplitude * (sin(a) * 0.6 + sin(b) * 0.4 + sin(c) * 0.25);
  float dx = upetWaveAmplitude * f * (cos(a) * 0.6 + cos(c) * 0.175);
  float dy = upetWaveAmplitude * f * (cos(b) * 0.32 + cos(c) * 0.15);
  return vec3(h, dx, dy);
}`)
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
vec3 upetWaveState = upetLiquidWave(position.xy);
objectNormal = normalize(vec3(-upetWaveState.y, -upetWaveState.z, 1.0));`)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += upetWaveState.x;');
}
