import { Package, ShoppingBag, Sparkles } from 'lucide-react';
import { sanitizeProductDesign } from './shopModel';

const currencySymbol = { USD: '$', EUR: '€', GBP: '£' };

export default function ShopProductCard({ product, currency = 'GBP', shopDesign, preview = false }) {
  const design = sanitizeProductDesign(product.design);
  const accent = design.accent || shopDesign.accent;
  const surface = design.surface || shopDesign.surface;
  const text = design.text || shopDesign.text;
  const border = `color-mix(in srgb, ${accent} ${Math.round(design.borderAlpha * 100)}%, transparent)`;
  const buttonClass = {
    solid: 'text-black', outline: 'border bg-transparent', glass: 'border backdrop-blur-md', minimal: 'bg-transparent underline underline-offset-4',
  }[design.buttonStyle];
  const buttonStyle = design.buttonStyle === 'solid' ? { background: accent } : design.buttonStyle === 'minimal' ? { color: accent } : { borderColor: accent, color: text, background: design.buttonStyle === 'glass' ? `${accent}22` : 'transparent' };

  return <article
    data-testid={`shop-product-${product.id}`}
    className={`group relative overflow-hidden border transition-transform duration-200 hover:-translate-y-1 ${design.featured ? 'sm:col-span-2' : ''}`}
    style={{ borderColor: border, borderRadius: design.radius, color: text, background: `color-mix(in srgb, ${surface} ${Math.round(design.alpha * 100)}%, transparent)`, boxShadow: design.glow ? `0 0 ${design.glow}px ${accent}55` : 'none' }}
  >
    <div className={`${design.featured ? 'aspect-[2/1]' : 'aspect-video'} relative overflow-hidden`} style={{ background: `${accent}18` }}>
      {product.image ? <img src={product.image} alt={product.name} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" style={{ objectFit: design.imageFit, objectPosition: `${design.imagePositionX}% ${design.imagePositionY}%`, transform: `scale(${design.imageZoom})`, filter: `blur(${design.imageBlur}px)` }} /> : <Package className="absolute inset-0 m-auto h-8 w-8 opacity-45" />}
      {design.badge && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black" style={{ background: accent }}><Sparkles className="h-3 w-3" />{design.badge}</span>}
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{product.name}</h2><p className="mt-1 text-xs uppercase tracking-wider opacity-55">{product.type}</p></div><strong style={{ color: accent }}>{product.price ? `${currencySymbol[currency] || currency}${product.price}` : 'Ask'}</strong></div>
      {product.description && <p className="mt-3 text-sm leading-relaxed opacity-70">{product.description}</p>}
      <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs opacity-55">{product.stock ? `${product.stock} available` : 'Available'}</span><button type="button" disabled={preview} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${buttonClass}`} style={buttonStyle}><ShoppingBag className="h-3.5 w-3.5" />Buy soon</button></div>
    </div>
  </article>;
}
