import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, PackagePlus, Paintbrush, Settings2, Store, Trash2 } from 'lucide-react';
import { useStore, fileToDataUrl } from '../lib/store';
import { PageTitle, Panel, Field, ToggleRow, SliderRow, ColorRow, inputCls } from '../components/Controls';
import { Button } from '../components/ui/button';
import ShopProductCard from './ShopProductCard';
import { DEFAULT_PRODUCT_DESIGN, DEFAULT_SHOP_DESIGN, EMPTY_PRODUCT, sanitizeProductDesign, sanitizeShopDesign } from './shopModel';

const tabs = [['details', Store, 'Shop'], ['design', Paintbrush, 'Design'], ['products', PackagePlus, 'Products']];
const cloneEmpty = () => ({ ...EMPTY_PRODUCT, design: { ...DEFAULT_PRODUCT_DESIGN } });

function Choice({ value, current, onClick, children }) {
  return <Button type="button" size="sm" variant={current === value ? 'default' : 'outline'} onClick={() => onClick(value)}>{children}</Button>;
}

export default function ShopEditor() {
  const { user, setProfile } = useStore();
  const shop = user.profile.shop;
  const design = useMemo(() => sanitizeShopDesign(shop.design), [shop.design]);
  const [tab, setTab] = useState('details');
  const [draft, setDraft] = useState(cloneEmpty);
  const [openProduct, setOpenProduct] = useState(null);
  const [uploading, setUploading] = useState('');
  const set = (key) => (value) => setProfile(`shop.${key}`, value);
  const setDesign = (key, value) => setProfile(`shop.design.${key}`, value);
  const edit = (index, key, value) => setProfile(`shop.products[${index}].${key}`, value);
  const editDesign = (index, key, value) => setProfile(`shop.products[${index}].design.${key}`, value);

  const addProduct = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return toast.error('Product needs a name');
    const product = { ...draft, id: Date.now().toString(36), design: sanitizeProductDesign(draft.design) };
    set('products')([...shop.products, product]);
    setDraft(cloneEmpty());
    setOpenProduct(product.id);
    toast.success('Product added');
  };

  const upload = async (file, path, key) => {
    if (!file) return;
    setUploading(key);
    try { setProfile(path, await fileToDataUrl(file, 1800, 'image')); toast.success('Image uploaded'); }
    catch (error) { toast.error(error?.message || 'Upload failed'); }
    finally { setUploading(''); }
  };

  return <div data-testid="shop-page" className="space-y-4">
    <PageTitle title="Shop studio" sub="Design your storefront and give every product its own visual style." />
    <div className="flex flex-wrap gap-2">{tabs.map(([value, Icon, label]) => <Button key={value} variant={tab === value ? 'default' : 'outline'} onClick={() => setTab(value)}><Icon className="h-4 w-4" />{label}</Button>)}</div>

    {tab === 'details' && <>
      <Panel title="Shop visibility" desc="Your profile always controls who can discover the store." testid="shop-details">
        <div className="space-y-3"><ToggleRow testid="shop-enabled" label="Enable shop on my profile" checked={shop.enabled} onChange={(enabled) => { set('enabled')(enabled); if (enabled && typeof shop.private !== 'boolean') set('private')(true); }} />
          {shop.enabled && <div className="rounded-xl border border-primary/20 bg-primary/5 p-3"><div className="text-sm font-semibold">Where should your shop appear?</div><p className="mt-1 text-xs text-muted-foreground">Private shops are linked from your profile. Public shops also appear in Marketplace.</p><div className="mt-3 flex gap-2"><Choice value current={shop.private} onClick={() => set('private')(true)}>Private</Choice><Choice value={false} current={shop.private} onClick={() => set('private')(false)}>Marketplace</Choice></div></div>}
        </div>
      </Panel>
      <Panel title="Identity"><div className="grid gap-3 md:grid-cols-2"><Field label="Shop name"><input className={inputCls} value={shop.name} onChange={(event) => set('name')(event.target.value)} /></Field><Field label="Currency"><select className={inputCls} value={shop.currency} onChange={(event) => set('currency')(event.target.value)}>{['GBP', 'USD', 'EUR'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Description"><textarea rows={4} className={inputCls} value={shop.description} onChange={(event) => set('description')(event.target.value)} /></Field><Field label="Contact URL (optional)"><input className={inputCls} placeholder="https://..." value={shop.contactUrl || ''} onChange={(event) => set('contactUrl')(event.target.value)} /></Field></div></Panel>
    </>}

    {tab === 'design' && <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Panel title="Layout & type"><div className="space-y-5"><div><p className="mb-2 text-xs text-muted-foreground">Product layout</p><div className="flex flex-wrap gap-2">{['grid', 'list', 'showcase'].map((value) => <Choice key={value} value={value} current={design.layout} onClick={(next) => setDesign('layout', next)}>{value}</Choice>)}</div></div><div><p className="mb-2 text-xs text-muted-foreground">Typography</p><div className="flex flex-wrap gap-2">{['display', 'clean', 'rounded', 'mono'].map((value) => <Choice key={value} value={value} current={design.font} onClick={(next) => setDesign('font', next)}>{value}</Choice>)}</div></div><div><p className="mb-2 text-xs text-muted-foreground">Header alignment</p><div className="flex gap-2">{['left', 'center'].map((value) => <Choice key={value} value={value} current={design.titleAlign} onClick={(next) => setDesign('titleAlign', next)}>{value}</Choice>)}</div></div><SliderRow label="Product spacing" value={design.gap} min={8} max={40} unit="px" onChange={(value) => setDesign('gap', value)} /></div></Panel>
        <Panel title="Colour system"><div className="grid gap-3 sm:grid-cols-2"><ColorRow label="Page" value={design.background} onChange={(value) => setDesign('background', value)} /><ColorRow label="Cards" value={design.surface} onChange={(value) => setDesign('surface', value)} /><ColorRow label="Accent" value={design.accent} onChange={(value) => setDesign('accent', value)} /><ColorRow label="Text" value={design.text} onChange={(value) => setDesign('text', value)} /><ColorRow label="Muted text" value={design.muted} onChange={(value) => setDesign('muted', value)} /></div></Panel>
        <Panel title="Glass & effects"><div className="grid gap-5 sm:grid-cols-2"><SliderRow label="Corner radius" value={design.radius} min={0} max={48} unit="px" onChange={(value) => setDesign('radius', value)} /><SliderRow label="Card opacity" value={design.cardAlpha} min={0.2} max={1} step={0.01} onChange={(value) => setDesign('cardAlpha', value)} /><SliderRow label="Glass blur" value={design.blur} min={0} max={40} unit="px" onChange={(value) => setDesign('blur', value)} /><SliderRow label="Border strength" value={design.borderAlpha} min={0} max={1} step={0.01} onChange={(value) => setDesign('borderAlpha', value)} /><SliderRow label="Glow" value={design.glow} min={0} max={50} unit="px" onChange={(value) => setDesign('glow', value)} /></div></Panel>
        <Panel title="Shop background"><div className="space-y-4"><div><p className="mb-2 text-xs text-muted-foreground">Pattern</p><div className="flex flex-wrap gap-2">{['none', 'waves', 'grid', 'dots'].map((value) => <Choice key={value} value={value} current={design.pattern} onClick={(next) => setDesign('pattern', next)}>{value}</Choice>)}</div></div><Field label="Hero image URL"><input className={inputCls} value={design.heroImage} onChange={(event) => setDesign('heroImage', event.target.value)} /></Field><div className="flex flex-wrap items-center gap-3"><Button asChild variant="outline"><label className="cursor-pointer"><ImagePlus className="h-4 w-4" />{uploading === 'hero' ? 'Uploading...' : 'Upload hero'}<input hidden type="file" accept="image/*,image/gif" onChange={(event) => upload(event.target.files?.[0], 'shop.design.heroImage', 'hero')} /></label></Button>{design.heroImage && <Button variant="ghost" onClick={() => setDesign('heroImage', '')}>Remove</Button>}</div><SliderRow label="Hero position" value={design.heroPosition} min={0} max={100} unit="%" onChange={(value) => setDesign('heroPosition', value)} /></div></Panel>
      </div>
      <Panel title="Live product preview" className="h-fit xl:sticky xl:top-6"><div className="rounded-2xl p-4" style={{ background: design.background }}><ShopProductCard preview product={shop.products[0] || { id: 'preview', name: 'Your product', price: '12.00', description: 'Products can each have their own look.', stock: '', type: 'digital', design: DEFAULT_PRODUCT_DESIGN }} currency={shop.currency} shopDesign={design} /></div></Panel>
    </div>}

    {tab === 'products' && <>
      <Panel title="Add product"><form onSubmit={addProduct} className="grid gap-3 md:grid-cols-3"><Field label="Name"><input className={inputCls} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field><Field label="Price"><input type="number" min="0" step="0.01" className={inputCls} value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></Field><Field label="Type"><select className={inputCls} value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{['digital', 'physical', 'service'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Description"><input className={inputCls} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field><Field label="Image URL"><input className={inputCls} value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></Field><Field label="Stock"><input type="number" min="0" className={inputCls} value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} /></Field><div className="md:col-span-3"><Button><PackagePlus className="h-4 w-4" />Add product</Button></div></form></Panel>
      <div className="space-y-4">{shop.products.map((product, index) => {
        const productDesign = sanitizeProductDesign(product.design);
        const open = openProduct === product.id;
        return <Panel key={product.id} title={product.name || 'Untitled product'} desc={`${product.type} · ${product.price ? `${shop.currency} ${product.price}` : 'no price'}`}>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setOpenProduct(open ? null : product.id)}><Settings2 className="h-4 w-4" />{open ? 'Close editor' : 'Customize'}</Button><Button variant="destructive" onClick={() => set('products')(shop.products.filter((item) => item.id !== product.id))}><Trash2 className="h-4 w-4" />Delete</Button></div>
          {open && <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]"><div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><Field label="Name"><input className={inputCls} value={product.name} onChange={(event) => edit(index, 'name', event.target.value)} /></Field><Field label="Price"><input className={inputCls} value={product.price} onChange={(event) => edit(index, 'price', event.target.value)} /></Field><Field label="Description"><textarea rows={3} className={inputCls} value={product.description} onChange={(event) => edit(index, 'description', event.target.value)} /></Field><Field label="Stock"><input className={inputCls} value={product.stock} onChange={(event) => edit(index, 'stock', event.target.value)} /></Field><Field label="Product badge"><input className={inputCls} placeholder="New, Featured, Limited..." value={productDesign.badge} onChange={(event) => editDesign(index, 'badge', event.target.value)} /></Field><Field label="Image URL"><input className={inputCls} value={product.image} onChange={(event) => edit(index, 'image', event.target.value)} /></Field></div><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><label className="cursor-pointer"><ImagePlus className="h-4 w-4" />{uploading === product.id ? 'Uploading...' : 'Upload image'}<input hidden type="file" accept="image/*,image/gif" onChange={(event) => upload(event.target.files?.[0], `shop.products[${index}].image`, product.id)} /></label></Button><ToggleRow label="Featured wide card" checked={productDesign.featured} onChange={(value) => editDesign(index, 'featured', value)} /></div>
            <div className="grid gap-3 sm:grid-cols-3"><ColorRow label="Accent override" value={productDesign.accent || design.accent} onChange={(value) => editDesign(index, 'accent', value)} /><ColorRow label="Surface override" value={productDesign.surface || design.surface} onChange={(value) => editDesign(index, 'surface', value)} /><ColorRow label="Text override" value={productDesign.text || design.text} onChange={(value) => editDesign(index, 'text', value)} /></div>
            <div className="grid gap-5 sm:grid-cols-2"><SliderRow label="Corners" value={productDesign.radius} min={0} max={40} unit="px" onChange={(value) => editDesign(index, 'radius', value)} /><SliderRow label="Opacity" value={productDesign.alpha} min={0.2} max={1} step={0.01} onChange={(value) => editDesign(index, 'alpha', value)} /><SliderRow label="Border" value={productDesign.borderAlpha} min={0} max={1} step={0.01} onChange={(value) => editDesign(index, 'borderAlpha', value)} /><SliderRow label="Glow" value={productDesign.glow} min={0} max={40} unit="px" onChange={(value) => editDesign(index, 'glow', value)} /><SliderRow label="Image zoom" value={productDesign.imageZoom} min={0.5} max={3} step={0.01} onChange={(value) => editDesign(index, 'imageZoom', value)} /><SliderRow label="Image blur" value={productDesign.imageBlur} min={0} max={20} unit="px" onChange={(value) => editDesign(index, 'imageBlur', value)} /><SliderRow label="Image X" value={productDesign.imagePositionX} min={0} max={100} unit="%" onChange={(value) => editDesign(index, 'imagePositionX', value)} /><SliderRow label="Image Y" value={productDesign.imagePositionY} min={0} max={100} unit="%" onChange={(value) => editDesign(index, 'imagePositionY', value)} /></div>
            <div><p className="mb-2 text-xs text-muted-foreground">Image fit</p><div className="flex gap-2">{['cover', 'contain', 'fill'].map((value) => <Choice key={value} value={value} current={productDesign.imageFit} onClick={(next) => editDesign(index, 'imageFit', next)}>{value}</Choice>)}</div></div><div><p className="mb-2 text-xs text-muted-foreground">Buy button</p><div className="flex flex-wrap gap-2">{['solid', 'outline', 'glass', 'minimal'].map((value) => <Choice key={value} value={value} current={productDesign.buttonStyle} onClick={(next) => editDesign(index, 'buttonStyle', next)}>{value}</Choice>)}</div></div></div>
            <div className="rounded-2xl p-4" style={{ background: design.background }}><ShopProductCard preview product={product} currency={shop.currency} shopDesign={design} /></div></div>}
        </Panel>;
      })}{!shop.products.length && <Panel><div className="py-8 text-center text-sm text-muted-foreground"><Store className="mx-auto mb-3 h-7 w-7" />Add your first product above.</div></Panel>}</div>
    </>}
  </div>;
}
