import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Store } from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar } from '../components/ProfileBits';
import { sanitizeShopDesign } from './shopModel';

const symbols = { GBP: '£', USD: '$', EUR: '€' };

export default function Marketplace() {
  const { db } = useStore();
  const [query, setQuery] = useState('');
  const shops = useMemo(() => Object.values(db.users).filter((entry) => {
    const shop = entry.profile.shop;
    return !entry.banned && shop?.enabled && !shop.private && shop.products.length && `${shop.name} ${entry.username} ${shop.description}`.toLowerCase().includes(query.toLowerCase());
  }), [db, query]);

  return <section className="mx-auto max-w-6xl px-6" data-testid="marketplace-page">
    <h1 className="font-display text-3xl font-black sm:text-4xl">Marketplace</h1><p className="mt-2 text-sm text-muted-foreground">Independent shops designed by the user.pet community.</p>
    <div className="mt-6 flex max-w-sm items-center gap-2 rounded-xl border bg-card/60 px-3 py-2"><Search className="h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shops and products" className="flex-1 bg-transparent text-sm outline-none" /></div>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shops.map((entry) => {
      const shop = entry.profile.shop; const design = sanitizeShopDesign(shop.design);
      return <Link key={entry.username} to={`/${entry.username}/shop`} className="group overflow-hidden border transition-transform duration-200 hover:-translate-y-1" style={{ borderRadius: design.radius, borderColor: `${design.accent}55`, background: design.surface, color: design.text, boxShadow: design.glow ? `0 0 ${Math.min(design.glow, 24)}px ${design.accent}22` : 'none' }}>
        <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${design.background}, ${design.accent}33)` }}>{design.heroImage && <img src={design.heroImage} alt="" className="h-full w-full object-cover opacity-55" style={{ objectPosition: `50% ${design.heroPosition}%` }} />}<div className="absolute inset-x-4 bottom-3 flex items-end gap-3"><Avatar media={entry.profile.media.avatar} name={entry.username} size={48} /><div className="min-w-0"><h2 className="truncate font-bold">{shop.name || `${entry.username}'s shop`}</h2><p className="text-xs opacity-65">@{entry.username}</p></div></div></div>
        <div className="p-4"><div className="flex items-center gap-1 text-xs opacity-65"><Package className="h-3.5 w-3.5" />{shop.products.length} product{shop.products.length === 1 ? '' : 's'}</div><div className="mt-4 grid grid-cols-3 gap-2">{shop.products.slice(0, 3).map((product) => <div key={product.id} className="relative aspect-square overflow-hidden rounded-lg" style={{ background: `${design.accent}18` }}>{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <Store className="absolute inset-0 m-auto h-5 w-5 opacity-45" />}<span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 text-[10px] text-white">{product.price ? `${symbols[shop.currency] || shop.currency}${product.price}` : 'Ask'}</span></div>)}</div></div>
      </Link>;
    })}</div>
    {!shops.length && <div className="mt-8 rounded-2xl border bg-card/50 p-10 text-center text-sm text-muted-foreground"><Store className="mx-auto mb-3 h-7 w-7" />No public shops match that search yet.</div>}
  </section>;
}
