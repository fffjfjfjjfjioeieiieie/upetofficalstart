const categories = new Set(['digital', 'physical', 'services', 'creator', 'other']);

export function cleanBusinessDetails(input) {
  const businessName = String(input.businessName || '').trim();
  const category = String(input.category || 'other');
  const description = String(input.description || '').trim();
  const rawWebsite = String(input.website || '').trim();
  let website = '';
  if (rawWebsite) {
    try {
      const parsed = new URL(rawWebsite);
      if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error();
      website = parsed.toString();
      if (website.length > 300) throw new Error();
    } catch { throw new Error('Enter a valid http or https website URL.'); }
  }
  if (businessName.length < 2 || businessName.length > 100) throw new Error('Enter a business name between 2 and 100 characters.');
  if (!categories.has(category)) throw new Error('Choose a business category.');
  if (description.length < 20 || description.length > 500) throw new Error('Describe the business in 20–500 characters.');
  return { businessName, category, description, website };
}
