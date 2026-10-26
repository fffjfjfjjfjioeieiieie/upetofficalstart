import { Component } from 'react';

export const RouteLoading = ({ label = 'Opening your page…' }) => (
  <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-5" role="status" aria-live="polite">
    <div className="w-full max-w-md rounded-3xl border border-primary/15 bg-card/55 p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/.3)]">U</span>
        <div className="min-w-0 flex-1"><div className="h-3 w-28 animate-pulse rounded-full bg-primary/25" /><div className="mt-2 h-2 w-44 max-w-full animate-pulse rounded-full bg-foreground/10" /></div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{label}</p>
      <div className="mt-4 grid gap-2"><div className="h-11 animate-pulse rounded-xl bg-foreground/[.06]" /><div className="h-11 animate-pulse rounded-xl bg-foreground/[.04]" /></div>
    </div>
  </div>
);

export class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error) { console.error('Route failed to load', error); }

  render() {
    if (!this.state.error) return this.props.children;
    return <div className="grid min-h-screen place-items-center px-5"><div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-card/80 p-6 text-center shadow-2xl"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-xl text-red-400">!</div><h1 className="mt-4 font-display text-xl font-bold">This page did not finish loading</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Your work is safe. Reload the latest version of user.pet and try again.</p><div className="mt-5 flex justify-center gap-2"><button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Reload page</button><a href="/" className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Go home</a></div></div></div>;
  }
}
