import { configureLiquidMetalShader } from './liquidMetalShader.js';
import { configureLiquidGlassShader } from './liquidGlassShader.js';
import { configureWaterShader } from './waterShader.js';
import { configureSilkShader } from './silkShader.js';

// Original procedural studio lights. No downloaded environment maps or artwork.
function studioEnvironment(THREE, renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0c1424');
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const materials = [];
  const panels = [
    { color: '#ffffff', strength: 8, position: [0, 1.05, 4], scale: [8, .8, .1], rotation: [0, 0, -.2] },
    { color: '#afdfff', strength: 2, position: [4, .2, 2], scale: [.4, 5, .1], rotation: [0, -.9, 0] },
    { color: '#fff2df', strength: 3, position: [-4, -1, 1], scale: [.5, 3, .1], rotation: [0, .9, 0] },
    { color: '#b2c7ff', strength: 2, position: [0, -3, -2], scale: [6, .4, .1], rotation: [.3, 0, .2] },
    { color: '#e5f3ff', strength: 5, position: [0, -.9, 4], scale: [8, .4, .1], rotation: [0, 0, -.2] },
  ];
  for (const panel of panels) {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(panel.color).multiplyScalar(panel.strength), side: THREE.DoubleSide });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...panel.position);
    mesh.scale.set(...panel.scale);
    mesh.rotation.set(...panel.rotation);
    scene.add(mesh);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  try { return generator.fromScene(scene, .025, .1, 50, { size: 128 }); }
  finally { generator.dispose(); geometry.dispose(); for (const material of materials) material.dispose(); }
}

function roundedPlate(THREE, width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.max(.005, Math.min(radius, width / 2, height / 2));
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .06, bevelEnabled: true, bevelSize: .02, bevelThickness: .025, bevelSegments: 3, steps: 1, curveSegments: 10 });
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let index = 0; index < uv.count; index++) uv.setXY(index, positions.getX(index) / width + .5, positions.getY(index) / height + .5);
  return geometry;
}

function brushNormalTexture(THREE) {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = Math.sin(x / size * Math.PI * 34) * .28 + Math.sin(x / size * Math.PI * 58) * .12;
    const nz = Math.sqrt(1 - nx * nx);
    const index = (y * size + x) * 4;
    pixels[index] = Math.round((nx * .5 + .5) * 255);
    pixels[index + 1] = 128;
    pixels[index + 2] = Math.round((nz * .5 + .5) * 255);
    pixels[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.center.set(.5, .5);
  texture.needsUpdate = true;
  return texture;
}

function roundedGridPlate(THREE, width, height, radius, segments) {
  const geometry = new THREE.PlaneGeometry(width, height, Math.max(16, Math.min(96, Math.round(segments * width / height))), segments);
  const positions = geometry.attributes.position;
  const r = Math.max(.005, Math.min(radius, width / 2, height / 2));
  const centerX = width / 2 - r;
  const centerY = height / 2 - r;
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const dx = Math.max(0, Math.abs(x) - centerX);
    const dy = Math.max(0, Math.abs(y) - centerY);
    const distance = Math.hypot(dx, dy);
    if (dx && dy && distance > r) positions.setXY(index, Math.sign(x) * (centerX + dx / distance * r), Math.sign(y) * (centerY + dy / distance * r));
  }
  return geometry;
}

