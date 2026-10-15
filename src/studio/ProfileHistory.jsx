import React, { useEffect, useState } from 'react';
import { getProfileRevisions } from '../data/profileStore.js';
import { profileDocumentSchema } from '../shared/profileSchema.js';

export default function ProfileHistory({ user, username, onRestore }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getProfileRevisions(user, username).then((revisions) => { if (active) setItems(revisions); }).catch(() => { if (active) setError('Could not load publish history.'); });
    return () => { active = false; };
  }, [user, username]);
  const restore = (item) => {
    if (!window.confirm('Restore this version into your draft? Your live page will stay unchanged until you publish.')) return;
    try { onRestore(profileDocumentSchema.parse(item.document)); }
    catch { setError('This revision is not compatible with the current profile schema.'); }
  };
  return <div className="studio-history"><h3>Publish history</h3>{error && <p role="status">{error}</p>}{!items && !error && <p>Loading revisions…</p>}{items?.length === 0 && <p>Your published versions will appear here.</p>}{items?.map((item) => <div key={item.id}><span>{item.publishedAt?.toDate?.().toLocaleString() || 'Published version'}</span><button type="button" onClick={() => restore(item)}>Restore to draft</button></div>)}</div>;
}
