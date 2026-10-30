import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { glslChunks } from '../../effects/glsl.js';
import styles from './PublicHome.module.css';

const vertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 p = position;
    float wave = sin(p.y * 3.4 + uTime * .42) * .025 + sin(p.x * 4.1 - uTime * .32) * .018;
    p += normal * wave;
    vPosition = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

// Uses the same hash/noise/color building blocks as the Studio v2 effects engine.
const fragmentShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uLowPower;
  ${glslChunks.hashes}
  ${glslChunks.noise}
  ${glslChunks.color}
  void main() {
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - abs(normal.z), 2.3);
    vec2 p = (vUv - .5) * 2.0;
    float caustic = sin((p.x + normal.x * .4) * 12.0 + uTime) * sin((p.y - normal.y * .35) * 10.0 - uTime * .7);
    caustic = smoothstep(.35, .98, caustic) * (1.0 - uLowPower);
    float pointerLight = 1.0 - smoothstep(.05, .9, distance(vUv, uPointer));
    float grain = gradientNoise(vUv * 8.0 + uTime * .015) * .06;
    vec3 ink = vec3(.047, .035, .062);
    vec3 violet = vec3(.62, .52, .84);
    vec3 acid = vec3(.71, 1.0, .34);
    float dispersion = normal.x * .08 * (1.0 - uLowPower);
    vec3 glass = mix(ink, violet, .12 + fresnel * .42 + grain);
    glass.r += max(0.0, dispersion);
    glass.b += max(0.0, -dispersion) * .9;
    glass = blendScreen(glass, violet * caustic * .42);
    glass = blendScreen(glass, acid * pointerLight * .07);
    float alpha = .08 + fresnel * .48 + caustic * .13;
    gl_FragColor = vec4(glass, alpha);
  }
`;

export default function GlassScene() {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (window.innerWidth < 700) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !coarse, powerPreference: coarse ? 'low-power' : 'high-performance' });
    } catch { return undefined; }
    const context = renderer.getContext();
    const rendererInfo = context.getExtension('WEBGL_debug_renderer_info');
    const gpuName = rendererInfo ? context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) : '';
    if (/swiftshader|llvmpipe|software/i.test(gpuName)) { renderer.dispose(); return undefined; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 20); camera.position.z = 4.4;
    const uniforms = { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2(.5, .5) }, uLowPower: { value: coarse ? 1 : 0 } };
    const geometry = new THREE.SphereGeometry(1.38, coarse ? 32 : 64, coarse ? 20 : 48);
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending });
    const orb = new THREE.Mesh(geometry, material); orb.scale.set(1.15, 1.15, .55); scene.add(orb);
    renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 2));
    renderer.domElement.className = styles.glassCanvas; renderer.domElement.setAttribute('aria-hidden', 'true'); mount.appendChild(renderer.domElement);
    let width = 0; let height = 0; let frame = 0; let visible = true; let pageVisible = !document.hidden; let last = performance.now();
    const resize = () => { const rect = mount.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
    const pointer = (event) => { const rect = mount.getBoundingClientRect(); uniforms.uPointer.value.set((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height); mount.style.setProperty('--scene-x', String(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)))); mount.style.setProperty('--scene-y', String(Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)))); };
    const render = (now) => { frame = 0; if (!visible || !pageVisible) return; const delta = Math.min(40, now - last); last = now; uniforms.uTime.value += delta / 1000; orb.rotation.y += delta * .00007; orb.rotation.x = Math.sin(now * .00018) * .07; renderer.render(scene, camera); frame = requestAnimationFrame(render); };
    const start = () => { if (!frame && visible && pageVisible) { last = performance.now(); frame = requestAnimationFrame(render); } };
    const visibility = () => { pageVisible = !document.hidden; if (pageVisible) start(); else { cancelAnimationFrame(frame); frame = 0; } };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else { cancelAnimationFrame(frame); frame = 0; } }, { threshold: .01 });
    observer.observe(mount); resize(); start();
    window.addEventListener('resize', resize, { passive: true }); mount.addEventListener('pointermove', pointer, { passive: true }); document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', resize); mount.removeEventListener('pointermove', pointer); document.removeEventListener('visibilitychange', visibility); geometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <div ref={mountRef} className={styles.glassCanvas} aria-hidden="true" />;
}
