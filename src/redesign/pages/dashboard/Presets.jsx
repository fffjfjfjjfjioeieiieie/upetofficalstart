import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, Loader2, Pencil, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageTitle, btnCls, ghostCls, inputCls } from '../../components/Controls';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { PreviewFrame } from './editor/EditorPreview';
import { defaultProfile, sanitizeRedesignProfile } from '../../lib/profileModel';
import { changeProfilePreset, listProfilePresets } from '../../lib/profilePresets';
import { useStore } from '../../lib/store';

const PresetPreview = ({ profile, tall = false }) => (
  <div className="pointer-events-none relative overflow-hidden rounded-2xl bg-black">
    <PreviewFrame profile={profile} view="profile" className={tall ? 'h-full min-h-[520px] w-full' : 'h-72 w-full'} />
    {!tall && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />}
  </div>
);

export default function Presets() {
  const { user, saveState, replaceProfile } = useStore();
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], activePresetId: '', max: 5 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [name, setName] = useState('');
  const [previewId, setPreviewId] = useState('');
  const [renaming, setRenaming] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [createNextOpen, setCreateNextOpen] = useState(false);

  const load = async () => {
    try { setData(await listProfilePresets()); }
    catch (error) { toast.error(error?.message || 'Profile presets could not be loaded'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const profiles = useMemo(() => data.items.map((item) => ({ ...item, profile: sanitizeRedesignProfile(item.preview, user.username) })), [data.items, user.username]);
  const selected = profiles.find((item) => item.id === previewId);
  const working = saveState === 'saving';

  const run = async (key, action, values, success) => {
    if (working) {
      toast.message('Finishing your latest profile save…');
      return false;
    }
    setBusy(key);
    try {
      await changeProfilePreset(action, values);
      await load();
      if (success) toast.success(success);
      return true;
    } catch (error) {
      toast.error(error?.message || 'Profile preset could not be changed');
      return false;
    }
    finally { setBusy(''); }
  };

  const create = async (event) => {
    event.preventDefault();
    const value = name.trim();
    if (!value) return toast.error('Give this profile preset a name');
    const saved = await run('create', 'create', { name: value }, 'Profile preset saved');
    if (saved) {
      setName('');
      setCreateNextOpen(true);
    }
  };

  const createNewProfile = async () => {
    setBusy('new-profile');
    try {
      await changeProfilePreset('clearActive');
      replaceProfile(defaultProfile(user.username));
      setCreateNextOpen(false);
      toast.success('New profile started');
      navigate('/dashboard/editor');
    } catch (error) {
      toast.error(error?.message || 'A new profile could not be started');
    } finally { setBusy(''); }
  };

  const rename = async (id) => {
    if (!renameValue.trim()) return toast.error('Give this profile preset a name');
    await run(`rename-${id}`, 'rename', { id, name: renameValue }, 'Preset renamed');
    setRenaming('');
  };

  return <div data-testid="profile-presets-page">
    <PageTitle title="Profiles" sub="Save up to five versions of your page, preview them, and choose which one is live." />

    <section className="glass mb-5 overflow-hidden rounded-2xl border border-primary/20 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-bold">Save your current profile</h2></div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">This captures the page that is live right now. Activate a saved profile to continue editing that version.</p>
        </div>
        <form onSubmit={create} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
          <input data-testid="preset-name" className={inputCls} maxLength={40} value={name} onChange={(event) => setName(event.target.value)} placeholder="Preset name, e.g. Blue winter" disabled={data.items.length >= data.max} />
          <button data-testid="preset-create" disabled={busy || working || data.items.length >= data.max} className={`${btnCls} shrink-0`}><Plus className="h-4 w-4" />Save profile</button>
        </form>
      </div>
      <div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(data.items.length / data.max) * 100}%` }} /></div><span className="font-mono text-xs text-muted-foreground">{data.items.length}/{data.max}</span></div>
    </section>

    {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : profiles.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {profiles.map((item) => {
        const active = item.id === data.activePresetId;
        return <article key={item.id} className={`glass overflow-hidden rounded-2xl border p-3 transition-colors ${active ? 'border-primary ring-2 ring-primary/20' : 'border-white/10'}`}>
          <button type="button" onClick={() => setPreviewId(item.id)} className="relative block w-full text-left" aria-label={`Preview ${item.name}`}>
            <PresetPreview profile={item.profile} />
            <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">{active ? 'Live now' : 'Saved profile'}</span>
            <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/65 text-white backdrop-blur-md"><Eye className="h-4 w-4" /></span>
          </button>
          <div className="px-1 pb-1 pt-3">
            {renaming === item.id ? <div className="flex gap-2"><input autoFocus className={`${inputCls} py-2`} maxLength={40} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /><button type="button" onClick={() => rename(item.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Check className="h-4 w-4" /></button></div> : <div className="flex items-center gap-2"><h3 className="min-w-0 flex-1 truncate font-display font-bold">{item.name}</h3><button type="button" aria-label={`Rename ${item.name}`} onClick={() => { setRenaming(item.id); setRenameValue(item.name); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button></div>}
            <p className="mt-1 truncate text-xs text-muted-foreground">@{item.profile.alias || user.username} · {item.profile.links.length} links</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy || active} onClick={() => run(`activate-${item.id}`, 'activate', { id: item.id }, `${item.name} is now live`)} className={`${btnCls} px-3`}>{busy === `activate-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <Check className="h-4 w-4" /> : null}{active ? 'Live' : 'Use profile'}</button>
              <button type="button" disabled={busy || working} onClick={() => run(`update-${item.id}`, 'update', { id: item.id }, `${item.name} updated`)} className={`${ghostCls} px-3`}><Save className="h-4 w-4" />Update</button>
            </div>
            <button type="button" disabled={busy} onClick={() => run(`delete-${item.id}`, 'delete', { id: item.id }, 'Profile preset deleted')} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" />Delete preset</button>
          </div>
        </article>;
      })}
    </div> : <div className="glass grid min-h-72 place-items-center rounded-2xl border border-dashed p-8 text-center"><div><Sparkles className="mx-auto h-7 w-7 text-primary" /><h2 className="mt-3 font-display text-lg font-bold">Save your first profile</h2><p className="mt-1 text-sm text-muted-foreground">Your current live design will appear here as a visual preset.</p></div></div>}

    <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setPreviewId('')}>
      <DialogContent className="grid h-[calc(100dvh-1rem)] max-h-[900px] w-[calc(100vw-1rem)] max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl p-3 sm:h-[92dvh] sm:p-5">
        <DialogHeader className="pr-8 text-left"><DialogTitle className="font-display">{selected?.name || 'Profile preview'}</DialogTitle></DialogHeader>
        <div className="min-h-0 overflow-hidden rounded-2xl bg-black/40 p-1 sm:p-3">{selected && <PresetPreview profile={selected.profile} tall />}</div>
        {selected && <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">This is how the saved version looks.</span><button type="button" disabled={busy || selected.id === data.activePresetId} onClick={() => run(`activate-${selected.id}`, 'activate', { id: selected.id }, `${selected.name} is now live`)} className={btnCls}>{selected.id === data.activePresetId ? 'Currently live' : 'Use this profile'}</button></div>}
      </DialogContent>
    </Dialog>

    <Dialog open={createNextOpen} onOpenChange={setCreateNextOpen}>
      <DialogContent className="glass max-w-md rounded-2xl">
        <DialogHeader className="text-left"><DialogTitle className="font-display text-xl">Create a new profile?</DialogTitle></DialogHeader>
        <div className="rounded-2xl border border-primary/20 bg-primary/[.06] p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">Your profile was saved safely as a preset. You can keep editing it, or start a clean profile and build another look.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setCreateNextOpen(false)} className={ghostCls}>Keep editing</button>
          <button type="button" disabled={busy === 'new-profile'} onClick={createNewProfile} className={btnCls}>{busy === 'new-profile' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create new profile</button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
