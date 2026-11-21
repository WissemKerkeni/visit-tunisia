// After `vite build`: a page of its own for every place in every language (dist/<lang>/<id>/index.html), and a home
// page per language (dist/<lang>/index.html). Each has its title, description, share preview (Open Graph), links to
// its other languages, structured data (schema.org TouristAttraction) and readable content for search engines and
// visitors without JavaScript; the app then opens on that place. With VITE_SITE_URL set (.env.local), also writes
// canonical links, absolute share images, sitemap.xml and robots.txt.
// Usage (run by `npm run build`): node scripts/make-pages.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// ---- the site's own content, bundled for Node ----
const tmp = path.resolve('node_modules/.cache/make-pages/data.mjs');
await build({ entryPoints: ['scripts/pages-entry.ts'], bundle: true, platform: 'node', format: 'esm', outfile: tmp, logLevel: 'error', loader: { '.json': 'json' } });
const D = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);

const env = {};
for (const f of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
}
const SITE = (process.env.VITE_SITE_URL ?? env.VITE_SITE_URL ?? '').replace(/\/$/, '');
const DIST = 'dist';
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const LANGS = D.LANGS.map((l) => l.id);
const BASE = new Set(['en', 'fr', 'ar']);
const dicts = Object.fromEntries(LANGS.filter((l) => l !== 'en').map((l) => [l, JSON.parse(fs.readFileSync(`src/locales/${l}.json`, 'utf8'))]));
// French and Arabic are beside the English in the code, except for English-only texts (then in src/locales too)
const tr = (v, l) => (BASE.has(l) ? v[l] : undefined) ?? dicts[l]?.[v.en] ?? v.en;
const ui = (k, l) => tr(D.UI_TEXTS[k], l);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const short = (s, n = 158) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '…');
const abs = (p) => (SITE ? `${SITE}/${p}` : null);

const items = [
  ...D.SITES.map((s) => ({ id: s.id, walk: true, name: s.name, text: s.era, cats: D.SITE_CATS[s.id] ?? ['historic'], lat: s.lat, lon: s.lon, unesco: s.unesco,
    photo: s.id === 'el-jem' ? 'photos/el-jem/p22.jpg' : `photos/sites/${s.id}.jpg` })),
  ...D.PLACES.map((p) => ({ id: p.id, walk: false, name: p.name, text: p.text, cats: [p.cat], lat: p.lat, lon: p.lon, unesco: p.unesco, photo: `photos/places/${p.id}.jpg` })),
];
// the long description of a 3D monument is its intro on the site page; the card text is its era
const siteIntro = {};
for (const f of fs.readdirSync('src/sites').filter((f) => f.endsWith('.ts') && f !== 'types.ts')) {
  const s = fs.readFileSync(path.join('src/sites', f), 'utf8'), m = s.match(/intro: \{\s*en: '((?:[^'\\]|\\.)*)',\s*fr: '((?:[^'\\]|\\.)*)',\s*ar: '((?:[^'\\]|\\.)*)'/);
  if (m) siteIntro[f.replace(/\.ts$/, '')] = { en: m[1].replace(/\\'/g, "'"), fr: m[2].replace(/\\'/g, "'"), ar: m[3].replace(/\\'/g, "'") };
}

const CAT = { historic: 'catHistoric', beach: 'catBeach', nature: 'catNature', sahara: 'catSahara' };
const fmtH = (h, l) => { const m = Math.max(15, Math.round((h * 60) / 15) * 15); return m < 60 ? `${m} min` : ui('hoursShort', l).replace('{h}', String(Math.floor(m / 60))) + (m % 60 ? ` ${m % 60}` : ''); };

function page({ l, depth, title, desc, image, url, alternates, jsonld, body, extra }) {
  const up = '../'.repeat(depth);
  const head = [
    `<base href="${up || './'}">`,
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    url ? `<link rel="canonical" href="${url}">` : '',
    ...alternates.map(([hl, href]) => `<link rel="alternate" hreflang="${hl}" href="${href}">`),
    `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="Visit Tunisia">`,
    `<meta property="og:title" content="${esc(title)}">`, `<meta property="og:description" content="${esc(desc)}">`,
    url ? `<meta property="og:url" content="${url}">` : '',
    image ? `<meta property="og:image" content="${image}">` : '', `<meta name="twitter:card" content="summary_large_image">`,
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '',
    `<script>window.__LANG__=${JSON.stringify(l)};${extra ?? ''}</script>`,
  ].filter(Boolean).join('\n    ');
  return template
    .replace(/<html lang="[^"]*"/, `<html lang="${l}" dir="${l === 'ar' ? 'rtl' : 'ltr'}"`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${head}`)
    .replace('<div id="app"></div>', `<div id="app"><main class="seo">${body}</main></div>`);
}
const write = (rel, html) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const urls = [];

