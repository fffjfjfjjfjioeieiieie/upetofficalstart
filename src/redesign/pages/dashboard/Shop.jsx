import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Store, Clock } from "lucide-react";
import { useStore } from "../../lib/store";
import { PageTitle, Panel, Field, ToggleRow, inputCls, btnCls } from "../../components/Controls";

const EMPTY = { name: "", price: "", image: "", description: "", stock: "", type: "digital" };

export default function Shop() {
  const { user, setProfile } = useStore();
  const shop = user.profile.shop;
  const [f, setF] = useState(EMPTY);
  const set = (k) => (v) => setProfile(`shop.${k}`, v);
  const add = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Product needs a name");
    set("products")([...shop.products, { ...f, id: Date.now().toString(36) }]);
    setF(EMPTY);
    toast.success("Product added");
  };
  const edit = (i, k, v) => setProfile(`shop.products[${i}].${k}`, v);
  return (
    <div data-testid="shop-page" className="space-y-4">
      <PageTitle title="Shop" sub="Build your shop. Checkout and payments are coming soon." />
      <Panel title="Shop details" testid="shop-details">
        <div className="space-y-3">
          <ToggleRow testid="shop-enabled" label="List my shop on the marketplace" checked={shop.enabled} onChange={set("enabled")} />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Shop name"><input data-testid="shop-name" className={inputCls} value={shop.name} onChange={(e) => set("name")(e.target.value)} /></Field>
            <Field label="Currency"><select data-testid="shop-currency" className={inputCls} value={shop.currency} onChange={(e) => set("currency")(e.target.value)}>{["USD", "EUR", "GBP"].map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Description"><input data-testid="shop-description" className={inputCls} value={shop.description} onChange={(e) => set("description")(e.target.value)} /></Field>
          </div>
        </div>
      </Panel>
      <Panel title="Add product" testid="shop-add-product">
        <form onSubmit={add} className="grid gap-3 md:grid-cols-3">
          <Field label="Name"><input data-testid="product-name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Price"><input data-testid="product-price" type="number" min="0" step="0.01" className={inputCls} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
          <Field label="Stock (blank = unlimited)"><input data-testid="product-stock" type="number" min="0" className={inputCls} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></Field>
          <Field label="Image URL"><input data-testid="product-image" className={inputCls} value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} /></Field>
          <Field label="Type"><select data-testid="product-type" className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{["digital", "physical", "service"].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Description"><input data-testid="product-description" className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div className="md:col-span-3"><button data-testid="product-add-button" className={btnCls}><Plus className="h-4 w-4" />Add product</button></div>
        </form>
      </Panel>
      <Panel title={`Products (${shop.products.length})`} testid="shop-products">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shop.products.map((p, i) => (
            <div key={p.id} data-testid={`product-card-${i}`} className="rounded-xl border bg-background/40 p-3">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">{p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : <Store className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />}</div>
              <input className="mt-3 w-full bg-transparent text-sm font-semibold outline-none" value={p.name} onChange={(e) => edit(i, "name", e.target.value)} />
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <input className="w-20 bg-transparent outline-none" value={p.price} onChange={(e) => edit(i, "price", e.target.value)} />{shop.currency} · {p.type} · {p.stock || "∞"} in stock
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" />Checkout soon</span>
                <button data-testid={`product-delete-${i}`} onClick={() => set("products")(shop.products.filter((x) => x.id !== p.id))} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {!shop.products.length && <div className="text-sm text-muted-foreground">No products yet.</div>}
        </div>
      </Panel>
    </div>
  );
}
