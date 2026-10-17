import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { iconUrl } from "../lib/catalog";

const SOCIALS = [["discord", "https://discord.gg/"], ["x", "https://x.com/"], ["tiktok", "https://tiktok.com/"], ["instagram", "https://instagram.com/"], ["github", "https://github.com/"]];
const LINKS = [["Explore", "/explore"], ["Marketplace", "/marketplace"], ["Legal", "https://help.user.pet/legal/terms"], ["Privacy", "https://help.user.pet/legal/privacy"], ["Terms", "https://help.user.pet/legal/terms"], ["Support", "https://help.user.pet"]];

export const Footer = () => (
  <footer data-testid="site-footer" className="mx-auto mt-32 w-full max-w-5xl border-t px-6 py-10">
    <div className="flex flex-wrap items-center justify-between gap-6">
      <Logo />
      <nav className="flex flex-wrap gap-5">
        {LINKS.map(([l, to]) => to.startsWith('http') ? <a key={l} href={to} data-testid={`footer-link-${l.toLowerCase()}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{l}</a> : <Link key={l} to={to} data-testid={`footer-link-${l.toLowerCase()}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{l}</Link>)}
      </nav>
      <div className="flex gap-2">
        {SOCIALS.map(([p, href]) => (
          <a key={p} href={href} target="_blank" rel="noreferrer" data-testid={`footer-social-${p}`} className="grid h-9 w-9 place-items-center rounded-lg border bg-card/60 transition-colors hover:bg-card">
            <img src={iconUrl(p, "8fd3ff")} alt={p} className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
    <div className="mt-8 flex justify-between font-mono text-[11px] text-muted-foreground">
      <span>© {new Date().getFullYear()} user.pet</span>
      <span>v0.1.01</span>
    </div>
  </footer>
);
