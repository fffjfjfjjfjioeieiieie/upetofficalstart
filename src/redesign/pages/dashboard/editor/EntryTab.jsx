import { useState } from 'react';
import { useStore } from '../../../lib/store';
import { TEXT_FX } from '../../../lib/catalog';
import { createEntryPassword } from '../../../lib/entryPassword';
import { FxText } from '../../../components/ProfileBits';
import { Field, Panel, inputCls, btnCls, ghostCls } from '../../../components/Controls';

const MODES = [
  ['button', 'Click to enter', 'Visitors press the entry button.'],
  ['anywhere', 'Click anywhere', 'Visitors can tap anywhere on the entry screen.'],
  ['password', 'Password to enter', 'Visitors enter the password you set below.'],
];

export default function EntryTab() {
  const { user, setProfile } = useStore();
  const entry = user.profile.entry;
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const set = (key, value) => setProfile(`entry.${key}`, value);

  const savePassword = async (event) => {
    event.preventDefault();
    try {
      const { passwordSalt, passwordHash } = await createEntryPassword(password);
      set('passwordSalt', passwordSalt);
      set('passwordHash', passwordHash);
      set('mode', 'password');
      setPassword('');
      setMessage('Entry password saved.');
    } catch (error) { setMessage(error.message); }
  };

  return <div className="space-y-4">
    <Panel title="Entry screen" desc="Choose how visitors open your profile." testid="entry-settings">
      <div className="grid gap-2 sm:grid-cols-3">
        {MODES.map(([mode, label, description]) => <button key={mode} type="button" data-testid={`entry-mode-${mode}`} disabled={mode === 'password' && !(entry.passwordHash && entry.passwordSalt)} onClick={() => set('mode', mode)} className={`rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${entry.mode === mode ? 'border-primary bg-primary/15' : 'bg-background/40 hover:bg-primary/10'}`}><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></button>)}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">A password controls the entry screen, but does not make a published profile private.</p>
    </Panel>

    <Panel title="Words & effects" desc="Style the message people see before entering.">
      <div className="grid gap-4">
        <Field label="Headline"><input data-testid="entry-title" className={inputCls} maxLength={80} value={entry.title} onChange={(event) => set('title', event.target.value)} /></Field>
        <Field label="Supporting text"><input data-testid="entry-subtitle" className={inputCls} maxLength={160} value={entry.subtitle} onChange={(event) => set('subtitle', event.target.value)} placeholder="A little note before they enter" /></Field>
        <Field label="Headline effect"><select data-testid="entry-text-effect" className={inputCls} value={entry.textEffect} onChange={(event) => set('textEffect', event.target.value)}>{TEXT_FX.map((effect) => <option key={effect} value={effect}>{effect}</option>)}</select></Field>
        <div className="grid min-h-28 place-items-center rounded-xl border bg-[#0b1626] px-4 text-center text-lg font-bold text-white"><FxText fx={entry.textEffect} text={entry.title || 'click to enter'} /></div>
      </div>
    </Panel>

    <Panel title="Entry password" desc={entry.passwordHash ? 'Set a new password or remove the current one.' : 'Set a password before choosing password mode.'}>
      <form onSubmit={savePassword} className="flex flex-wrap gap-2"><input data-testid="entry-password-setting" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className={`${inputCls} min-w-48 flex-1`} /><button type="submit" className={btnCls}>{entry.passwordHash ? 'Change password' : 'Set password'}</button>{entry.passwordHash && <button type="button" className={ghostCls} onClick={() => { set('passwordSalt', ''); set('passwordHash', ''); set('mode', 'button'); setMessage('Entry password removed.'); }}>Remove</button>}</form>
      {message && <p role="status" className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </Panel>
  </div>;
}
