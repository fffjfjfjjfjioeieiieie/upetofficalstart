import React from 'react';
import Markdown from 'react-markdown';
import { safeExternalUrl } from '../../shared/profileSanitization.js';
import { recordProfileEvent } from '../../data/analyticsStore.js';
import styles from './ProfileBlocks.module.css';

const allowedElements = ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'br', 'blockquote', 'h1', 'h2', 'h3', 'hr'];
export default function MarkdownBlock({ text, username, blockId, linkAction = 'open', analyticsEnabled = true }) {
  return <div className={styles.markdown}><Markdown allowedElements={allowedElements} unwrapDisallowed components={{ a: ({ href, children }) => {
    const safe = safeExternalUrl(href);
    if (!safe) return <span>{children}</span>;
    const activate = () => { if (linkAction !== 'open') navigator.clipboard?.writeText(safe).catch(() => {}); if (analyticsEnabled) recordProfileEvent(username, 'click', blockId); };
    return linkAction === 'copy' ? <button type="button" className={styles.inlineCopy} onClick={activate}>{children}</button> : <a href={safe} target="_blank" rel="noopener noreferrer" onClick={activate}>{children}</a>;
  } }}>{String(text || '')}</Markdown></div>;
}
