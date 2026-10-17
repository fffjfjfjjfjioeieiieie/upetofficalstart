const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

const text = (value, max = 160) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
const oneOf = (value, options, fallback) => options.includes(value) ? value : fallback;
const assetUrl = (value) => {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url.slice(0, 2048);
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString().slice(0, 2048) : '';
  } catch { return ''; }
};

export const DEFAULT_SHOP_DESIGN = {
  layout: 'grid',
  background: '#080b12',
  surface: '#111722',
  accent: '#6cc4ff',
  text: '#f5f7fb',
  muted: '#9aa8ba',
  radius: 24,
  cardAlpha: 0.82,
  blur: 14,
  borderAlpha: 0.22,
  glow: 18,
  gap: 18,
  heroImage: '',
  heroPosition: 50,
  titleAlign: 'left',
  font: 'display',
  pattern: 'waves',
};

export const DEFAULT_PRODUCT_DESIGN = {
  accent: '',
  surface: '',
  text: '',
  radius: 18,
  alpha: 0.92,
  borderAlpha: 0.18,
  glow: 0,
  imageFit: 'cover',
  imagePositionX: 50,
  imagePositionY: 50,
  imageZoom: 1,
  imageBlur: 0,
  buttonStyle: 'solid',
  badge: '',
  featured: false,
};

export const EMPTY_PRODUCT = {
  name: '', price: '', image: '', description: '', stock: '', type: 'digital', design: DEFAULT_PRODUCT_DESIGN,
};

export function sanitizeShopDesign(source = {}) {
  const fallback = DEFAULT_SHOP_DESIGN;
  return {
    layout: oneOf(source.layout, ['grid', 'list', 'showcase'], fallback.layout),
    background: color(source.background, fallback.background),
    surface: color(source.surface, fallback.surface),
    accent: color(source.accent, fallback.accent),
    text: color(source.text, fallback.text),
    muted: color(source.muted, fallback.muted),
    radius: clamp(source.radius, 0, 48, fallback.radius),
    cardAlpha: clamp(source.cardAlpha, 0.2, 1, fallback.cardAlpha),
    blur: clamp(source.blur, 0, 40, fallback.blur),
    borderAlpha: clamp(source.borderAlpha, 0, 1, fallback.borderAlpha),
    glow: clamp(source.glow, 0, 50, fallback.glow),
    gap: clamp(source.gap, 8, 40, fallback.gap),
    heroImage: assetUrl(source.heroImage),
    heroPosition: clamp(source.heroPosition, 0, 100, fallback.heroPosition),
    titleAlign: oneOf(source.titleAlign, ['left', 'center'], fallback.titleAlign),
    font: oneOf(source.font, ['display', 'clean', 'rounded', 'mono'], fallback.font),
    pattern: oneOf(source.pattern, ['none', 'waves', 'grid', 'dots'], fallback.pattern),
  };
}

export function sanitizeProductDesign(source = {}) {
  const fallback = DEFAULT_PRODUCT_DESIGN;
  return {
    accent: source.accent ? color(source.accent, '') : '',
    surface: source.surface ? color(source.surface, '') : '',
    text: source.text ? color(source.text, '') : '',
    radius: clamp(source.radius, 0, 40, fallback.radius),
    alpha: clamp(source.alpha, 0.2, 1, fallback.alpha),
    borderAlpha: clamp(source.borderAlpha, 0, 1, fallback.borderAlpha),
    glow: clamp(source.glow, 0, 40, fallback.glow),
    imageFit: oneOf(source.imageFit, ['cover', 'contain', 'fill'], fallback.imageFit),
    imagePositionX: clamp(source.imagePositionX, 0, 100, fallback.imagePositionX),
    imagePositionY: clamp(source.imagePositionY, 0, 100, fallback.imagePositionY),
    imageZoom: clamp(source.imageZoom, 0.5, 3, fallback.imageZoom),
    imageBlur: clamp(source.imageBlur, 0, 20, fallback.imageBlur),
    buttonStyle: oneOf(source.buttonStyle, ['solid', 'outline', 'glass', 'minimal'], fallback.buttonStyle),
    badge: text(source.badge, 32),
    featured: Boolean(source.featured),
  };
}

export function sanitizeShopProduct(source = {}, index = 0) {
  return {
    id: text(source.id || `product-${index}`, 80),
    name: text(source.name, 100),
    price: text(source.price, 20),
    image: assetUrl(source.image),
    description: text(source.description, 500),
    stock: text(source.stock, 20),
    type: oneOf(source.type, ['digital', 'physical', 'service'], 'digital'),
    design: sanitizeProductDesign(source.design),
  };
}
