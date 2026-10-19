const categories = new Set(['digital', 'physical', 'services', 'creator', 'other']);
const types = new Set(['registered', 'sole_trader', 'creator', 'other']);
const roles = new Set(['owner', 'co_owner', 'authorized_representative']);

function webUrl(value, label, { required = false, https = false } = {}) {
  const raw = String(value || '').trim();
  if (!raw && !required) return '';
  try {
    const parsed = new URL(raw);
    if (!['https:', 'http:'].includes(parsed.protocol) || (https && parsed.protocol !== 'https:') || !parsed.hostname.includes('.')) throw new Error();
    const normalized = parsed.toString();
    if (normalized.length > 300) throw new Error();
    return normalized;
  } catch { throw new Error(`Enter a valid ${https ? 'https' : 'http or https'} ${label} URL.`); }
}

export function cleanBusinessApplication(input, username = '') {
  const businessName = String(input.businessName || '').trim();
  const category = String(input.category || '');
  const businessType = String(input.businessType || '');
  const country = String(input.country || '').trim();
  const description = String(input.description || '').trim();
  const ownerRole = String(input.ownerRole || '');
  const supportEmail = String(input.supportEmail || '').trim().toLowerCase();
  const fulfillment = String(input.fulfillment || '').trim();
  const proofExplanation = String(input.proofExplanation || '').trim();
  const website = webUrl(input.website, 'website');
  const shopUrl = webUrl(input.shopUrl, 'shop', { required: true, https: true });
  const publicProofUrl = webUrl(input.publicProofUrl, 'public proof', { required: true, https: true });
  if (businessName.length < 2 || businessName.length > 100) throw new Error('Enter a business name between 2 and 100 characters.');
  if (!categories.has(category)) throw new Error('Choose a business category.');
  if (!types.has(businessType)) throw new Error('Choose how your business operates.');
  if (country.length < 2 || country.length > 80) throw new Error('Enter your business country or region.');
  if (description.length < 20 || description.length > 1000) throw new Error('Tell us about your business (20–1000 characters).');
  if (!roles.has(ownerRole)) throw new Error('Tell us your role in the business.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) || supportEmail.length > 254) throw new Error('Enter a valid customer support email.');
  if (fulfillment.length < 20 || fulfillment.length > 500) throw new Error('Explain how customers receive their orders (20–500 characters).');
  if (proofExplanation.length < 30 || proofExplanation.length > 600) throw new Error('Explain how your public link proves your connection to the business (30–600 characters).');
  const parsedShop = new URL(shopUrl);
  if (!['user.pet', 'www.user.pet'].includes(parsedShop.hostname) || (username && ![`/${username}/shop`, `/biz/${username}`].includes(parsedShop.pathname.replace(/\/$/, '')))) throw new Error('Use your own user.pet shop URL.');
  if (shopUrl === publicProofUrl) throw new Error('Use a separate public link to help verify your business.');
  return { businessName, category, businessType, country, description, website, shopUrl, publicProofUrl, proofExplanation, ownerRole, supportEmail, fulfillment };
}
