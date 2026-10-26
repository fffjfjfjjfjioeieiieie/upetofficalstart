import { useGraphicsContext } from '../core/GraphicsProvider.jsx';

// Measure actual scene frames, not an independent idle RAF on ordinary HTML.
export function useGraphicsQuality() {
  return useGraphicsContext();
}
