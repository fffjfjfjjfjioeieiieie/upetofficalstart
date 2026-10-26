import { Fragment } from 'react';
import { GraphicsProvider, useGraphicsContext } from '../../../graphics/core/GraphicsProvider.jsx';
import { GraphicsSceneHost } from '../../../graphics/core/GraphicsSceneHost.jsx';
import GraphicsPreferences from '../../../graphics/quality/GraphicsPreferences.jsx';
import MaterialSurface from '../../../graphics/materials/MaterialSurface.jsx';
import ProfileBlockContent from './ProfileBlockContent.jsx';
import { getBlockLayout, getBlockRenderStyle, getRenderablePage, isRenderableBlockType, resolveProfileRenderSource } from './profileRenderModel.js';
import './profileRenderer.css';

export function ProfileIdentity({ identity, headingLevel = 1 }) {
  const name = identity.displayName || identity.handle || 'Untitled profile';
  const Heading = headingLevel === 2 ? 'h2' : 'h1';
  return <header className="upet-profile-renderer__identity">
    <div className="upet-profile-renderer__avatar">{identity.avatarUrl ? <img src={identity.avatarUrl} alt="" /> : name.slice(0, 1).toUpperCase()}</div>
    <Heading className="upet-profile-renderer__name">{name}</Heading>
    {identity.handle && <p className="upet-profile-renderer__handle">@{identity.handle}</p>}
    {identity.bio && <p className="upet-profile-renderer__bio">{identity.bio}</p>}
  </header>;
}

export function ProfilePageContent({ page, audience = 'public', viewport = 'desktop', renderBlock, blocksRef, blocksClassName = '', emptyContent }) {
  const blocks = page.blocks.filter((block) => block.visible !== false && (audience === 'owner' || isRenderableBlockType(block.type))).slice().sort((a, b) => a.order - b.order);
  const layoutHeight = Math.max(180, ...blocks.map((block) => {
    const layout = getBlockLayout(block, viewport);
    return layout.y + Math.max(38, layout.height) + 15;
  }));
  return <div ref={blocksRef} className={`upet-profile-renderer__blocks ${blocksClassName}`.trim()} style={{ height: layoutHeight }}>
    {!blocks.length && emptyContent}
    {blocks.map((block) => {
      const layout = getBlockLayout(block, viewport);
      const blockContent = <ProfileBlockContent block={block} audience={audience} />;
      const content = block.style.material
        ? <MaterialSurface config={block.style.material} className="upet-profile-block-surface" style={{ minHeight: Math.max(22, layout.height - 16) }}>{blockContent}</MaterialSurface>
        : blockContent;
      const style = getBlockRenderStyle(block, viewport);
      if (audience === 'owner' && renderBlock) return <Fragment key={block.id}>{renderBlock({ block, layout, content, style })}</Fragment>;
      return <div key={block.id} className="upet-profile-renderer__block" style={style}>
        {content}
      </div>;
    })}
  </div>;
}

// Public usage accepts only the strict allowlisted projection. Legacy remains on
// the current ProfileCard route until full parity, preserving old profiles.
export default function ProfileRenderer(props) {
  return <GraphicsProvider><GraphicsSceneHost className="upet-profile-renderer-host"><ProfileView {...props} /></GraphicsSceneHost></GraphicsProvider>;
}

function ProfileView({ source, pageIdOrSlug = '', audience = 'public', viewport = 'desktop', reducedMotion = false, legacyRenderer, renderBlock, blocksRef, blocksClassName, emptyContent, className = '' }) {
  const graphics = useGraphicsContext();
  let resolved;
  try { resolved = resolveProfileRenderSource(source, { audience }); }
  catch { return <p role="status">This profile cannot be displayed right now.</p>; }
  if (resolved.kind === 'legacy') return legacyRenderer ? legacyRenderer(resolved.source) : <p role="status">This profile requires the classic profile view.</p>;
  const { profile } = resolved;
  const page = getRenderablePage(profile, pageIdOrSlug, audience);
  if (!page) return <p role="status">This page is unavailable.</p>;
  return <><MaterialSurface className={`upet-profile-renderer ${className}`.trim()} config={profile.theme?.material} reducedMotion={reducedMotion || graphics.reducedMotion}>
    <ProfileIdentity identity={profile.identity} headingLevel={audience === 'owner' ? 2 : 1} />
    <ProfilePageContent page={page} audience={audience} viewport={viewport} renderBlock={renderBlock} blocksRef={blocksRef} blocksClassName={blocksClassName} emptyContent={emptyContent} />
  </MaterialSurface>{audience === 'public' && <GraphicsPreferences />}</>;
}
