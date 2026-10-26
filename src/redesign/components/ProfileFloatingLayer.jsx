import { createPortal } from 'react-dom';

// Overlay coordinates belong to the scene, never to a scaled or tilted card.
export default function ProfileFloatingLayer({ root, side = 'right', top = false, compact = false, children, ...props }) {
  if (!root) return null;
  const body = root === document.body;
  return createPortal(<div {...props} className={`pointer-events-auto ${body ? 'fixed' : 'absolute'} z-50 ${side === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} ${top ? 'top-[max(1rem,env(safe-area-inset-top))]' : 'bottom-[max(1.25rem,env(safe-area-inset-bottom))]'}`} style={{ width: compact ? 'auto' : 'min(340px, calc(100% - 2rem))', maxWidth: 'calc(100% - 2rem)', ...props.style }}>{children}</div>, root);
}
