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
  return new THREE.ExtrudeGeometry(shape, { depth: .06, bevelEnabled: true, bevelSize: .02, bevelThickness: .025, bevelSegments: 3, steps: 1, curveSegments: 10 });
}

export function createChromeScene({ THREE, resources, renderer, readSettings }) {
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
  return { scene, camera, update({ width, height, quality }) {
    const settings = readSettings();
    const aspect = width / height;
    const key = `${Math.round(width)}:${Math.round(height)}:${settings.radius}`;
    if (key !== geometryKey) {
      if (geometry) resources.release(geometry);
      geometry = resources.own(roundedPlate(THREE, Math.max(.12, aspect * 1.94), 1.94, settings.radius / height * 1.94));
      mesh.geometry = geometry;
      geometryKey = key;
    }
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    material.color.set(settings.tint);
    material.roughness = settings.roughness;
    material.envMapIntensity = settings.reflection;
    const pointer = quality.reducedMotion ? { x: 0, y: 0 } : settings.pointer;
    const azimuth = (settings.lightAzimuth + pointer.x * 10) * Math.PI / 180;
    const elevation = (settings.lightElevation + pointer.y * 4) * Math.PI / 180;
    light.position.set(Math.cos(azimuth) * Math.cos(elevation) * 4, Math.sin(elevation) * 4, Math.sin(azimuth) * Math.cos(elevation) * 4 + 4);
  } };
}
