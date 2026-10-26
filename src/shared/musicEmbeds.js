const SAFE_ID = /^[A-Za-z0-9_-]+$/;

const cleanUrl = (value) => {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
};

export const MUSIC_PROVIDER_LABELS = Object.freeze({
  spotify: 'Spotify',
  youtube: 'YouTube Music',
  soundcloud: 'SoundCloud',
});

export function parseMusicEmbed(value) {
  const url = cleanUrl(value);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  if (host === 'open.spotify.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    const offset = parts[0] === 'intl-' || parts[0]?.startsWith('intl-') ? 1 : 0;
    const type = parts[offset];
    const id = parts[offset + 1];
    if (!['track', 'album', 'playlist', 'episode', 'show', 'artist'].includes(type) || !id || !SAFE_ID.test(id)) return null;
    const canonicalUrl = `https://open.spotify.com/${type}/${id}`;
    return { provider: 'spotify', kind: type, id, sourceUrl: canonicalUrl, embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator` };
  }

  if (host === 'youtu.be' || host === 'youtube.com' || host === 'music.youtube.com' || host === 'm.youtube.com') {
    let id = host === 'youtu.be' ? url.pathname.split('/').filter(Boolean)[0] : url.searchParams.get('v');
    if (!id && /^\/(?:embed|shorts)\//.test(url.pathname)) id = url.pathname.split('/').filter(Boolean)[1];
    const list = url.searchParams.get('list');
    if (id && SAFE_ID.test(id) && id.length <= 24) {
      const suffix = list && SAFE_ID.test(list) ? `?list=${encodeURIComponent(list)}` : '';
      return { provider: 'youtube', kind: 'video', id, sourceUrl: `https://www.youtube.com/watch?v=${id}${list && SAFE_ID.test(list) ? `&list=${encodeURIComponent(list)}` : ''}`, embedUrl: `https://www.youtube.com/embed/${id}${suffix}` };
    }
    if (list && SAFE_ID.test(list) && list.length <= 80) {
      return { provider: 'youtube', kind: 'playlist', id: list, sourceUrl: `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`, embedUrl: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}` };
    }
    return null;
  }

  if (host === 'soundcloud.com' || host === 'm.soundcloud.com' || host === 'on.soundcloud.com') {
    if (url.pathname === '/' || !url.pathname) return null;
    url.hash = '';
    const sourceUrl = url.toString().slice(0, 2048);
    const params = new URLSearchParams({
      url: sourceUrl,
      color: '#6cc4ff',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      visual: 'true',
    });
    return { provider: 'soundcloud', kind: 'track', id: url.pathname, sourceUrl, embedUrl: `https://w.soundcloud.com/player/?${params.toString()}` };
  }

  return null;
}

export function sanitizeMusicEmbed(source = {}) {
  const parsed = parseMusicEmbed(source.sourceUrl || source.embedUrl);
  return parsed || { provider: '', kind: '', id: '', sourceUrl: '', embedUrl: '' };
}
