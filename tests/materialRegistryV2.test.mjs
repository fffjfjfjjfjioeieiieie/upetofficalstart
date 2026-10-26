import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createPhysicalSurfaceScene } from '../src/graphics/materials/physicalSurfaceScene.js';
import { assertProfileMaterialConfigs, createMaterialConfig, isGlassMaterial, isGpuMaterial, materialConfigSchema, MATERIAL_VARIANTS, normalizeMaterialConfig, normalizeMaterialVariant } from '../src/graphics/materials/materialRegistry.js';
import { createEmptyProfileDocumentV2 } from '../src/shared/contracts/profileV2.js';
import { createPublicProfileProjectionV2 } from '../src/shared/contracts/publicProfileV2.js';
import { createStudioBlock } from '../src/features/studio/v2/studioDocumentOps.js';

test('material choices have stable unique IDs and untrusted names fall back to matte', () => {
  const ids = MATERIAL_VARIANTS.map((variant) => variant.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ['matte', 'crystal', 'frosted', 'smoked-glass', 'tinted-glass', 'liquid-glass', 'water', 'silk', 'chrome', 'brushed-steel', 'gold', 'rose-gold', 'dark-metal', 'liquid-metal', 'holographic']);
  assert.equal(normalizeMaterialVariant('chrome'), 'chrome');
  assert.equal(normalizeMaterialVariant('javascript:evil()'), 'matte');
});

test('metal defaults are physically distinct and brush controls stay bounded', () => {
  const metals = ['chrome', 'brushed-steel', 'gold', 'rose-gold', 'dark-metal'].map(createMaterialConfig);
  assert.equal(new Set(metals.map((material) => material.tint)).size, metals.length);
  assert.ok(metals[1].roughness > metals[0].roughness);
  assert.throws(() => materialConfigSchema.parse({ id: 'brushed-steel', brushStrength: 20 }));
  assert.throws(() => materialConfigSchema.parse({ id: 'brushed-steel', brushDirection: 999 }));
});

test('DOM glass has distinct diffusion/absorption defaults and bounded rim/grain controls', () => {
  const clear = createMaterialConfig('crystal');
  const frosted = createMaterialConfig('frosted');
  const smoked = createMaterialConfig('smoked-glass');
  const tinted = createMaterialConfig('tinted-glass');
  assert.equal(clear.grain, 0);
  assert.ok(frosted.blur > clear.blur);
  assert.ok(smoked.opacity > clear.opacity);
  assert.notEqual(tinted.tint, smoked.tint);
  assert.ok([clear, frosted, smoked, tinted].every((material) => isGlassMaterial(material.id)));
  assert.throws(() => materialConfigSchema.parse({ id: 'crystal', edgeWidth: 100 }));
  assert.throws(() => materialConfigSchema.parse({ id: 'crystal', edgeDepth: -1 }));
  assert.throws(() => materialConfigSchema.parse({ id: 'frosted', grain: Infinity }));
});

test('liquid metal limits wave geometry and permits an explicit stopped flow', () => {
  const material = createMaterialConfig('liquid-metal');
  assert.ok(material.waveAmplitude > 0 && material.waveAmplitude <= .12);
  assert.doesNotThrow(() => materialConfigSchema.parse({ ...material, flowSpeed: 0 }));
  assert.throws(() => materialConfigSchema.parse({ ...material, waveAmplitude: 1 }));
  assert.throws(() => materialConfigSchema.parse({ ...material, waveFrequency: 1000 }));
  assert.throws(() => materialConfigSchema.parse({ ...material, flowSpeed: Infinity }));
});

test('holographic uses the physical backend and bounds its optical settings', () => {
  const material = createMaterialConfig('holographic');
  assert.equal(isGpuMaterial('holographic'), true);
  assert.equal(isGpuMaterial('frosted'), false);
  assert.ok(material.iridescence > 0);
  for (const invalid of [{ iridescence: 2 }, { filmThickness: -1 }, { filmIOR: 0 }, { shimmerSpeed: Infinity }]) {
    assert.throws(() => materialConfigSchema.parse({ ...material, ...invalid }));
  }
  assert.doesNotThrow(() => materialConfigSchema.parse({ ...material, shimmerSpeed: 0, iridescence: 0 }));
});

