import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { inputCls, btnCls } from '../components/Controls';
import { visitorEvent } from '../components/VisitorTracking';

export default function ClaimUsername() {
  const { ready, needsClaim, claimUsername, isTaken } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState(params.get('username') || '');
  const [busy, setBusy] = useState(false);

  if (ready && !needsClaim) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{2,19}$/.test(normalized)) {
      toast.error('Use 3–20 letters, numbers, dots, underscores, or hyphens.');
      return;
    }
    setBusy(true);
    try {
      if (await isTaken(normalized)) {
        setBusy(false);
        toast.error('That username is already taken.');
        return;
      }
    } catch {
      setBusy(false);
      toast.error('Username availability could not be checked. Try again.');
      return;
    }
    const result = await claimUsername(normalized);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`user.pet/${result.username} is yours`);
    visitorEvent('conversion', '/claim');
    navigate('/dashboard', { replace: true });
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="glass w-full max-w-md rounded-[1.75rem] p-7">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">One last step</p>
        <h1 className="mt-3 font-display text-2xl font-black">Claim your user.pet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your username is permanent, so choose it carefully.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="flex items-center rounded-xl border bg-background/50 px-3">
            <span className="font-mono text-sm text-muted-foreground">user.pet/</span>
            <input className={`${inputCls} border-0 bg-transparent`} value={username} onChange={(event) => setUsername(event.target.value)} autoFocus />
          </div>
          <button className={`${btnCls} w-full rounded-xl`} disabled={busy || !ready}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Claim username
          </button>
        </form>
      </div>
    </section>
  );
}
