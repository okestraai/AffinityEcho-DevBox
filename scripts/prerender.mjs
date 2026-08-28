/**
 * Build-time SEO prerender.
 *
 * Affinity Echo ships as static files behind nginx (see Dockerfile stage 2), so there is no server
 * process in which to inject meta per request the way DocuIntelli's Express middleware does. A
 * crawler asking for /anonymous-forums got index.html: correct meta for the HOME page, and an empty
 * <div id="root">. Every marketing page was invisible to search and to AI answer engines.
 *
 * This writes a real HTML file per route after `vite build` — correct <title>, description,
 * canonical, Open Graph, Twitter Card, JSON-LD, and a crawler-visible <main> that React replaces on
 * mount. It needs NO nginx change: the existing `try_files $uri $uri/ /index.html` already serves
 * dist/anonymous-forums/index.html for /anonymous-forums via the `$uri/` branch.
 *
 * The solutions content is read from the SAME TypeScript module the app renders (transpiled here
 * with esbuild, which Vite already depends on), so the indexed copy and the visible copy cannot
 * drift apart.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { buildRoutes, BASE_URL } from './seo-routes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** Load solutionsContent.ts in Node by stripping its lucide imports out with esbuild. */
async function loadSolutions() {
  const result = await build({
    entryPoints: [join(root, 'src/components/public/solutionsContent.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    // lucide-react is JSX-heavy and irrelevant to extracting text, so it is stubbed out. The stub
    // must declare the icons by NAME: esbuild resolves named imports statically, so a Proxy default
    // export does not satisfy `import { EyeOff } from 'lucide-react'` — it fails with
    // "No matching export". The names are read from the source itself rather than hardcoded, so
    // adding an icon to a solution never breaks this build step.
    plugins: [
      {
        name: 'stub-lucide',
        setup(b) {
          b.onResolve({ filter: /^lucide-react$/ }, (a) => ({ path: a.path, namespace: 'stub' }));
          b.onLoad({ filter: /.*/, namespace: 'stub' }, () => {
            const src = readFileSync(join(root, 'src/components/public/solutionsContent.ts'), 'utf-8');
            const block = src.match(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/);
            const names = block
              ? block[1]
                  .split(',')
                  .map((n) => n.replace(/^\s*type\s+/, '').trim())
                  .filter(Boolean)
              : [];
            return {
              contents:
                names.map((n) => `export const ${n} = {};`).join('\n') +
                '\nexport default {};\n',
              loader: 'js',
            };
          });
        },
      },
    ],
  });
  const code = result.outputFiles[0].text;
  const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  return mod.SOLUTIONS;
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function headFor(route) {
  const jsonLd = (route.jsonLd ?? [])
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n    ');
  return `<title>${esc(route.title)}</title>
    <meta name="description" content="${esc(route.description)}" />
    <link rel="canonical" href="${esc(route.canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(route.canonical)}" />
    <meta property="og:title" content="${esc(route.title)}" />
    <meta property="og:description" content="${esc(route.description)}" />
    <meta property="og:image" content="${esc(route.ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(route.title)}" />
    <meta name="twitter:description" content="${esc(route.description)}" />
    <meta name="twitter:image" content="${esc(route.ogImage)}" />
    ${jsonLd}`;
}

/**
 * Replace the head tags this route owns, rather than appending duplicates. Two <title>s or two
 * canonicals is worse than none — the crawler picks one and you do not control which.
 */
function applyHead(html, route) {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, '__SEO_SLOT__');
  out = out.replace(/\s*<meta\s+name="description"[^>]*>/gi, '');
  out = out.replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '');
  out = out.replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/gi, '');
  out = out.replace(/\s*<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
  out = out.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  return out.replace('__SEO_SLOT__', headFor(route));
}

const routes = buildRoutes(await loadSolutions());
const template = readFileSync(join(dist, 'index.html'), 'utf-8');

for (const route of routes) {
  let html = applyHead(template, route);
  // React's createRoot replaces the container's children on mount, so this is crawler-only.
  html = html.replace('<div id="root"></div>', `<div id="root">${route.ssrBody}</div>`);

  const outDir = route.path === '/' ? dist : join(dist, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
  console.log(`  prerendered ${route.path}`);
}

// A sitemap listing only the public marketing routes. Authenticated surfaces are deliberately
// absent — they 302 to login for a crawler, which is a wasted crawl and a soft-404 signal.
const today = new Date().toISOString().slice(0, 10);
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  routes
    .map(
      (r) =>
        `  <url><loc>${r.canonical}</loc><lastmod>${today}</lastmod>` +
        `<changefreq>monthly</changefreq><priority>${r.path === '/' ? '1.0' : '0.8'}</priority></url>`,
    )
    .join('\n') +
  `\n</urlset>\n`;
writeFileSync(join(dist, 'sitemap.xml'), sitemap);

// Disallow the authenticated app so crawl budget goes to the pages that can actually rank.
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /onboarding\n` +
    `Disallow: /verify-otp\nDisallow: /reset-password\nDisallow: /change-password\n` +
    `Disallow: /auth/\n\nSitemap: ${BASE_URL}/sitemap.xml\n`,
);

console.log(`  sitemap.xml + robots.txt written (${routes.length} routes)`);