test('physical liquid glass bounds transmission, lens shape and optical controls', () => {
  const glass = createMaterialConfig('liquid-glass');
  assert.equal(isGpuMaterial(glass.id), true);
  assert.equal(isGlassMaterial(glass.id), false, 'physical glass is not ordinary DOM glass');
  for (const invalid of [{ lensCurvature: 20 }, { transmission: -1 }, { ior: 10 }, { thickness: Infinity }, { dispersion: 2 }, { pointerIntensity: 10 }]) {
    assert.throws(() => materialConfigSchema.parse({ ...glass, ...invalid }));
  }
});

test('water bounds damped ripple settings and uses the physical backend', () => {
  const water = createMaterialConfig('water');
  assert.equal(isGpuMaterial(water.id), true);
  assert.equal(water.ior, 1.33);
  for (const invalid of [{ rippleRadius: 0 }, { rippleDamping: -1 }, { rippleSpeed: 1000 }]) {
    assert.throws(() => materialConfigSchema.parse({ ...water, ...invalid }));
  }
});

test('silk uses nonmetal physical sheen/fibres and clears fabric settings on metal switch', () => {
  let settings = { ...createMaterialConfig('silk'), pointer: { x: 0, y: 0 } };
  assert.equal(isGpuMaterial('silk'), true);
  for (const invalid of [{ sheen: 2 }, { sheenRoughness: 0 }, { fabricAnisotropy: -1 }, { fabricGrain: Infinity }, { fabricContrast: 2 }]) {
    assert.throws(() => materialConfigSchema.parse({ ...settings, ...invalid }));
  }
  const owned = new Set();
  const environment = new THREE.Texture();
  const surface = createPhysicalSurfaceScene({ THREE, readSettings: () => settings, resources: {
    own(resource) { owned.add(resource); return resource; },
    release(resource) { owned.delete(resource); resource.dispose(); },
    shared() { return { texture: environment }; },
  } });
  const frame = { time: 1, width: 480, height: 600, quality: { tier: 'high', reducedMotion: false }, motionEnabled: true };
  try {
    surface.update(frame);
    const mesh = surface.scene.children.find((child) => child.isMesh);
    assert.equal(mesh.material.metalness, 0);
    assert.equal(mesh.material.transmission, 0);
    assert.equal(mesh.material.clearcoat, 0);
    assert.equal(mesh.material.sheen, settings.sheen);
    assert.equal(mesh.material.sheenRoughness, settings.sheenRoughness);
    assert.equal(mesh.material.anisotropy, settings.fabricAnisotropy);
    assert.ok(mesh.material.normalMap.isDataTexture);
    const shader = { vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader, uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.physical.uniforms) };
    mesh.material.onBeforeCompile(shader);
    assert.ok(shader.vertexShader.includes('upetLiquidWave(vec2(position.x * 1.7, position.y * 0.35))'));
    surface.update({ ...frame, time: 1.1 });
    assert.ok(shader.uniforms.upetTime.value > 0);
    const phase = shader.uniforms.upetTime.value;
    surface.update({ ...frame, time: 2, motionEnabled: false });
    assert.equal(shader.uniforms.upetTime.value, phase);
    settings = { ...createMaterialConfig('chrome'), pointer: { x: 0, y: 0 } };
    surface.update(frame);
    assert.equal(mesh.material.sheen, 0);
    assert.equal(mesh.material.anisotropy, 0);
    assert.equal(mesh.material.normalMap, null);
    assert.equal(mesh.material.metalness, 1);
  } finally { for (const resource of owned) resource.dispose(); environment.dispose(); }
});

