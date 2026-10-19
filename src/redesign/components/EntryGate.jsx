import { useId, useState } from 'react';
import { FxText } from './ProfileBits';
import { verifyEntryPassword } from '../lib/entryPassword';

export default function EntryGate({ entry, accent, onEnter }) {
  const passwordId = useId();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const mode = entry?.mode === 'password' && entry.passwordHash && entry.passwordSalt ? 'password' : entry?.mode === 'anywhere' ? 'anywhere' : 'button';
  const title = entry?.title || 'click to enter';

  const checkPassword = async (event) => {
    event.preventDefault();
    setChecking(true);
    try {
      if (await verifyEntryPassword(password, entry)) onEnter();
      else { setError('That password is incorrect.'); setPassword(''); }
    } catch { setError('Could not check that password. Try again.'); }
    finally { setChecking(false); }
  };

  return <div data-testid="profile-entry-screen" className={`absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center ${mode === 'anywhere' ? 'cursor-pointer' : ''}`} onClick={mode === 'anywhere' ? onEnter : undefined} onKeyDown={mode === 'anywhere' ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onEnter(); } } : undefined} role={mode === 'anywhere' ? 'button' : undefined} tabIndex={mode === 'anywhere' ? 0 : undefined} aria-label={mode === 'anywhere' ? 'Click anywhere to enter profile' : undefined}>
    <div className="max-w-xl text-2xl font-black text-white sm:text-4xl" style={{ textShadow: `0 0 32px ${accent}99` }}><FxText fx={entry?.textEffect || 'none'} text={title} /></div>
    {entry?.subtitle && <p className="max-w-md text-sm text-white/75">{entry.subtitle}</p>}
    {mode === 'password' ? <form onSubmit={checkPassword} onClick={(event) => event.stopPropagation()} className="flex w-full max-w-xs flex-col gap-3">
      <label className="text-xs font-medium uppercase tracking-widest text-white/70" htmlFor={passwordId}>Password</label>
      <input id={passwordId} data-testid="profile-entry-password" type="password" autoComplete="off" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} className="rounded-xl border border-white/25 bg-black/50 px-4 py-3 text-center text-white outline-none focus:border-white" />
      <button data-testid="profile-enter" disabled={checking} className="rounded-xl px-5 py-3 text-sm font-bold text-black disabled:opacity-50" style={{ background: accent }}>{checking ? 'Checking…' : 'Enter profile'}</button>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </form> : mode === 'button' ? <button data-testid="profile-enter" onClick={onEnter} className="rounded-xl border border-white/30 bg-black/30 px-6 py-3 text-sm font-bold tracking-wider text-white transition-colors hover:bg-white/15">Enter profile</button> : null}
  </div>;
}
