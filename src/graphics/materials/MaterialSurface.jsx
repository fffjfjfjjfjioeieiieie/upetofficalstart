import './materialSurface.css';
import { normalizeMaterialVariant } from './materialRegistry.js';

export default function MaterialSurface({ variant = 'matte', quality = 'lite', reducedMotion = false, className = '', children }) {
  const safeVariant = normalizeMaterialVariant(variant);
  const safeQuality = ['lite', 'balanced', 'high', 'ultra'].includes(quality) ? quality : 'lite';
  return <div className={`upet-material upet-material--${safeVariant} ${className}`.trim()} data-material={safeVariant} data-quality={safeQuality} data-reduced-motion={reducedMotion ? 'true' : 'false'}>{children}</div>;
}