test('water has four bounded analytic rings, damping controls and frozen/expired states', () => {
  let settings = { ...createMaterialConfig('water'), flowSpeed: 1, pointer: { x: 0, y: 0 }, ripple: { sequence: 0, x: 0, y: 0 } };
  const owned = new Set();
  const environment = new THREE.Texture();
  const shared = new Map();
  const surface = createPhysicalSurfaceScene({ THREE, readSettings: () => settings, resources: {
    own(resource) { owned.add(resource); return resource; },
    release(resource) { owned.delete(resource); resource.dispose(); },
    shared(key, factory) {
      if (key.includes('studio-environment')) return { texture: environment };
      if (!shared.has(key)) shared.set(key, factory());
      return shared.get(key);
    },
  } });
  const frame = { time: 1, width: 480, height: 600, quality: { tier: 'high', reducedMotion: false }, motionEnabled: true };
  try {
    surface.update(frame);
    const mesh = surface.scene.children.find((child) => child.isMesh && child.material.isMeshPhysicalMaterial);
    const shader = { vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader, uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.physical.uniforms) };
    mesh.material.onBeforeCompile(shader);
    assert.ok(shader.vertexShader.includes('upetLiquidWave(position.xy) + upetWaterRipples(position.xy)'));
    assert.ok(shader.vertexShader.indexOf('uniform float upetWaveFrequency') < shader.vertexShader.indexOf('vec3 upetWaterRipples'));
    const rings = shader.uniforms.upetRipples.value;
    assert.equal(rings.length, 4);
    assert.ok(rings.every((ring) => ring.z === -1));
    for (let sequence = 1; sequence <= 8; sequence++) {
      settings.ripple = { sequence, x: .5, y: -.5 };
      surface.update({ ...frame, time: 1 + sequence * .1 });
    }
    assert.ok(rings.every((ring) => ring.w === 1 && ring.z >= 0));
    assert.equal(shader.uniforms.upetRippleDamping.value, settings.rippleDamping);
    const ages = rings.map((ring) => ring.z);
    surface.update({ ...frame, time: 3, motionEnabled: false });
    assert.deepEqual(rings.map((ring) => ring.z), ages);
    for (let index = 0; index < 60; index++) surface.update({ ...frame, time: 3 + index * .1 });
    assert.ok(rings.every((ring) => ring.z === -1), 'rings expire rather than accumulating forever');
    settings = { ...createMaterialConfig('chrome'), pointer: { x: 0, y: 0 } };
    surface.update(frame);
    assert.equal(mesh.material.transmission, 0);
    assert.equal(mesh.material.customProgramCacheKey(), 'upet-physical-surface-v1');
  } finally {
    for (const resource of owned) resource.dispose();
    for (const resource of shared.values()) resource.dispose();
    environment.dispose();
  }
});

test('physical lens uses native transmission and adopts its render target for scoped cleanup', () => {
  let settings = { ...createMaterialConfig('liquid-glass'), pointer: { x: 0, y: 0 } };
  const owned = new Set();
  const environment = new THREE.Texture();
  const shared = new Map();
  const renderer = { transmissionResolutionScale: 1, getPixelRatio: () => 2 };
  const surface = createPhysicalSurfaceScene({ THREE, renderer, readSettings: () => settings, resources: {
    own(resource) { owned.add(resource); return resource; },
    release(resource) { owned.delete(resource); resource.dispose(); },
    shared(key, factory) {
      if (key.includes('studio-environment')) return { texture: environment };
      if (!shared.has(key)) shared.set(key, factory());
      return shared.get(key);
    },
  } });
  const frame = { time: 1, width: 1500, height: 2000, quality: { tier: 'balanced', reducedMotion: true, budget: { maxTextureSize: 1024 } }, motionEnabled: false };
  try {
    surface.update(frame);
    const mesh = surface.scene.children.find((child) => child.isMesh && child.material.isMeshPhysicalMaterial);
    assert.equal(mesh.material.metalness, 0);
    assert.equal(mesh.material.opacity, 1);
    assert.equal(mesh.material.transmission, settings.transmission);
    assert.equal(mesh.material.ior, settings.ior);
    assert.equal(mesh.material.thickness, settings.thickness);
    assert.equal(mesh.material.dispersion, settings.dispersion);
    assert.ok(renderer.transmissionResolutionScale * 2000 * 2 <= 512);
    const shader = { vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader, uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.physical.uniforms) };
    mesh.material.onBeforeCompile(shader);
    assert.ok(shader.vertexShader.includes('upetLensState'));
    const target = new THREE.WebGLRenderTarget(32, 32);
    shader.uniforms.transmissionSamplerMap.value = target.texture;
    mesh.onAfterRender();
    mesh.onAfterRender();
    assert.ok(owned.has(target));
    let released = 0;
    target.addEventListener('dispose', () => released++);
    settings = { ...createMaterialConfig('chrome'), pointer: { x: 0, y: 0 } };
    surface.update(frame);
    assert.equal(mesh.material.transmission, 0);
    assert.equal(mesh.material.dispersion, 0);
    for (const resource of owned) resource.dispose();
    owned.clear();
    assert.equal(released, 1, 'owned transmission framebuffer is released exactly once');
  } finally {
    for (const resource of owned) resource.dispose();
    for (const resource of shared.values()) resource.dispose();
    environment.dispose();
  }
});

