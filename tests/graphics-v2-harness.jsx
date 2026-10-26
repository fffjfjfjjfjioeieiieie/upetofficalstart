import React, { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GraphicsProvider, useGraphicsContext } from '../src/graphics/core/GraphicsProvider.jsx';
import { GraphicsSceneHost, useGraphicsLayer } from '../src/graphics/core/GraphicsSceneHost.jsx';
import { graphicsContextCount } from '../src/graphics/core/graphicsEngine.js';
import { QUALITY_CHOICES } from '../src/graphics/quality/qualityPreferences.js';
import '../src/redesign/index.css';
import './graphics-v2-harness.css';

function diagnosticScene({ THREE, resources }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
  camera.position.z = 5;
  const geometry = resources.shared('test-torus', () => new THREE.TorusKnotGeometry(.65, .2, 64, 12));
  const material = resources.own(new THREE.MeshStandardMaterial({ color: '#70d7f3', metalness: .35, roughness: .35 }));
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh, new THREE.AmbientLight('#ffffff', 1.5));
  const light = new THREE.DirectionalLight('#ffffff', 3);
  light.position.set(3, 4, 5);
  scene.add(light);
  return { scene, camera, update({ time, width, height }) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    mesh.rotation.set(time * .15, time * .25, .2);
  } };
}
const failingScene = () => { throw new Error('Deliberate isolated scene failure'); };
window.__upetGraphics = { engines: [], graphicsContextCount };
const recordEngine = (engine) => window.__upetGraphics.engines.push(engine);

function Layer({ number, fail = false }) {
  const ref = useRef(null);
  const status = useGraphicsLayer(ref, fail ? failingScene : diagnosticScene);
  return <section ref={ref} className="graphics-fixture-layer" data-layer-state={status}>
    <div className="graphics-fixture-fallback" aria-hidden="true" />
    <h2>Native content {number}</h2><p>Readable with every graphics setting.</p>
  </section>;
}

function Harness() {
  const graphics = useGraphicsContext();
  const [mounted, setMounted] = useState(true);
  const [many, setMany] = useState(false);
  const [fail, setFail] = useState(false);
  useEffect(() => { window.__upetGraphics.manager = graphics.manager; }, [graphics.manager]);
  return <main className="graphics-fixture">
    <h1>Graphics lifecycle diagnostic</h1><p>Local synthetic geometry; this is a lifecycle test, not the material catalogue.</p>
    <div className="graphics-fixture-controls">
      <label>Graphics quality<select aria-label="Graphics quality" value={graphics.preference} onChange={(event) => graphics.setPreference(event.target.value)}>{QUALITY_CHOICES.map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select></label>
      <label>Motion<select aria-label="Motion" value={graphics.motionPreference} onChange={(event) => graphics.setMotionPreference(event.target.value)}><option value="system">System</option><option value="reduce">Reduced</option></select></label>
      <button onClick={() => setMounted((value) => !value)}>{mounted ? 'Unmount scene' : 'Mount scene'}</button>
      <button onClick={() => setMany((value) => !value)}>{many ? 'Use three layers' : 'Use twenty layers'}</button>
      <button onClick={() => setFail((value) => !value)}>{fail ? 'Restore valid scene' : 'Break one scene'}</button>
    </div>
    <p role="status">{graphics.tier} · {graphics.reducedMotion ? 'reduced motion' : 'system motion'} · native HTML remains available</p>
    {mounted && <GraphicsSceneHost onEngine={recordEngine}><div className="graphics-fixture-grid">{Array.from({ length: many ? 20 : 3 }, (_, index) => <Layer key={index} number={index + 1} fail={index === 0 && fail} />)}</div></GraphicsSceneHost>}
    <div className="graphics-fixture-scroll-spacer">Scroll to test offscreen suspension.</div>
  </main>;
}
createRoot(document.getElementById('root')).render(<StrictMode><GraphicsProvider><Harness /></GraphicsProvider></StrictMode>);
