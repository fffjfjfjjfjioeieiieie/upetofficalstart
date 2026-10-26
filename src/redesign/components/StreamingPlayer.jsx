import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Play, X } from 'lucide-react';
import { MUSIC_PROVIDER_LABELS, parseMusicEmbed } from '../../shared/musicEmbeds.js';
import { BRAND, iconUrl } from '../lib/catalog.js';
import { hexA } from './Widgets.jsx';
import ProfileFloatingLayer from './ProfileFloatingLayer';

const providerArtwork = (audio, parsed) => {
  if (audio.cover) return audio.cover;
  if (parsed?.provider === 'youtube' && parsed.id) return `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`;
  return '';
};

export default function StreamingPlayer({ audio, accent = '#6cc4ff', preview = false }) {
  const [open, setOpen] = useState(false);
  const host = useRef(null);
  const [overlayRoot, setOverlayRoot] = useState(null);
  useLayoutEffect(() => { setOverlayRoot(host.current?.closest('[data-profile-scene]')?.querySelector('[data-profile-overlay-root]') || document.body); }, []);
  const parsed = parseMusicEmbed(audio.sourceUrl);
  const provider = parsed?.provider || audio.embedProvider;
  const label = MUSIC_PROVIDER_LABELS[provider] || 'Streaming';
  const artwork = providerArtwork(audio, parsed);
  const brand = `#${(BRAND[provider] || [accent.replace('#', '')])[0]}`;
  const effect = audio.playerEffect || 'none';
  const opacity = audio.playerOpacity ?? .3;
  const placement = preview ? 'card' : (audio.playerPlacement || 'card');
  const floating = placement !== 'card';
  const compact = placement === 'button';
  const style = {
    color: audio.playerTextColor || '#fff',
    borderRadius: `${audio.playerRadius ?? 12}px`,
    border: audio.playerBorder === false ? 'none' : '1px solid rgba(255,255,255,.1)',
    backgroundColor: hexA(audio.playerBackground || '#000000', opacity),
    backgroundImage: effect === 'gradient' ? `linear-gradient(135deg, ${hexA(audio.playerBackground || '#000000', opacity)}, ${hexA(accent, opacity)})` : effect === 'scanlines' ? 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,.08) 4px, transparent 5px)' : undefined,
    backdropFilter: `blur(${(audio.playerBlur || 0) + (effect === 'glass' ? 12 : 0)}px)`,
    boxShadow: effect === 'glow' ? `0 0 24px ${hexA(accent, .45)}` : '0 12px 32px rgba(0,0,0,.24)',
    width: compact ? 'auto' : `${audio.playerScale ?? 100}%`,
    maxWidth: '100%',
    transformOrigin: placement === 'left' ? 'left bottom' : placement === 'card' ? 'center' : 'right bottom',
  };

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => event.key === 'Escape' && setOpen(false);
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', close);
    return () => { window.removeEventListener('keydown', close); document.documentElement.style.overflow = previous; };
  }, [open]);

  if (!audio.embedUrl) return null;
  const mini = <button type="button" onClick={() => setOpen(true)} data-testid={preview ? 'streaming-preview-open' : 'profile-streaming-player'} data-analytics-feature={preview ? undefined : 'Music player'} className={`flex items-center gap-3 overflow-hidden border p-2.5 text-left transition-transform hover:-translate-y-0.5 ${compact ? 'w-auto rounded-full' : 'w-full'}`} style={style}>
    {artwork && audio.playerShowCover !== false ? <img src={artwork} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: `${brand}22` }}><img src={iconUrl(provider, brand)} alt="" className="h-5 w-5" /></span>}
    {!compact && <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{audio.title || label}</span>{audio.playerShowArtist !== false && <span className="block truncate text-[11px] opacity-60">{audio.artist || `Play with ${label}`}</span>}</span>}
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-black" style={{ background: accent }}><Play className="ml-0.5 h-4 w-4 fill-current" /></span>
  </button>;

  const modal = open && typeof document !== 'undefined' ? createPortal(<div className="fixed inset-0 z-[110] grid place-items-end bg-black/80 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${label} player`} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
    <section className="w-full max-w-3xl overflow-hidden rounded-[24px] border border-white/15 bg-[#0b0d12] p-3 shadow-2xl sm:p-4">
      <header className="mb-3 flex items-center gap-3 px-1"><span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${brand}22` }}><img src={iconUrl(provider, brand)} alt="" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{audio.title || label}</p><p className="truncate text-xs text-white/50">Official {label} player</p></div><a href={audio.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open in ${label}`} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"><ExternalLink className="h-4 w-4" /></a><button type="button" onClick={() => setOpen(false)} aria-label="Close player" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"><X className="h-4 w-4" /></button></header>
      <iframe title={`${label} music player`} src={audio.embedUrl} className={`block w-full rounded-xl border-0 ${provider === 'youtube' ? 'aspect-video max-h-[70dvh]' : provider === 'spotify' ? 'h-[352px] max-h-[70dvh]' : 'h-[300px] max-h-[70dvh]'}`} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="eager" />
    </section>
  </div>, document.body) : null;

  return <><span ref={host} className="hidden"/>{floating ? <ProfileFloatingLayer root={overlayRoot} side={placement === 'left' ? 'left' : 'right'} compact={compact} data-testid="profile-streaming-placement"><div className={`flex w-full ${placement === 'left' ? 'justify-start' : 'justify-end'}`}>{mini}</div></ProfileFloatingLayer> : <div className="flex w-full min-w-0 justify-center">{mini}</div>}{modal}</>;
}
