import { isRenderableBlockType } from './profileRenderModel.js';

export default function ProfileBlockContent({ block, audience = 'public' }) {
  if (!isRenderableBlockType(block.type)) {
    return audience === 'owner'
      ? <span className="upet-profile-block-unknown" role="note">{block.type} is preserved but not yet previewable.</span>
      : null;
  }
  if (block.type === 'divider') {
    const label = String(block.data.label || block.accessibility?.label || '').trim();
    return <span className="upet-profile-block-divider" role={label ? 'separator' : 'presentation'} aria-label={label || undefined} />;
  }
  const value = String(block.data.text || (block.type === 'heading' ? 'Heading' : 'Text'));
  if (block.type === 'heading') {
    const Heading = `h${[2, 3, 4, 5, 6].includes(block.data.level) ? block.data.level : 2}`;
    return <Heading className="upet-profile-block-heading">{value}</Heading>;
  }
  return <span className="upet-profile-block-text">{value}</span>;
}
