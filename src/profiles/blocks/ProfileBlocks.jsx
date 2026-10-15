import React from 'react';
import { ExternalLink } from 'lucide-react';
import { safeAssetUrl, safeExternalUrl } from '../../shared/profileSanitization.js';
import { recordProfileEvent } from '../../data/analyticsStore.js';
import styles from './ProfileBlocks.module.css';
import CanvasBlocks from '../layouts/CanvasBlocks.jsx';
const MarkdownBlock = React.lazy(() => import('./MarkdownBlock.jsx'));

function Outbound({ href, username, block, children, className }) {
  const safe = safeExternalUrl(href);
  if (!safe) return <span className={`${className || ''} ${styles.inactive}`}>{children}</span>;
  return <a className={className} href={safe} target="_blank" rel="noopener noreferrer" onClick={() => recordProfileEvent(username, 'click', block.id)}>{children}<ExternalLink size={14} /></a>;
}

function ProfileBlock({ block, username }) {
  const content = block.content || {};
  const image = safeAssetUrl(content.url);
  switch (block.type) {
    case 'link': return <Outbound className={styles.link} href={content.url} block={block} username={username}>{content.label || 'Untitled link'}</Outbound>;
    case 'socials': { const items = String(content.items || '').split(/\n/).map((line) => { const [label, url] = line.split('|'); return { label: label?.trim(), url: url?.trim() }; }).filter((item) => item.label && safeExternalUrl(item.url)).slice(0, 12); if (!items.length && content.url) items.push({ label: content.label || 'Social', url: content.url }); return <div className={styles.socials}>{items.map((item, index) => <Outbound key={`${item.url}-${index}`} href={item.url} block={block} username={username}>{item.label}</Outbound>)}</div>; }
    case 'heading': return <h2 className={styles.heading}>{content.text}</h2>;
    case 'text': return <React.Suspense fallback={<p className={styles.text}>{content.text}</p>}><MarkdownBlock text={content.text} username={username} blockId={block.id} /></React.Suspense>;
    case 'image': return image ? <img className={styles.image} src={image} alt={content.alt || ''} loading="lazy" /> : null;
    case 'gallery': return <div className={styles.gallery}>{String(content.urls || '').split(/\n/).map((item) => safeAssetUrl(item.trim())).filter(Boolean).slice(0, 12).map((url) => <img key={url} src={url} alt="Gallery item" loading="lazy" />)}</div>;
    case 'video': return image && /\.(mp4|webm)(\?|$)/i.test(image) ? <video className={styles.video} src={image} controls playsInline preload="none" /> : <Outbound className={styles.link} href={content.url} block={block} username={username}>Watch video</Outbound>;
    case 'divider': return <hr className={styles.divider} />;
    case 'music': return image ? <audio className={styles.audio} src={image} controls preload="none" /> : null;
    case 'featured': case 'project': return <Outbound className={styles.featured} href={content.url} block={block} username={username}><strong>{content.title || 'Untitled'}</strong><span>{content.description}</span></Outbound>;
    case 'skills': return <div className={styles.skills}>{String(content.text || '').split(',').map((skill) => skill.trim()).filter(Boolean).map((skill) => <span key={skill}>{skill}</span>)}</div>;
    case 'quote': return <blockquote className={styles.quote}>{content.text}<cite>{content.author}</cite></blockquote>;
    case 'discordPresence': return <div className={styles.note}>Discord presence for {content.userId || 'your account'} is not connected yet.</div>;
    case 'discordServer': return <Outbound className={styles.link} href={content.url} block={block} username={username}>{content.label || 'Join Discord'}</Outbound>;
    default: return null;
  }
}

export default function ProfileBlocks({ blocks = [], username, layout, onGeometryChange, mobilePreview }) {
  const ordered = [...blocks].filter((block) => block.enabled).sort((a, b) => a.order - b.order);
  if (layout === 'canvas') return <CanvasBlocks blocks={ordered} renderBlock={(block) => <ProfileBlock block={block} username={username} />} editable={Boolean(onGeometryChange)} onGeometryChange={onGeometryChange} mobilePreview={mobilePreview} />;
  return <div className={styles.blocks}>{ordered.map((block) => <ProfileBlock key={block.id} block={block} username={username} />)}</div>;
}
