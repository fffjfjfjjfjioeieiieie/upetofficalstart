// Rounded-distance lens geometry. Refraction remains Three.js's native volume
// transmission; this shader never samples the HTML behind the canvas.
export function configureLiquidGlassShader(shader, uniforms = {}) {
  const chunks = ['common', 'beginnormal_vertex', 'begin_vertex'];
  for (const chunk of chunks) {
    if (!shader.vertexShader.includes(`#include <${chunk}>`)) {
      throw new Error(`Unsupported physical lens shader chunk: ${chunk}`);
    }
  }

  // Defaults also make isolated shader previews safe. Preserve caller-owned
  // uniform objects: the shared scheduler updates them without recompilation.
  Object.assign(shader.uniforms, {
    upetLensHalfSize: { value: [1, 1] },
    upetLensCurvature: { value: .65 },
    upetLensRadius: { value: .15 },
    upetLensEdgeWidth: { value: .32 },
    upetTime: { value: 0 },
    upetLensWaveStrength: { value: .2 },
  }, uniforms);

  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
uniform vec2 upetLensHalfSize;
uniform float upetLensCurvature;
uniform float upetLensRadius;
uniform float upetLensEdgeWidth;
uniform float upetTime;
uniform float upetLensWaveStrength;

float upetRoundedLensDistance(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

float upetGlassHeight(vec2 p) {
  vec2 halfSize = max(upetLensHalfSize, vec2(0.001));
  float scale = min(halfSize.x, halfSize.y);
  float radius = clamp(upetLensRadius, 0.001, scale);
  float rimWidth = max(scale * upetLensEdgeWidth, 0.001);
  float inside = -upetRoundedLensDistance(p, halfSize, radius);
  float bevel = smoothstep(0.0, rimWidth, inside);
  float surface = upetLensCurvature * 0.18 * bevel;

  vec2 uv = p / halfSize;
  float waveA = sin(uv.x * 7.0 + upetTime * 0.35);
  float waveB = sin(uv.y * 8.0 - upetTime * 0.28);
  float waveMask = smoothstep(rimWidth * 0.2, rimWidth * 1.8, inside);
  return surface + waveA * waveB * scale * 0.01 * upetLensWaveStrength * waveMask;
}

vec3 upetGlassNormal(vec2 p) {
  vec2 e = max(upetLensHalfSize * 0.002, vec2(0.0001));
  float dx = (upetGlassHeight(p + vec2(e.x, 0.0))
    - upetGlassHeight(p - vec2(e.x, 0.0))) / (2.0 * e.x);
  float dy = (upetGlassHeight(p + vec2(0.0, e.y))
    - upetGlassHeight(p - vec2(0.0, e.y))) / (2.0 * e.y);
  return normalize(vec3(-dx, -dy, 1.0));
}`)
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
objectNormal = upetGlassNormal(position.xy);`)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += upetGlassHeight(position.xy);');
}