test('shared PBR scene applies thin-film optics and clears them when switching back to metal', () => {
  let settings = { ...createMaterialConfig('holographic'), pointer: { x: .5, y: .5 } };
  const owned = new Set();
  const environment = new THREE.Texture();
  const shared = new Map();
  const resources = {
    own(resource) { owned.add(resource); return resource; },
    release(resource) { owned.delete(resource); resource.dispose(); },
    shared(key, factory) {
      if (key.includes('studio-environment')) return { texture: environment };
      if (!shared.has(key)) shared.set(key, factory());
      return shared.get(key);
    },
  };
  const surface = createPhysicalSurfaceScene({ THREE, resources, readSettings: () => settings });
  const frame = { time: 1, width: 480, height: 600, quality: { tier: 'high', reducedMotion: false }, motionEnabled: true };
  try {
    surface.update(frame);
    const mesh = surface.scene.children.find((child) => child.isMesh);
    assert.equal(mesh.material.isMeshPhysicalMaterial, true);
    assert.equal(mesh.material.iridescence, settings.iridescence);
    assert.equal(mesh.material.iridescenceIOR, settings.filmIOR);
    assert.deepEqual(mesh.material.iridescenceThicknessRange, [300, 460]);
    assert.equal(mesh.material.iridescenceThicknessMap.image.width, 64);
    assert.ok(mesh.rotation.y > 0);
    surface.update({ ...frame, time: 1.1 });
    assert.ok(surface.scene.environmentRotation.y > 0);
    const angle = surface.scene.environmentRotation.y;
    surface.update({ ...frame, time: 2, motionEnabled: false, quality: { ...frame.quality, reducedMotion: true } });
    assert.equal(surface.scene.environmentRotation.y, angle);
    assert.equal(mesh.rotation.y, 0);
    settings = { ...createMaterialConfig('chrome'), pointer: { x: 0, y: 0 } };
    surface.update({ ...frame, time: 3 });
    assert.equal(mesh.material.iridescence, 0);
    assert.equal(mesh.material.iridescenceThicknessMap, null);
    assert.equal(mesh.material.metalness, 1);
    assert.equal(surface.scene.environmentRotation.y, 0);
  } finally {
    for (const resource of owned) resource.dispose();
    for (const resource of shared.values()) resource.dispose();
    environment.dispose();
  }
});

test('ID-only materials resolve to identical family defaults in owner and published views', () => {
  for (const { id } of MATERIAL_VARIANTS) {
    const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner', username: 'family-defaults', nowMs: 1 });
    profile.status = 'published';
    profile.theme.material = { id };
    assert.deepEqual(createPublicProfileProjectionV2(profile).theme.material, normalizeMaterialConfig({ id }), id);
  }
});

test('material controls reject dangerous/unsupported writes and safely normalize untrusted reads', () => {
  assert.throws(() => materialConfigSchema.parse({ id: 'chrome', roughness: -1 }));
  assert.throws(() => materialConfigSchema.parse({ id: 'chrome', tint: 'url(javascript:evil)' }));
  assert.throws(() => materialConfigSchema.parse({ id: 'injected-shader' }));
  assert.throws(() => materialConfigSchema.parse({ id: 'chrome', reflection: Infinity }));
  const fallback = normalizeMaterialConfig(JSON.parse('{"id":"chrome","constructor":"evil","roughness":-1,"tint":"red","shader":"discard"}'));
  assert.equal(fallback.id, 'chrome');
  assert.equal(fallback.roughness, .2);
  assert.equal(fallback.tint, '#c9d5df');
  assert.equal(Object.hasOwn(fallback, 'shader'), false);
});

test('theme and per-layer material controls survive public projection without private extensions', () => {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner', username: 'materials', nowMs: 1 });
  profile.status = 'published';
  profile.theme.material = { ...createMaterialConfig('chrome'), roughness: .4, privateExtension: 'never public' };
  const block = createStudioBlock('heading', { id: 'heading' });
  block.style.material = { ...createMaterialConfig('crystal'), blur: 25, privateExtension: 'never public' };
  profile.pages[0].blocks.push(block);
  assert.doesNotThrow(() => assertProfileMaterialConfigs(profile));
  const projected = createPublicProfileProjectionV2(profile);
  assert.equal(projected.theme.material.roughness, .4);
  assert.equal(projected.pages[0].blocks[0].style.material.blur, 25);
  assert.equal(JSON.stringify(projected).includes('privateExtension'), false);
  block.style.material.radius = 1000;
  assert.throws(() => assertProfileMaterialConfigs(profile));
});
