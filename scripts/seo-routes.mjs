/**
 * Per-route SEO registry for the public marketing pages.
 *
 * Mirrors the shape of DocuIntelli's `server/src/config/seoConfig.ts` — title, description,
 * canonical, Open Graph, JSON-LD, and an `ssrBody` of real HTML for crawlers. The delivery
 * mechanism differs because the deployment does: DocuIntelli injects at request time from Express,
 * whereas Affinity Echo is static files behind nginx with no Node process to run middleware in.
 * So the same data is baked into per-route HTML at build time instead (see prerender.mjs).
 */

export const BASE_URL = 'https://affinityecho.com';
const OG_IMAGE = `${BASE_URL}/affinity-echo-logo-hd.png`;

const organisation = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Affinity Echo',
  url: BASE_URL,
  logo: OG_IMAGE,
  description:
    'An anonymous-first professional networking platform for underrepresented communities in tech.',
};

function breadcrumb(name, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name, item: `${BASE_URL}${path}` },
    ],
  };
}

function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The crawler-visible body. React replaces this the moment it mounts, so it is never seen by a
 * human — it exists so a bot without JS, and an AI answer engine, read the real content instead of
 * an empty <div id="root">.
 */
function ssrBodyFor(s) {
  const sections = s.sections
    .map((sec) => `<section><h2>${esc(sec.h2)}</h2><p>${esc(sec.p)}</p></section>`)
    .join('');
  const faqs = s.faqs
    .map((f) => `<section><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></section>`)
    .join('');
  return (
    `<main><h1>${esc(s.h1)}</h1><p>${esc(s.intro)}</p>${sections}` +
    `<h2>Frequently asked questions</h2>${faqs}</main>`
  );
}

/** Build the full route registry from the solutions content the app itself renders. */
export function buildRoutes(solutions) {
  const home = {
    path: '/',
    title: 'Affinity Echo — Anonymous Professional Community for Tech',
    description:
      'Connect anonymously with professionals who share your experiences. Anonymous forums, safe spaces, mentorship matching and encrypted messaging — you choose if and when you reveal your identity.',
    jsonLd: [organisation],
    ssrBody:
      '<main><h1>Your Safe Space in Corporate America</h1>' +
      '<p>Connect anonymously with professionals who share your experiences. Find mentorship, ' +
      'support, and community — without ever revealing your identity.</p></main>',
  };

  const solutionRoutes = solutions.map((s) => ({
    path: `/${s.slug}`,
    title: `${s.h1} · Affinity Echo`,
    description: s.intro.slice(0, 155),
    jsonLd: [breadcrumb(s.label, `/${s.slug}`), faqSchema(s.faqs)],
    ssrBody: ssrBodyFor(s),
  }));

  return [home, ...solutionRoutes].map((r) => ({
    ...r,
    canonical: `${BASE_URL}${r.path}`,
    ogImage: OG_IMAGE,
  }));
}
