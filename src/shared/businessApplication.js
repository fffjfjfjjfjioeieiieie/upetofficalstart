const categories = new Set(['digital', 'physical', 'services', 'creator', 'other']);

export function cleanBusinessApplication(input) {
  const businessName = String(input.businessName || '').trim().slice(0, 100);
  const category = String(input.category || 'other');
  const description = String(input.description || '').trim().slice(0, 1000);
  const rawWebsite = String(input.website || '').trim();
  let website = '';
  if (rawWebsite) {
    try {
      const parsed = new URL(rawWebsite);
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error();
      website = parsed.toString();
      if (website.length > 300) throw new Error();
    } catch { throw new Error('Enter a valid http or https website URL.'); }
  }
  if (businessName.length < 2) throw new Error('Enter your business name.');
  if (!categories.has(category)) throw new Error('Choose a business category.');
  if (description.length < 20) throw new Error('Tell us a little more about your business (at least 20 characters).');
  return { businessName, category, website, description };
}
