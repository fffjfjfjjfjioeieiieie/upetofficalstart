import React from 'react';
import Markdown from 'react-markdown';
import { safeExternalUrl } from '../../shared/profileSanitization.js';
import { recordProfileEvent } from '../../data/analyticsStore.js';
import styles from './ProfileBlocks.module.css';

const allowedElements = ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'br', 'blockquote', 'h1', 'h2', 'h3', 'hr'];
export default function MarkdownBlock({ text, username, blockId }) {
  return <div className={styles.markdown}><Markdown allowedElements={allowedElements} unwrapDisallowed components={{ a: ({ href, children }) => {
    const safe = safeExternalUrl(href);
    return safe ? <a href={safe} target="_blank" rel="noopener noreferrer" onClick={() => recordProfileEvent(username, 'click', blockId)}>{children}</a> : <span>{children}</span>;
  } }}>{String(text || '')}</Markdown></div>;
}
