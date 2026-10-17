import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronRight, CircleHelp, Clock3, FileQuestion, LifeBuoy, LockKeyhole, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../app/firebase';
import { Badge } from '../../redesign/components/ui/badge';
import { Button } from '../../redesign/components/ui/button';
import { articleBySlug, articles, categories, categoryBySlug, searchArticles } from '../data/articles';

const anchor = (heading) => heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const categoryCount = (slug) => articles.filter((entry) => entry.category === slug && entry.status === 'published').length;

function Breadcrumbs({ parts }) {
  return <nav aria-label="Breadcrumb" className="help-breadcrumbs"><Link to="/">Help Centre</Link>{parts.map(([label, url], index) => <span key={`${label}-${index}`} className="inline-flex items-center gap-2"><ChevronRight size={13} aria-hidden="true" />{url ? <Link to={url}>{label}</Link> : <span aria-current="page">{label}</span>}</span>)}</nav>;
}

function ArticleCard({ article, compact = false }) {
  const category = categoryBySlug(article.category);
  return <Link to={`/articles/${article.slug}`} className={`help-article-card group ${compact ? 'help-article-card-compact' : ''}`}>
    <div className="help-article-meta"><BookOpen size={14} aria-hidden="true" /><span>{category?.name}</span><span aria-hidden="true">·</span><span>{article.sections.length} sections</span></div>
    <div className="help-article-title-row"><h3>{article.title}</h3><ArrowRight size={17} className="help-card-arrow" aria-hidden="true" /></div>
    <p>{article.excerpt}</p>
  </Link>;
}

