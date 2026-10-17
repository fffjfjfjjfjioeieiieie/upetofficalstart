import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, AtSign, ShieldCheck, Plug, Loader2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { iconUrl } from '../../lib/catalog';
import { PageTitle, Panel, Field, inputCls, btnCls, ghostCls } from '../../components/Controls';

function Password() {
  const { changePassword } = useStore();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const save = async (event) => {
    event.preventDefault();
    if (form.next.length < 6) return toast.error('New password must be at least 6 characters');
    if (form.next !== form.confirm) return toast.error('Passwords do not match');
    setBusy(true);
    const result = await changePassword(form.current, form.next);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    setForm({ current: '', next: '', confirm: '' });
    toast.success('Password updated');
  };
  return (
    <Panel title={<span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" />Password</span>} testid="settings-password">
      <form onSubmit={save} className="grid gap-3 md:grid-cols-3">
        <Field label="Current password"><input type="password" className={inputCls} value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} autoComplete="current-password" /></Field>
        <Field label="New password"><input type="password" className={inputCls} value={form.next} onChange={(event) => setForm({ ...form, next: event.target.value })} autoComplete="new-password" /></Field>
        <Field label="Confirm new password"><input type="password" className={inputCls} value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} autoComplete="new-password" /></Field>
        <div className="md:col-span-3"><button disabled={busy} className={btnCls}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Update password</button></div>
      </form>
    </Panel>
  );
}

function Identity() {
  const { user, setProfile } = useStore();
  return (
    <Panel title={<span className="flex items-center gap-2"><AtSign className="h-4 w-4 text-primary" />Identity</span>} testid="settings-alias">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Alias"><input className={inputCls} value={user.profile.alias} onChange={(event) => setProfile('alias', event.target.value)} /></Field>
        <Field label="Email"><input className={inputCls} value={user.email} disabled /></Field>
        <Field label="Username"><input className={inputCls} value={`user.pet/${user.username}`} disabled /></Field>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Your login email and claimed username are protected by Firebase and cannot be changed here.</p>
    </Panel>
  );
}

const CONNECTIONS = [['discord', 'Discord', 'Discord user ID'], ['spotify', 'Spotify', 'Spotify username'], ['tiktok', 'TikTok', 'TikTok username'], ['github', 'GitHub', 'GitHub username']];

function Connections() {
  const { user, setUser, setProfile } = useStore();
  const [values, setValues] = useState({});
  const connect = async (id) => {
    const value = (values[id] || '').trim();
    if (!value) return toast.error('Enter a value first');
    if (id === 'discord') {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(value)}`).then((result) => result.json()).catch(() => null);
      const username = response?.success ? response.data.discord_user.username : value;
      setUser('connections.discord', { id: value, username });
      setProfile('widgets.discord.userId', value);
      toast.success(`Discord connected as ${username}`);
      return;
    }
    setUser(`connections.${id}`, { username: value });
    if (id === 'tiktok') setProfile('widgets.tiktok.username', value);
    toast.success(`${id} connected`);
  };
  const disconnect = (id) => {
    const next = { ...user.connections };
    delete next[id];
    setUser('connections', next);
  };
  return (
    <Panel title={<span className="flex items-center gap-2"><Plug className="h-4 w-4 text-primary" />Connections</span>} desc="Add the accounts shown on your profile." testid="settings-connections">
      <div className="grid gap-3 md:grid-cols-2">
        {CONNECTIONS.map(([id, label, placeholder]) => {
          const connection = user.connections[id];
          return (
            <div key={id} className="flex items-center gap-3 rounded-xl border bg-background/40 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15"><img src={iconUrl(id, '38aaff')} alt="" className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{label}</div>
                {connection ? <div className="truncate text-xs text-emerald-500">Connected · {connection.username}</div> : <input className="w-full bg-transparent text-xs outline-none" placeholder={placeholder} value={values[id] || ''} onChange={(event) => setValues({ ...values, [id]: event.target.value })} />}
              </div>
              {connection ? <button onClick={() => disconnect(id)} className={ghostCls}>Disconnect</button> : <button onClick={() => connect(id)} className={btnCls}>Connect</button>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export default function Settings() {
  return (
    <div className="space-y-4" data-testid="settings-page">
      <PageTitle title="Settings" sub="Security, identity and connected accounts." />
      <Password />
      <Identity />
      <Panel title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Two-factor authentication</span>} desc="Firebase multi-factor authentication will be enabled before public accounts open." testid="settings-2fa">
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Coming soon</span>
      </Panel>
      <Connections />
    </div>
  );
}
