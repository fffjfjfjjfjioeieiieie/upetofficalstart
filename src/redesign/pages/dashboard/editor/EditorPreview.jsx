import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ExternalLink, Maximize2, Monitor, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { ProfileScene } from '../../../components/ProfileCard';
import EntryGate from '../../../components/EntryGate';
import { useStore } from '../../../lib/store';

const preventPreviewNavigation = (event) => {
  if (event.target.closest('a')) event.preventDefault();
};

export function PreviewFrame({ profile, view, onEnter, className = '', fitDesktop = true, fitPreview = false }) {
  return <div className={`editor-preview-frame relative isolate overflow-hidden rounded-[1.35rem] border border-white/15 bg-black shadow-2xl ${className}`} onClickCapture={preventPreviewNavigation} onAuxClickCapture={preventPreviewNavigation} data-testid="editor-preview-frame">
    {view === 'entry' ? <ProfileScene p={profile} className="h-full w-full"><EntryGate entry={profile.entry} accent={profile.card.accent} onEnter={onEnter} /></ProfileScene> : <ProfileScene p={profile} scrollable fitDesktop={fitDesktop} fitPreview={fitPreview} className="h-full w-full" />}
  </div>;
}

const ViewSwitch = ({ view, setView }) => <div className="inline-flex rounded-full border bg-background/60 p-1" role="group" aria-label="Preview screen">
  {[['entry', 'Entry'], ['profile', 'Profile']].map(([id, label]) => <button key={id} type="button" data-testid={`preview-view-${id}`} onClick={() => setView(id)} aria-pressed={view === id} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${view === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
</div>;

export default function EditorPreview({ tab }) {
  const { user, saveState } = useStore();
  const [view, setView] = useState(tab === 'entry' ? 'entry' : 'profile');
  const [expanded, setExpanded] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = useMemo(() => ({ ...user.profile, audio: { ...user.profile.audio, autoplay: false } }), [user.profile]);
  const sideLyrics = tab === 'lyrics' && ['left', 'right'].includes(profile.audio?.lyrics?.display);

  useEffect(() => { setView(tab === 'entry' ? 'entry' : 'profile'); }, [tab]);

  const status = saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Could not save' : 'Live edits';

  return <div className="order-last rounded-2xl border border-primary/15 bg-background/40 p-3 xl:fixed xl:right-8 xl:top-8 xl:z-30 xl:w-[460px] xl:border-0 xl:bg-transparent xl:p-0" data-testid="editor-preview">
    <button type="button" onClick={() => setMobileOpen((open) => !open)} className="flex w-full items-center gap-3 text-left xl:hidden" aria-expanded={mobileOpen}>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-[.2em]">Live preview</span><span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground">user.pet/{user.username}</span></span>
      <span role="status" className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${saveState === 'error' ? 'bg-red-500/15 text-red-400' : 'bg-primary/10 text-primary'}`}>{status}</span>
      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
    </button>
    <div className="mb-3 hidden flex-wrap items-center justify-between gap-2 xl:flex"><div><div className="text-xs font-bold uppercase tracking-[.2em]">Live preview</div><div className="mt-1 font-mono text-[11px] text-muted-foreground">user.pet/{user.username}</div></div><span role="status" className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${saveState === 'error' ? 'bg-red-500/15 text-red-400' : 'bg-primary/10 text-primary'}`}>{status}</span></div>
    <div className={`${mobileOpen ? 'block' : 'hidden'} mt-3 xl:mt-0 xl:block`}>
      <div className="mb-3 flex items-center justify-between gap-2"><ViewSwitch view={view} setView={setView} /><button type="button" data-testid="preview-expand" onClick={() => setExpanded(true)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold hover:bg-primary/10 ${sideLyrics ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/.16)]' : ''}`}><Maximize2 className="h-3.5 w-3.5" />{sideLyrics ? 'Lyric placement' : 'Expand'}</button></div>
      {sideLyrics && !expanded && <div className="mb-3 rounded-xl border border-primary/20 bg-primary/[.06] px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">Side lyrics use desktop background space. Mobile visitors see them in the expanded player.</div>}
      {expanded ? <div className="grid h-[430px] place-items-center rounded-[1.35rem] border border-dashed text-sm text-muted-foreground sm:h-[520px] xl:h-[min(620px,calc(100dvh-10rem))]">Preview open in expanded view</div> : <PreviewFrame profile={profile} view={view} onEnter={() => setView('profile')} className="h-[430px] w-full sm:h-[520px] xl:h-[min(620px,calc(100dvh-10rem))]" />}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"><span>Edits appear here before saving finishes.</span><a href={`/${user.username}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline">Published page <ExternalLink className="h-3 w-3" /></a></div>
    </div>

    <Dialog open={expanded} onOpenChange={setExpanded}>
      <DialogContent className="grid h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[1200px] grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-2xl p-3 sm:h-[92dvh] sm:w-[96vw] sm:p-5" data-testid="expanded-editor-preview">
        <div className="flex flex-wrap items-center gap-2 pr-8"><DialogTitle className="mr-auto font-display text-base">Live preview</DialogTitle><ViewSwitch view={view} setView={setView} /><div className="inline-flex rounded-full border bg-background/60 p-1" role="group" aria-label="Preview device">{[['desktop', Monitor, 'Desktop'], ['mobile', Smartphone, 'Mobile']].map(([id, Icon, label]) => <button key={id} type="button" data-testid={`preview-device-${id}`} aria-label={label} aria-pressed={device === id} onClick={() => setDevice(id)} className={`rounded-full px-2.5 py-1.5 ${device === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Icon className="h-4 w-4" /></button>)}</div></div>
        <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-2xl bg-black/35 p-2 sm:p-4"><PreviewFrame profile={profile} view={view} fitDesktop={device === 'desktop'} fitPreview={device === 'mobile'} onEnter={() => setView('profile')} className={device === 'mobile' ? 'h-full w-full max-w-[390px]' : 'h-full w-full'} /></div>
      </DialogContent>
    </Dialog>
  </div>;
}
