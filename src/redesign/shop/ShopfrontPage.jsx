import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, MessageCircle, Store } from 'lucide-react';
import { getPublicRedesign } from '../lib/firebaseStore';
import { getVerifiedBusiness } from '../lib/businessProgram';
import { beginShopConversation } from '../lib/chatStore';
import { useStore } from '../lib/store';
import ShopProductCard from './ShopProductCard';
import { sanitizeShopDesign } from './shopModel';

const patternBackground = (pattern, accent) => ({
  none: 'none',
  waves: `radial-gradient(ellipse at 15% 20%, ${accent}1f, transparent 35%), radial-gradient(ellipse at 85% 75%, ${accent}14, transparent 32%)`,
  grid: `linear-gradient(${accent}12 1px, transparent 1px), linear-gradient(90deg, ${accent}12 1px, transparent 1px)`,
  dots: `radial-gradient(${accent}30 1px, transparent 1px)`,
}[pattern] || 'none');

export default function ShopfrontPage() {
  const { username = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const handle = username.toLowerCase();
    setLoading(true);
    Promise.all([getPublicRedesign(handle), getVerifiedBusiness(handle).catch(() => null)])
      .then(([result, badge]) => { if (active) { setProfile(result); setVerification(badge); } })
      .catch(() => { if (active) { setProfile(null); setVerification(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]);
  const start = async (event) => { event.preventDefault(); try { const id = await beginShopConversation(profile.username, user?.username, user?.profile?.displayName || user?.username, body); navigate(`/${profile.username}/shop/chat/${id}`); } catch (reason) { setError(reason?.message || 'Chat could not start.'); } };
  if (loading) return <div className="grid min-h-screen place-items-center"><p className="text-sm text-muted-foreground">Loading shop...</p></div>;
  if (!profile?.shop?.enabled) return <div className="grid min-h-screen place-items-center"><p>This shop is unavailable.</p></div>;

  const shop = profile.shop;
  const design = sanitizeShopDesign(shop.design);
  const fontClass = { display: 'font-display', clean: 'font-sans', rounded: 'font-rounded', mono: 'font-mono' }[design.font];
  const productLayout = design.layout === 'list' ? 'grid-cols-1' : design.layout === 'showcase' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3';
  const pageStyle = { color: design.text, backgroundColor: design.background, backgroundImage: patternBackground(design.pattern, design.accent), backgroundSize: design.pattern === 'grid' ? '32px 32px' : design.pattern === 'dots' ? '22px 22px' : 'cover' };
  const panelStyle = { borderRadius: design.radius, borderColor: `color-mix(in srgb, ${design.accent} ${Math.round(design.borderAlpha * 100)}%, transparent)`, background: `color-mix(in srgb, ${design.surface} ${Math.round(design.cardAlpha * 100)}%, transparent)`, backdropFilter: `blur(${design.blur}px)`, boxShadow: design.glow ? `0 0 ${design.glow}px ${design.accent}2b` : 'none' };

  return <main className={`min-h-screen ${fontClass}`} style={pageStyle}>
    <div className="mx-auto max-w-6xl px-5 py-10"><Link to={`/${profile.username}`} className="inline-flex items-center gap-2 text-sm opacity-65 hover:opacity-100"><ArrowLeft className="h-4 w-4" />Back to profile</Link>
      <header className={`relative mt-8 overflow-hidden border p-7 ${design.titleAlign === 'center' ? 'text-center' : ''}`} style={panelStyle}>
        {design.heroImage && <img src={design.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" style={{ objectPosition: `50% ${design.heroPosition}%` }} />}
        <div className={`relative flex items-center gap-4 ${design.titleAlign === 'center' ? 'justify-center' : ''}`}><div className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${design.accent}22`, color: design.accent }}><Store className="h-7 w-7" /></div><div><p className="text-xs uppercase tracking-[.2em]" style={{ color: design.accent }}>@{profile.username} storefront</p><h1 className="mt-1 text-3xl font-black">{shop.name || `${profile.username}'s shop`}</h1>{verification && <span className="mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ color: design.accent, borderColor: `${design.accent}66`, background: `${design.accent}18` }}><BadgeCheck className="h-3.5 w-3.5" />Verified business</span>}</div></div><p className={`relative mt-4 text-sm ${design.titleAlign === 'center' ? 'mx-auto' : ''}`} style={{ color: design.muted, maxWidth: 680 }}>{shop.description || 'Browse what this profile has for sale.'}</p>
      </header>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]"><section className={`grid ${productLayout}`} style={{ gap: design.gap }}>{shop.products.map((product) => <ShopProductCard key={product.id} product={product} currency={shop.currency} shopDesign={design} />)}{!shop.products.length && <div className="rounded-2xl border p-8 text-center text-sm opacity-60" style={panelStyle}>This shop has no products yet.</div>}</section>
        {user ? <form onSubmit={start} className="h-fit border p-5" style={panelStyle}><MessageCircle className="h-5 w-5" style={{ color: design.accent }} /><h2 className="mt-3 text-lg font-bold">Chat with the seller</h2><p className="mt-1 text-sm" style={{ color: design.muted }}>Messaging as <Link className="hover:underline" style={{ color: design.accent }} to={`/${user.username}`}>@{user.username}</Link>.</p>{error && <p className="mt-3 text-xs text-red-400">{error}</p>}<textarea required rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder="What would you like to ask?" className="mt-4 w-full resize-none rounded-xl border bg-black/20 px-3 py-2.5 text-sm" /><button className="mt-3 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-black" style={{ background: design.accent }}>Start chat</button></form> : <aside className="h-fit border p-5" style={panelStyle}><MessageCircle className="h-5 w-5" style={{ color: design.accent }} /><h2 className="mt-3 text-lg font-bold">Chat with the seller</h2><p className="mt-1 text-sm" style={{ color: design.muted }}>Sign in with your user.pet profile to start a conversation.</p><Link to={`/login?next=/${profile.username}/shop`} className="mt-4 block rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-black" style={{ background: design.accent }}>Log in to chat</Link></aside>}
      </div>
    </div>
  </main>;
}
