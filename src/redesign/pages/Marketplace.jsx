import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Package, Store } from "lucide-react";
import { useStore } from "../lib/store";
import { Avatar } from "../components/ProfileBits";

const Placeholder = ({ i }) => (
  <div data-testid={`market-placeholder-${i}`} className="rounded-2xl border bg-card/60 p-5">
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2"><div className="h-3 w-24 animate-pulse rounded bg-muted" /><div className="h-2.5 w-16 animate-pulse rounded bg-muted" /></div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2">{[0, 1, 2].map((k) => <div key={k} className="aspect-square animate-pulse rounded-lg bg-muted" />)}</div>
    <div className="mt-4 text-xs text-muted-foreground">Waiting for data…</div>
  </div>
);

export default function Marketplace() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const shops = useMemo(() => Object.values(db.users).filter((u) => !u.banned && u.profile.shop?.enabled && !u.profile.shop.private && u.profile.shop.products.length && (u.profile.shop.name + u.username).toLowerCase().includes(q.toLowerCase())), [db, q]);
  return (
    <section className="mx-auto max-w-5xl px-6" data-testid="marketplace-page">
      <h1 className="text-3xl font-bold sm:text-4xl">Marketplace</h1>
      <p className="mt-2 text-sm text-muted-foreground">Shops from the user.pet community.</p>
      <div className="mt-6 flex max-w-sm items-center gap-2 rounded-xl border bg-card/60 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input data-testid="market-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shops" className="flex-1 bg-transparent text-sm outline-none" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((u) => (
          <Link key={u.username} to={`/${u.username}`} data-testid={`market-shop-${u.username}`} className="rounded-2xl border bg-card/60 p-5 transition-colors hover:bg-card">
            <div className="flex items-center gap-3">
              <Avatar media={u.profile.media.avatar} name={u.username} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{u.profile.shop.name || `${u.username}'s shop`}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Package className="h-3 w-3" />{u.profile.shop.products.length} products</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {u.profile.shop.products.slice(0, 3).map((p) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <Store className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />}
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] text-white">{p.price ? `$${p.price}` : "—"}</span>
                </div>
              ))}
            </div>
          </Link>
        ))}
        {Array.from({ length: Math.max(3, 6 - shops.length) }, (_, i) => <Placeholder key={i} i={i} />)}
      </div>
    </section>
  );
}