function thinFilmTexture(THREE) {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / (size - 1);
    const v = y / (size - 1);
    const thickness = .5 + .3 * Math.sin(u * Math.PI * 2 + .5 * Math.sin(v * Math.PI * 2));
    const index = (y * size + x) * 4;
    pixels[index] = pixels[index + 2] = 128;
    pixels[index + 1] = Math.round(thickness * 255);
    pixels[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// A small original GPU-scene source, not a capture of the document or user media.
function lensBackdropTexture(THREE) {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size;
    const v = y / size;
    const stripe = Math.exp(-(((u - .28) / .04) ** 2)) + .7 * Math.exp(-(((u - .76) / .07) ** 2));
    const orb = Math.exp(-(((u - .6) / .3) ** 2 + ((v - .6) / .22) ** 2));
    const index = (y * size + x) * 4;
    pixels[index] = Math.min(255, Math.round(8 + stripe * 42 + orb * 24));
    pixels[index + 1] = Math.min(255, Math.round(15 + stripe * 65 + orb * 45));
    pixels[index + 2] = Math.min(255, Math.round(26 + stripe * 100 + orb * 55));
    pixels[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createPhysicalSurfaceScene({ THREE, resources, renderer, readSettings }) {
  const scene = new THREE.Scene();
  const environment = resources.shared('upet/original-studio-environment/128/v1', () => studioEnvironment(THREE, renderer));
  scene.environment = environment.texture;
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 30);
  camera.position.z = 3.2;
  const material = resources.own(new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: .18, clearcoat: .12, clearcoatRoughness: .2 }));
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  // The temporary empty geometry has no GPU allocation and is replaced at first update.
  mesh.geometry.dispose();
  const light = new THREE.DirectionalLight('#ffffff', 2);
  scene.add(mesh, light, new THREE.AmbientLight('#b9d8ff', .25));
  let geometry;
  let geometryKey = '';
  let brushTexture;
  let filmTexture;
  let backdrop;
  let glassEnabled = false;
  let waterEnabled = false;
  let lastRippleSequence = readSettings().ripple?.sequence || 0;
  let rippleIndex = 0;
  let compiledShader;
  const transmissionTargets = new Set();
  let foldsEnabled = false;
  let fabricEnabled = false;
  let flowPhase = 0;
  let previousTime = null;
  const uniforms = {
    upetTime: { value: 0 },
    upetWaveAmplitude: { value: .045 },
    upetWaveFrequency: { value: 3 },
    upetLensHalfSize: { value: new THREE.Vector2(1, 1) },
    upetLensCurvature: { value: .65 },
    upetLensRadius: { value: .15 },
    upetLensEdgeWidth: { value: .32 },
    upetLensWaveStrength: { value: .2 },
    upetRipples: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, -1, 0)) },
    upetRippleRadius: { value: .2 },
    upetRippleDamping: { value: 1.5 },
    upetRippleSpeed: { value: .7 },
    upetFabricContrast: { value: .75 },
  };
  material.onBeforeCompile = (shader) => {
    compiledShader = shader;
    // Original related heightfields, with an anisotropic cloth domain rather
    // than relabelling metal's physical response or its CSS fallback.
    if (foldsEnabled && !fabricEnabled) configureLiquidMetalShader(shader, uniforms);
    if (fabricEnabled) configureSilkShader(shader, uniforms);
    if (glassEnabled) configureLiquidGlassShader(shader, uniforms);
    if (waterEnabled) configureWaterShader(shader, uniforms);
  };
  material.customProgramCacheKey = () => fabricEnabled ? 'upet-silk-folds-v1' : foldsEnabled ? 'upet-coherent-folds-v1' : glassEnabled ? 'upet-liquid-glass-v2' : waterEnabled ? 'upet-water-v1' : 'upet-physical-surface-v1';
  mesh.onAfterRender = () => {
    // Three's native volume-transmission pass allocates per scene/camera. Adopt
    // its documented Texture.renderTarget reference into our scope so switching
    // to Lite/unmount/context loss releases the entire framebuffer, not just a map.
    const target = compiledShader?.uniforms.transmissionSamplerMap?.value?.renderTarget;
    if (target && !transmissionTargets.has(target)) { transmissionTargets.add(target); resources.own(target); }
  };
  return { scene, camera, update({ time, width, height, quality, motionEnabled }) {
    const settings = readSettings();
    const aspect = width / height;
    const liquid = settings.id === 'liquid-metal';
    const silk = settings.id === 'silk';
    const folded = liquid || silk;
    const holographic = settings.id === 'holographic';
    const glass = settings.id === 'liquid-glass';
    const water = settings.id === 'water';
    const refractive = glass || water;
    const segments = quality.tier === 'ultra' ? 96 : quality.tier === 'high' ? 64 : 32;
    if (folded !== foldsEnabled) { foldsEnabled = folded; material.needsUpdate = true; }
    if (silk !== fabricEnabled) { fabricEnabled = silk; material.needsUpdate = true; }
    if (glass !== glassEnabled) { glassEnabled = glass; material.needsUpdate = true; }
    if (water !== waterEnabled) {
      waterEnabled = water; material.needsUpdate = true;
      for (const ring of uniforms.upetRipples.value) ring.set(0, 0, -1, 0);
      lastRippleSequence = settings.ripple?.sequence || 0;
    }
    const key = `${Math.round(width)}:${Math.round(height)}:${settings.radius}:${folded}:${holographic}:${glass}:${water}:${folded || refractive ? segments : 0}`;
    if (key !== geometryKey) {
      if (geometry) resources.release(geometry);
      // Overscan the moving face so a receding wave cannot expose a dark gap
      // inside the native rounded clipping mask.
      const plateHeight = folded || holographic || refractive ? 2.14 : 1.94;
      const plateWidth = Math.max(.12, aspect * plateHeight);
      const radius = settings.radius / height * plateHeight;
      geometry = resources.own(folded || refractive ? roundedGridPlate(THREE, plateWidth, plateHeight, radius, segments) : roundedPlate(THREE, plateWidth, plateHeight, radius));
      uniforms.upetLensHalfSize.value.set(plateWidth / 2, plateHeight / 2);
      uniforms.upetLensRadius.value = Math.max(.005, Math.min(radius, plateWidth / 2, plateHeight / 2));
      mesh.geometry = geometry;
      geometryKey = key;
    }
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    material.color.set(settings.tint);
    material.metalness = refractive || silk ? 0 : holographic ? .75 : 1;
    material.clearcoat = silk ? 0 : glass ? .6 : .12;
    material.sheen = silk ? settings.sheen : 0;
    material.sheenColor.set('#ffffff');
    if (silk) material.sheenColor.lerp(material.color, .25);
    material.sheenRoughness = settings.sheenRoughness;
    material.transmission = refractive ? settings.transmission : 0;
    material.ior = refractive ? settings.ior : 1.5;
    material.thickness = refractive ? settings.thickness : 0;
    material.dispersion = refractive ? settings.dispersion : 0;
    material.attenuationColor.set(refractive ? settings.tint : '#ffffff');
    material.attenuationDistance = refractive ? 2 : Infinity;
    uniforms.upetLensCurvature.value = settings.lensCurvature;
    uniforms.upetLensEdgeWidth.value = settings.lensEdgeWidth;
    uniforms.upetLensWaveStrength.value = settings.lensWaveStrength;
    if (refractive && !backdrop) {
      const map = resources.shared('upet/original-lens-backdrop/128/v1', () => lensBackdropTexture(THREE));
      backdrop = new THREE.Mesh(resources.own(new THREE.PlaneGeometry(1, 1)), resources.own(new THREE.MeshBasicMaterial({ map })));
      backdrop.position.z = -.6;
      scene.add(backdrop);
    }
    if (backdrop) {
      backdrop.visible = refractive;
      backdrop.scale.set(aspect * 3, 3, 1);
    }
    if (refractive && renderer) {
      const maxSize = Math.min(quality.budget.maxTextureSize, quality.tier === 'balanced' ? 512 : 1024);
      renderer.transmissionResolutionScale = Math.min(.5, maxSize / (Math.max(width, height) * renderer.getPixelRatio()));
    }
    material.roughness = settings.roughness;
    material.envMapIntensity = settings.reflection;
    const speed = folded || water ? settings.flowSpeed : holographic ? settings.shimmerSpeed : glass && settings.lensWaveStrength > 0 ? settings.lensWaveSpeed : 0;
    let elapsed = 0;
    if (motionEnabled && speed > 0) {
      if (previousTime !== null) elapsed = Math.max(0, Math.min(.1, time - previousTime)) * speed;
      // Common period for the coherent metal/fabric waves and .35/.28 lens waves.
      flowPhase = (flowPhase + elapsed) % (200 * Math.PI);
      previousTime = time;
    } else previousTime = null;
    uniforms.upetTime.value = flowPhase;
    uniforms.upetWaveAmplitude.value = settings.waveAmplitude;
    uniforms.upetWaveFrequency.value = settings.waveFrequency;
    uniforms.upetFabricContrast.value = settings.fabricContrast * Math.min(1, settings.waveAmplitude / .12);
    uniforms.upetRippleRadius.value = settings.rippleRadius;
    uniforms.upetRippleDamping.value = settings.rippleDamping;
    uniforms.upetRippleSpeed.value = settings.rippleSpeed;
    if (water) {
      for (const ring of uniforms.upetRipples.value) {
        if (ring.z >= 0) { ring.z += elapsed * 3; if (ring.z > 8) ring.set(0, 0, -1, 0); }
      }
      if (settings.ripple && settings.ripple.sequence !== lastRippleSequence) {
        lastRippleSequence = settings.ripple.sequence;
        if (motionEnabled) {
          const halfSize = uniforms.upetLensHalfSize.value;
          uniforms.upetRipples.value[rippleIndex].set(settings.ripple.x * halfSize.x, settings.ripple.y * halfSize.y, 0, 1);
          rippleIndex = (rippleIndex + 1) % 4;
        }
      }
    }
    const brushed = settings.id === 'brushed-steel';
    if ((brushed || silk) && !brushTexture) brushTexture = resources.own(brushNormalTexture(THREE));
    const nextMap = brushed || silk ? brushTexture : null;
    if (material.normalMap !== nextMap) { material.normalMap = nextMap; material.needsUpdate = true; }
    const anisotropy = brushed ? settings.brushStrength : silk ? settings.fabricAnisotropy : 0;
    if ((material.anisotropy > 0) !== (anisotropy > 0)) material.needsUpdate = true;
    material.anisotropy = anisotropy;
    material.anisotropyRotation = settings.brushDirection * Math.PI / 180;
    material.normalScale.setScalar(brushed ? settings.brushStrength * .6 : silk ? settings.fabricGrain * .12 : 0);
    if (brushTexture) brushTexture.rotation = settings.brushDirection * Math.PI / 180;
    if (holographic && !filmTexture) filmTexture = resources.shared('upet/original-thin-film/64/v1', () => thinFilmTexture(THREE));
    const nextFilmMap = holographic ? filmTexture : null;
    if (material.iridescenceThicknessMap !== nextFilmMap) { material.iridescenceThicknessMap = nextFilmMap; material.needsUpdate = true; }
    material.iridescence = holographic ? settings.iridescence : 0;
    material.iridescenceIOR = settings.filmIOR;
    material.iridescenceThicknessRange[0] = settings.filmThickness - 80;
    material.iridescenceThicknessRange[1] = settings.filmThickness + 80;
    const pointer = quality.reducedMotion ? { x: 0, y: 0 } : settings.pointer;
    mesh.rotation.set(holographic ? pointer.y * .035 : glass ? pointer.y * settings.pointerIntensity * .04 : 0, holographic ? pointer.x * .05 : glass ? pointer.x * settings.pointerIntensity * .06 : 0, 0);
    scene.environmentRotation.y = holographic ? Math.sin(flowPhase) * .15 : 0;
    const azimuth = (settings.lightAzimuth + pointer.x * 10) * Math.PI / 180;
    const elevation = (settings.lightElevation + pointer.y * 4) * Math.PI / 180;
    light.position.set(Math.cos(azimuth) * Math.cos(elevation) * 4, Math.sin(elevation) * 4, Math.sin(azimuth) * Math.cos(elevation) * 4 + 4);
  } };
}