function SectionHeader({ eyebrow, title, description, action }) {
  return <div className="help-section-header"><div><span className="help-eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

export function HelpHomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const submit = (event) => { event.preventDefault(); navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`); };
  const featured = articles.filter((entry) => entry.featured && entry.status === 'published').slice(0, 6);

  return <main>
    <section className="help-hero"><div className="help-main help-hero-inner">
      <div className="help-hero-copy"><span className="help-kicker"><Sparkles size={14} /> THE UPET HELP CENTRE</span><h1>Answers for everything <em>user.pet.</em></h1><p>Get your account working, make your profile feel like yours, and find help when something goes wrong. Clear guides when you want to solve it yourself. A real support ticket when you need the team.</p>
        <form onSubmit={submit} role="search" className="help-search"><Search size={21} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “upload a GIF” or “shop privacy”" aria-label="Search help articles" /><button type="submit" aria-label="Search articles"><ArrowRight size={18} /></button></form>
        <div className="help-quick-search"><span>Popular searches</span><Link to="/search?q=password">Reset password</Link><Link to="/search?q=shop">Set up a shop</Link><Link to="/search?q=music">Music & lyrics</Link></div>
      </div><div className="help-hero-panel" aria-hidden="true"><div className="help-hero-panel-top"><span className="help-mini-dot" /> UPET SUPPORT <span>01 / 03</span></div><div className="help-hero-panel-body"><div className="help-panel-icon"><LifeBuoy size={30} /></div><div className="help-panel-line help-panel-line-lg" /><div className="help-panel-line" /><div className="help-panel-line help-panel-line-short" /><div className="help-panel-cards"><div><BookOpen size={18} /><span>Find a guide</span></div><div><LockKeyhole size={18} /><span>Private tickets</span></div></div></div></div>
    </div></section>

    <div className="help-main help-home-content"><section><SectionHeader eyebrow="START SOMEWHERE" title="What can we help with?" description="Pick an area to see practical steps, troubleshooting and related guides." /><div className="help-category-grid">{categories.map((category, index) => {
      const Icon = category.icon; const count = categoryCount(category.slug);
      const content = <><div className="help-category-top"><span className="help-category-icon"><Icon size={21} strokeWidth={1.8} /></span><span className="help-category-number">0{index + 1}</span></div><h3>{category.name}</h3><p>{category.description}</p><div className="help-category-bottom"><span>{category.available ? `${count} guide${count === 1 ? '' : 's'}` : 'Coming soon'}</span>{category.available && <ArrowRight size={18} className="help-card-arrow" />}</div></>;
      return category.available ? <Link key={category.slug} to={`/category/${category.slug}`} className="help-category-card">{content}</Link> : <div key={category.slug} className="help-category-card help-category-unavailable">{content}</div>;
    })}</div></section>

      <section className="help-home-section"><SectionHeader eyebrow="GOOD PLACES TO BEGIN" title="Helpful right now" description="Short guides for the things people ask about most." action={<Button asChild variant="outline"><Link to="/search">Browse all {articles.length} guides <ArrowRight size={15} /></Link></Button>} /><div className="help-featured-grid">{featured.map((entry) => <ArticleCard key={entry.slug} article={entry} />)}</div></section>

      <section className="help-home-section help-route-section"><SectionHeader eyebrow="HOW SUPPORT WORKS" title="Find the right route" description="Choose the fastest way to get the help you need." /><div className="help-route-grid"><div className="help-route-card"><span className="help-route-icon"><Search size={22} /></span><h3>Find an answer</h3><p>Search by the thing you are trying to do. Guides include real steps and what to try when something fails.</p><Link to="/search">Explore the guides <ArrowRight size={16} /></Link></div><div className="help-route-card"><span className="help-route-icon"><LockKeyhole size={22} /></span><h3>Keep it private</h3><p>For account details, bug reports or safety concerns, sign in and open a private ticket. Only your account and authorised support staff can read its public conversation.</p><Link to="/tickets/new">Open a ticket <ArrowRight size={16} /></Link></div><div className="help-route-card"><span className="help-route-icon"><ShieldCheck size={22} /></span><h3>Report a concern</h3><p>Tell the owner team about suspicious profiles, unsafe listings or impersonation. Add the relevant URL and a factual description.</p><Link to="/articles/report-a-safety-concern">How to report <ArrowRight size={16} /></Link></div></div></section>

      <section className="help-contact-banner"><div><span className="help-eyebrow">STILL NEED A HUMAN?</span><h2>Tell us what happened.</h2><p>Support is currently handled by Upet owners. Send a private ticket with the page URL, what you expected and any error text. We do not promise an around-the-clock response.</p></div><Button asChild><Link to="/tickets/new"><LifeBuoy size={16} /> Open a support ticket</Link></Button></section>
    </div>
  </main>;
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || ''; const category = params.get('category') || '';
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  useEffect(() => { if (draft === query) return undefined; const timer = setTimeout(() => { const next = new URLSearchParams(params); draft.trim() ? next.set('q', draft.trim()) : next.delete('q'); setParams(next, { replace: true }); }, 220); return () => clearTimeout(timer); }, [draft, query, params, setParams]);
  const results = useMemo(() => searchArticles(query, category), [query, category]);
  return <main className="help-main help-page"><Breadcrumbs parts={[["All articles"]]} /><div className="help-page-intro"><span className="help-eyebrow">KNOWLEDGE BASE</span><h1>Explore the guides.</h1><p>Search the whole library, or filter by topic. Every result below is a published guide you can open right now.</p></div>
    <div className="help-filter-row"><label className="help-search help-search-page"><Search size={20} /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search guides, features and common problems" aria-label="Search guides" /></label><select className="help-input" value={category} aria-label="Filter by category" onChange={(event) => { const next = new URLSearchParams(params); event.target.value ? next.set('category', event.target.value) : next.delete('category'); setParams(next); }}><option value="">All categories</option>{categories.filter((item) => item.available).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
    <div className="help-result-bar"><span>{results.length} guide{results.length === 1 ? '' : 's'} found</span>{query && <span>Results for “{query}”</span>}</div><div className="help-article-grid">{results.map((entry) => <ArticleCard key={entry.slug} article={entry} />)}</div>{!results.length && <div className="help-empty"><FileQuestion size={28} /><h2>No matching guides</h2><p>Try fewer words, check the spelling, or tell support what you were looking for.</p><Button asChild><Link to="/tickets/new">Open a ticket</Link></Button></div>}
  </main>;
}

export function CategoryPage() {
  const { slug } = useParams(); const category = categoryBySlug(slug); const rows = articles.filter((entry) => entry.category === slug && entry.status === 'published');
  if (!category?.available) return <main className="help-main help-page"><h1 className="help-title">Category unavailable</h1><Button asChild variant="outline" className="mt-6"><Link to="/">Back to Help</Link></Button></main>;
  const Icon = category.icon;
  return <main className="help-main help-page"><Breadcrumbs parts={[[category.name]]} /><div className="help-category-heading"><div className="help-category-heading-icon"><Icon size={30} /></div><div><span className="help-eyebrow">TOPIC · {rows.length} GUIDES</span><h1>{category.name}</h1><p>{category.description} Browse the guides below for steps, tips and ways to get support when you need it.</p></div></div><div className="help-category-layout"><div className="help-article-list">{rows.map((entry) => <ArticleCard key={entry.slug} article={entry} compact />)}</div><aside className="help-side-card"><CircleHelp size={23} /><h2>Still stuck?</h2><p>Some problems need account-specific help. A ticket lets the Upet team review the details privately.</p><Button asChild size="sm"><Link to="/tickets/new">Contact support</Link></Button></aside></div></main>;
}

export function ArticlePage() {
  const { slug } = useParams(); const entry = articleBySlug(slug);
  if (!entry) return <main className="help-main help-page"><h1 className="help-title">Article not found</h1><p className="mt-3 text-muted-foreground">This guide may have moved or is no longer available.</p><Button asChild className="mt-6"><Link to="/search">Search help</Link></Button></main>;
  const category = categoryBySlug(entry.category); const related = articles.filter((item) => item.category === entry.category && item.slug !== entry.slug && item.status === 'published').slice(0, 3);
  return <main className="help-main help-page"><Breadcrumbs parts={[[category?.name || 'Articles', `/category/${entry.category}`], [entry.title]]} /><div className="help-article-layout"><article className="help-article-body"><div className="help-article-heading"><span className="help-eyebrow">{category?.name?.toUpperCase()}</span><h1>{entry.title}</h1><p>{entry.excerpt}</p><div className="help-article-byline"><span><Clock3 size={15} /> Reviewed {entry.reviewedAt}</span><span><BookOpen size={15} /> {entry.sections.length} sections</span></div></div><div className="help-article-content">{entry.sections.map(([heading, steps], index) => <section key={heading} id={anchor(heading)}><div className="help-step-number">{String(index + 1).padStart(2, '0')}</div><h2>{heading}</h2><ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol></section>)}</div><div className="help-article-end"><LifeBuoy size={24} /><div><h2>Need more help with this?</h2><p>Open a private ticket and include your profile URL and any error text. That gives the owner team a clearer starting point.</p></div><Button asChild><Link to="/tickets/new">Open a ticket</Link></Button></div>{related.length > 0 && <section className="help-related"><SectionHeader eyebrow="KEEP EXPLORING" title="Related guides" /><div className="help-article-grid">{related.map((item) => <ArticleCard key={item.slug} article={item} compact />)}</div></section>}</article><aside className="help-article-aside"><div className="help-toc"><span className="help-eyebrow">ON THIS PAGE</span>{entry.sections.map(([heading], index) => <a key={heading} href={`#${anchor(heading)}`}><span>{String(index + 1).padStart(2, '0')}</span>{heading}</a>)}<div className="help-toc-divider" /><Link to={`/category/${entry.category}`}>More in {category?.name}<ArrowRight size={14} /></Link></div></aside></div></main>;
}

export function ContactPage() {
  return <main className="help-main help-page"><Breadcrumbs parts={[["Contact"]]} /><div className="help-page-intro"><span className="help-eyebrow">WE'RE HERE TO HELP</span><h1>Tell us what you need.</h1><p>A clear description helps the owner team understand the issue. Choose a private ticket for account, profile, shop or safety concerns.</p></div><div className="help-contact-grid"><div className="help-route-card"><span className="help-route-icon"><LockKeyhole size={22} /></span><h2>Open a private ticket</h2><p>Sign in with your user.pet account. Describe the problem, add the relevant URL and include any error text. Replies stay in a private conversation you can revisit.</p><Button asChild><Link to="/tickets/new">Open a ticket <ArrowRight size={15} /></Link></Button></div><div className="help-route-card"><span className="help-route-icon"><BookOpen size={22} /></span><h2>Check a guide first</h2><p>Find step-by-step help for signing in, editing a profile, uploading media, configuring a shop and reporting a concern.</p><Button asChild variant="outline"><Link to="/search">Browse the guides <ArrowRight size={15} /></Link></Button></div><div className="help-route-card"><span className="help-route-icon"><LifeBuoy size={22} /></span><h2>Contact by email</h2><p>Use support@user.pet for general contact or if you cannot sign in to open a ticket. Do not send passwords, reset links or authentication codes.</p><Button asChild variant="outline"><a href="mailto:support@user.pet">Email support <ArrowRight size={15} /></a></Button></div></div><div className="help-contact-note"><ShieldCheck size={19} /><p>Upet owners currently handle support. Tickets are not an emergency channel, and no response time is guaranteed.</p></div></main>;
}

const policyNames = { terms: 'Terms of Service', privacy: 'Privacy Policy', cookies: 'Cookie Policy', 'community-guidelines': 'Community Guidelines', 'acceptable-use': 'Acceptable Use Policy', marketplace: 'Marketplace Rules', refunds: 'Refunds & Disputes', 'intellectual-property': 'Intellectual Property Reporting', accessibility: 'Accessibility Statement' };
export function LegalPolicyPage() {
  const { slug } = useParams(); const title = policyNames[slug]; const [policy, setPolicy] = useState(null);
  useEffect(() => { if (!title || !firestore) return; getDoc(doc(firestore, 'helpLegalDocuments', slug)).then((snapshot) => { const data = snapshot.data(); setPolicy(data?.approved && data?.body ? data : null); }).catch(() => setPolicy(null)); }, [slug, title]);
  if (!title) return <main className="help-main help-page"><h1 className="help-title">Policy not found</h1><Button asChild className="mt-6"><Link to="/">Return to Help</Link></Button></main>;
  return <main className="help-main help-page"><Breadcrumbs parts={[["Policies"], [title]]} /><div className="help-page-intro"><span className="help-eyebrow">UPET POLICIES</span><h1>{title}</h1><p>Information about this part of the service and how to contact the team with a question.</p></div><div className="help-policy-layout"><article className="help-policy-card">{policy ? <><Badge variant="secondary">Published policy</Badge><p className="mt-5 text-sm text-muted-foreground">Version {policy.version} · Effective {policy.effectiveDate}</p><div className="help-prose mt-8 whitespace-pre-wrap">{policy.body}</div></> : <><span className="help-policy-icon"><FileQuestion size={28} /></span><h2>Policy being prepared</h2><p>This policy has not yet been approved for publication. We will not present unfinished wording as a final policy. If you need information about your account, data, a listing or a report, contact the Upet team directly.</p><div className="help-policy-actions"><Button asChild><Link to="/contact">Contact support</Link></Button><Button asChild variant="outline"><Link to="/search">Browse help articles</Link></Button></div></>}</article><aside className="help-side-card"><span className="help-eyebrow">OTHER TOPICS</span><div className="help-policy-links">{Object.entries(policyNames).filter(([key]) => key !== slug).map(([key, label]) => <Link key={key} to={`/legal/${key}`}>{label}<ArrowRight size={15} /></Link>)}</div></aside></div></main>;
}
