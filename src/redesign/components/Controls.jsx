import { motion } from "framer-motion";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";

export const Panel = ({ title, desc, children, className = "", testid }) => (
  <section data-testid={testid} className={`glass rounded-2xl p-5 ${className}`}>
    {title && <h3 className="font-display text-sm font-semibold">{title}</h3>}
    {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
    <div className={title || desc ? "mt-4" : ""}>{children}</div>
  </section>
);

export const SliderRow = ({ label, value, min = 0, max = 100, step = 1, onChange, unit = "", testid }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{Number(value).toFixed(step < 1 ? 2 : 0)}{unit}</span>
    </div>
    <Slider data-testid={testid} value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
  </div>
);

export const ColorRow = ({ label, value, onChange, testid }) => (
  <label className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 px-3 py-2 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="flex items-center gap-2">
      <span className="font-mono uppercase">{value}</span>
      <input data-testid={testid} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
    </span>
  </label>
);

export const ToggleRow = ({ label, checked, onChange, testid }) => (
  <label className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 px-3 py-2.5 text-sm">
    <span>{label}</span>
    <Switch data-testid={testid} checked={checked} onCheckedChange={onChange} />
  </label>
);

export const Field = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
  </label>
);

export const inputCls = "w-full rounded-xl border bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";
export const btnCls = "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_hsl(var(--primary))] active:translate-y-0 disabled:opacity-50";
export const ghostCls = "inline-flex items-center justify-center gap-2 rounded-full border bg-background/40 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10";

export const PageTitle = ({ title, sub }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
    <h1 className="font-display text-3xl font-black sm:text-4xl"><span className="text-3d inline-block">{title}</span></h1>
    {sub && <p className="mt-3 text-sm text-muted-foreground">{sub}</p>}
  </motion.div>
);
