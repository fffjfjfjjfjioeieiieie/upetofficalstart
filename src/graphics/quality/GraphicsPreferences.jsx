import { useGraphicsContext } from '../core/GraphicsProvider.jsx';
import { QUALITY_CHOICES } from './qualityPreferences.js';
import './graphicsPreferences.css';

export default function GraphicsPreferences() {
  const graphics = useGraphicsContext();
  return <details className="upet-graphics-preferences">
    <summary>Graphics · {graphics.preference === 'auto' ? `Auto (${graphics.tier})` : graphics.preference}</summary>
    <div className="upet-graphics-preferences__panel">
      <p>Choose visual detail and motion for this device.</p>
      <label>Visual detail<select aria-label="Visitor graphics quality" value={graphics.preference} onChange={(event) => graphics.setPreference(event.target.value)}>{QUALITY_CHOICES.map((quality) => <option key={quality} value={quality}>{quality[0].toUpperCase() + quality.slice(1)}</option>)}</select></label>
      <label>Motion<select aria-label="Visitor motion preference" value={graphics.motionPreference} onChange={(event) => graphics.setMotionPreference(event.target.value)}><option value="system">Follow device setting</option><option value="reduce">Reduce motion</option></select></label>
    </div>
  </details>;
}
