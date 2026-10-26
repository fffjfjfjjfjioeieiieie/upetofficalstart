import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useGraphicsContext } from './GraphicsProvider.jsx';
import { createGraphicsEngine } from './graphicsEngine.js';
import './graphicsSceneHost.css';

const SceneContext = createContext(null);

export function GraphicsSceneHost({ children, className = '', onEngine }) {
  const inherited = useContext(SceneContext);
  return inherited ? children : <OwnedSceneHost className={className} onEngine={onEngine}>{children}</OwnedSceneHost>;
}

function OwnedSceneHost({ children, className, onEngine }) {
  const { manager } = useGraphicsContext();
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const onEngineRef = useRef(onEngine);
  const [engine, setEngine] = useState(null);
  const [state, setState] = useState('idle');
  useEffect(() => {
    let active = true;
    const next = createGraphicsEngine({ host: hostRef.current, canvas: canvasRef.current, manager, onState: (value) => { if (active) setState(value.status); } });
    setEngine(next);
    onEngineRef.current?.(next);
    return () => { active = false; next.dispose(); };
  }, [manager]);
  return <SceneContext.Provider value={{ engine }}><div ref={hostRef} className={`upet-graphics-host ${className}`.trim()} data-graphics-state={state}>
    <canvas ref={canvasRef} aria-hidden="true" className="upet-graphics-host__canvas" />
    <div className="upet-graphics-host__content">{children}</div>
  </div></SceneContext.Provider>;
}

export function useGraphicsLayer(elementRef, createScene, { enabled = true, animated = true } = {}) {
  const engine = useContext(SceneContext)?.engine;
  const [status, setStatus] = useState('fallback');
  useEffect(() => {
    if (!engine || !enabled || !elementRef.current) { setStatus('fallback'); return undefined; }
    return engine.register({ element: elementRef.current, createScene, animated, onStatus: setStatus });
  }, [engine, elementRef, createScene, enabled, animated]);
  return status;
}
