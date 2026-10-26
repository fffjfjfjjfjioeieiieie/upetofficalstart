// Original rounded lens, with an almost flat centre and increasingly curved rim.
// Refraction itself remains Three.js MeshPhysicalMaterial's volume transmission.
export function configureLiquidGlassShader(shader, uniforms) {
  for (const chunk of ['common', 'beginnormal_vertex', 'begin_vertex']) {
    if (!shader.vertexShader.includes(`#include <${chunk}>`)) throw new Error('Unsupported physical lens shader version.');
  }
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
uniform vec2 upetLensHalfSize;
uniform float upetLensCurvature;
vec3 upetLens(vec2 p) {
  vec2 q = clamp(p / upetLensHalfSize, -1.0, 1.0);
  vec2 q2 = q * q;
  vec2 q4 = q2 * q2;
  float depth = upetLensCurvature * 0.18;
  float h = depth * (1.0 - q4.x) * (1.0 - q4.y);
  float dx = -4.0 * depth * q.x * q2.x * (1.0 - q4.y) / upetLensHalfSize.x;
  float dy = -4.0 * depth * q.y * q2.y * (1.0 - q4.x) / upetLensHalfSize.y;
  return vec3(h, dx, dy);
}`)
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
vec3 upetLensState = upetLens(position.xy);
objectNormal = normalize(vec3(-upetLensState.y, -upetLensState.z, 1.0));`)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += upetLensState.x;');
}
