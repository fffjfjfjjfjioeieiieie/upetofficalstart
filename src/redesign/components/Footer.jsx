import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const GROUPS = [
  ['Product', [['Features', '/#features'], ['Explore', '/explore'], ['Log in', '/login']]],
  ['Legal', [['Terms', 'https://help.user.pet/legal/terms'], ['Privacy', '/privacy']]],
  ['Contact', [['Help centre', 'https://help.user.pet'], ['Email', 'mailto:support@user.pet']]],
];

export function Footer({ className = '' }) {
  return <footer className={`mx-auto mt-32 w-[min(calc(100%_-_2rem),76rem)] border-t border-border px-1 py-12 ${className}`}>
    <div className="grid gap-10 sm:grid-cols-[1.5fr_2fr]"><div><Logo /><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">One composed link for everything you are and everything you make.</p></div><div className="grid grid-cols-3 gap-5">{GROUPS.map(([group, links]) => <nav aria-label={group} key={group}><h2 className="text-xs font-bold uppercase tracking-[.14em] text-foreground">{group}</h2><div className="mt-4 grid gap-3">{links.map(([label, href]) => href.startsWith('http') || href.startsWith('mailto:') ? <a key={label} href={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</a> : <Link key={label} to={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>)}</div></nav>)}</div></div>
    <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground"><span>© {new Date().getFullYear()} user.pet</span><span>Built for expressive people.</span></div>
  </footer>;
}