// ---- place pages ----
for (const it of items) for (const l of LANGS) {
  const name = tr(it.name, l), text = it.walk && siteIntro[it.id] ? tr(siteIntro[it.id], l) : tr(it.text, l);
  const d = D.drive(D.TUNIS, [it.lat, it.lon]);
  const ap = D.AIRPORTS.map((a) => ({ a, d: D.km([it.lat, it.lon], [a.lat, a.lon]) })).sort((x, y) => x.d - y.d)[0];
  const rel = `${l}/${it.id}/`;
  const facts = [
    [ui('bestTime', l), tr(D.BEST_TIME[it.cats[it.cats.length - 1]], l)],
    d.km >= 15 ? [ui('fromTunis', l), ui('byRoad', l).replace('{km}', String(d.km)).replace('{h}', fmtH(d.h, l))] : null,
    [ui('nearestAirport', l), ui('kmAway', l).replace('{name}', `${tr(ap.a.name, l)} · ${ap.a.code}`).replace('{km}', String(Math.max(5, Math.round(ap.d / 5) * 5)))],
    ...(D.VISITS[it.id]?.hours ? [[ui('hoursL', l), tr(D.VISITS[it.id].hours, l)]] : []),
    ...(D.VISITS[it.id]?.price ? [[ui('ticketL', l), tr(D.VISITS[it.id].price, l)]] : []),
    ...(D.VISITS[it.id]?.closed ? [[ui('closedL', l), tr(D.VISITS[it.id].closed, l)]] : []),
  ].filter(Boolean);
  const body = `<article><p><a href="${l}/">Visit Tunisia</a></p><h1>${esc(name)}</h1>`
    + `<p>${it.cats.map((c) => esc(ui(CAT[c], l))).join(' · ')}${it.unesco ? ' · UNESCO' : ''}${it.walk ? ` · ${esc(ui('walkIn3d', l))}` : ''}</p>`
    + `<img src="${it.photo}" alt="${esc(name)}" width="840">`
    + `<p>${esc(text)}</p>`
    + `<dl>${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
    + `<p><a href="${l}/">${esc(ui('placesTitle', l))}</a></p></article>`;
  const jsonld = { '@context': 'https://schema.org', '@type': 'TouristAttraction', name, description: text, geo: { '@type': 'GeoCoordinates', latitude: it.lat, longitude: it.lon },
    ...(SITE ? { url: abs(rel), image: abs(it.photo) } : {}), ...(it.unesco ? { award: 'UNESCO World Heritage' } : {}) };
  write(path.join(rel, 'index.html'), page({
    l, depth: 2, title: `${name} · Visit Tunisia`, desc: short(text), image: abs(it.photo), url: abs(rel), jsonld, body,
    alternates: SITE ? [...LANGS.map((x) => [x, abs(`${x}/${it.id}/`)]), ['x-default', abs(`en/${it.id}/`)]] : [],
    extra: `window.__PLACE__=${JSON.stringify(it.id)};`,
  }));
  urls.push(rel);
}

// ---- a home page per language, and the root page's share preview ----
for (const l of LANGS) {
  const title = `${ui('brand', l)}: ${ui('heroTitle', l)}`, desc = short(ui('heroText', l));
  const list = items.map((it) => `<li><a href="${l}/${it.id}/">${esc(tr(it.name, l))}</a></li>`).join('');
  write(path.join(l, 'index.html'), page({
    l, depth: 1, title, desc, image: abs('photos/el-jem/p22.jpg'), url: abs(`${l}/`), jsonld: null,
    body: `<h1>${esc(ui('heroTitle', l))}</h1><p>${esc(ui('heroText', l))}</p><ul>${list}</ul>`,
    alternates: SITE ? [...LANGS.map((x) => [x, abs(`${x}/`)]), ['x-default', abs('')]] : [],
  }));
  urls.push(`${l}/`);
}
{
  // the root page keeps detecting the visitor's language; it gets the English preview and links to every language
  const rootHead = [
    `<meta property="og:title" content="${esc(`Visit Tunisia: ${D.UI_TEXTS.heroTitle.en}`)}">`, `<meta property="og:description" content="${esc(short(D.UI_TEXTS.heroText.en))}">`,
    `<meta property="og:type" content="website">`, `<meta name="twitter:card" content="summary_large_image">`,
    SITE ? `<meta property="og:image" content="${abs('photos/el-jem/p22.jpg')}">` : '', SITE ? `<link rel="canonical" href="${SITE}/">` : '',
    ...(SITE ? LANGS.map((x) => `<link rel="alternate" hreflang="${x}" href="${abs(`${x}/`)}">`) : []),
  ].filter(Boolean).join('\n    ');
  const list = items.map((it) => `<li><a href="en/${it.id}/">${esc(it.name.en)}</a></li>`).join('');
  write('index.html', template.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${rootHead}`)
    .replace('<div id="app"></div>', `<div id="app"><main class="seo"><h1>${esc(D.UI_TEXTS.heroTitle.en)}</h1><p>${esc(D.UI_TEXTS.heroText.en)}</p><ul>${list}</ul></main></div>`));
}

if (SITE) {
  const now = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', ...urls].map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${now}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
}
console.log(`pages: ${items.length} places × ${LANGS.length} languages + ${LANGS.length} home pages${SITE ? `, sitemap for ${SITE}` : ' (set VITE_SITE_URL for canonical links, share images and the sitemap)'}`);
