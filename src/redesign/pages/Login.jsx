import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { inputCls, btnCls } from '../components/Controls';

export default function Login() {
  const { login, loginWithGoogle, register, resetPassword } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const result = creating ? await register(email, password) : await login(email, password);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (creating) { toast.success('Your account is ready. You can now log in.'); setCreating(false); setPassword(''); return; }
    toast.success('Welcome back');
    const requested = params.get('next');
    navigate(result.needsClaim ? `/claim${params.get('claim') ? `?username=${encodeURIComponent(params.get('claim'))}` : ''}` : requested || '/dashboard');
  };

  const forgot = async () => {
    const result = await resetPassword(email.trim());
    result.ok ? toast.success('Password reset email sent') : toast.error(result.error);
  };

  const googleLogin = async () => {
    setBusy(true);
    const result = await loginWithGoogle();
    setBusy(false);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success('Welcome back');
    navigate(result.needsClaim ? '/claim' : params.get('next') || '/dashboard');
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="glass w-full max-w-sm rounded-[1.75rem] p-7 shadow-[0_30px_80px_-30px_hsl(var(--primary)/.6)]" data-testid="login-box">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><LockKeyhole className="h-5 w-5" /></span>
        <h1 className="mt-5 font-display text-2xl font-black">{creating ? 'Create your personal account' : 'Account login'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{creating ? 'Create a personal account with the email a founder invited.' : 'Sign in with your personal Upet account.'}</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input data-testid="login-email-input" type="email" className={inputCls} placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          <input data-testid="login-password-input" type="password" className={inputCls} placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          <button data-testid="login-submit-button" disabled={busy} className={`${btnCls} w-full rounded-xl`}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{creating ? 'Create account' : 'Log in'}
          </button>
        </form>
        {!creating && <button type="button" disabled={busy} onClick={googleLogin} className={`${btnCls} mt-3 w-full rounded-xl border border-border bg-background/60`}><span aria-hidden="true" className="mr-2 font-bold text-primary">G</span>Continue with Google</button>}
        <button type="button" onClick={forgot} className="mt-4 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground">Forgot password?</button>
        <button type="button" onClick={() => setCreating(!creating)} className="mt-5 w-full border-t pt-4 text-center text-xs text-primary">{creating ? 'Already have an account? Log in' : 'Have an invite? Create your account'}</button>
        {creating && <p className="mt-3 text-center text-xs text-muted-foreground">Only invited email addresses can create accounts. Your founder invite must be active.</p>}
      </motion.div>
    </section>
  );
}
