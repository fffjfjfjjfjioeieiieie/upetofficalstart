import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../../app/firebase.js';
import { useStore } from '../../../redesign/lib/store.js';
import { RouteLoading } from '../../../redesign/components/RouteState.jsx';
import { loadOwnerDraftV2 } from './studioV2Api.js';
import { hasFounderPreviewClaim } from './studioPreviewPolicy.js';
import StudioV2 from './StudioV2.jsx';

export default function StudioV2Route() {
  const { user } = useStore();
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let active = true;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || firebaseUser.uid !== user?.uid) {
      setState({ status: 'error', message: 'Your sign-in session is unavailable. Sign in again to open Studio.' });
      return undefined;
    }
    setState({ status: 'loading' });
    (async () => {
      const token = await firebaseUser.getIdTokenResult(true);
      if (!hasFounderPreviewClaim(token.claims)) {
        if (active) setState({ status: 'forbidden' });
        return;
      }
      const draft = await loadOwnerDraftV2(firebaseUser.uid);
      if (active) setState({ status: draft ? 'ready' : 'migration', draft, firebaseUser });
    })().catch((error) => {
      if (active) setState({ status: 'error', message: error?.message || 'Studio could not load.' });
    });
    return () => { active = false; };
  }, [user?.uid]);

  if (state.status === 'loading') return <RouteLoading label="Checking Studio preview access…" />;
  if (state.status === 'ready') return <StudioV2 key={`${user.uid}:${state.draft.draftRevision}`} user={user} firebaseUser={state.firebaseUser} initialDraft={state.draft} />;
  const title = state.status === 'forbidden' ? 'Founder preview only'
    : state.status === 'migration' ? 'Your existing profile is safe'
      : 'Studio is unavailable';
  const message = state.status === 'forbidden'
    ? 'This preview requires a verified founder claim. Your account and legacy editor are unchanged.'
    : state.status === 'migration'
      ? 'No verified v2 draft exists yet. Migration must pass its round-trip and recovery checks before editing begins.'
      : state.message;
  return <section className="mx-auto max-w-2xl rounded-3xl border bg-card/80 p-8" role={state.status === 'error' ? 'alert' : undefined}>
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Studio 2.0 preview</p>
    <h1 className="mt-3 font-display text-2xl font-bold">{title}</h1>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
    <Link to="/dashboard/editor" className="mt-6 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold">Open the current editor</Link>
  </section>;
}
