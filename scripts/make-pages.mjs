// After `vite build`, everything search engines and AI assistants read:
// - a page for every place in every language (dist/<lang>/<id>/), for the views of the guide (dist/<lang>/plan/,
//   guide/, events/, food/) and a home page per language, each with its title, description, share preview (Open
//   Graph), links to its other languages, structured data (schema.org) and its content as plain HTML; the app then
//   opens on that place or view;
// - sitemap.xml (with every language version of each page), robots.txt, llms.txt and llms-full.txt (the guide as
//   plain text for AI search engines), and the Google Search Console verification tag.
// The site's address comes from VITE_SITE_URL (.env.local), or on Vercel from its production domain.
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
const get = (k) => process.env[k] ?? env[k] ?? '';
const vercelHost = get('VERCEL_PROJECT_PRODUCTION_URL');
const SITE = (get('VITE_SITE_URL') || (vercelHost ? `https://${vercelHost}` : '')).replace(/\/$/, '');
const GSC = get('GSC_VERIFICATION') || get('VITE_GSC_VERIFICATION');
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
const monthName = (m, l) => new Intl.DateTimeFormat(l === 'ar' ? 'ar-TN' : l, { month: 'long' }).format(new Date(2024, m, 15));
const OG = 'og.jpg';   // the share image of the home and guide pages (scripts/make-og.mjs)

const items = [
  ...D.SITES.map((s) => ({ id: s.id, walk: true, name: s.name, text: s.era, cats: D.SITE_CATS[s.id] ?? ['historic'], lat: s.lat, lon: s.lon, unesco: s.unesco,
    photo: s.id === 'el-jem' ? 'photos/el-jem/p22.jpg' : `photos/sites/${s.id}.jpg` })),
  ...D.PLACES.map((p) => ({ id: p.id, walk: false, name: p.name, text: p.text, cats: [p.cat], lat: p.lat, lon: p.lon, unesco: p.unesco, photo: `photos/places/${p.id}.jpg` })),
];
const byId = new Map(items.map((i) => [i.id, i]));
// the long description of a 3D monument is its intro on the site page; the card text is its era
const siteIntro = {};
for (const f of fs.readdirSync('src/sites').filter((f) => f.endsWith('.ts') && f !== 'types.ts')) {
  const s = fs.readFileSync(path.join('src/sites', f), 'utf8'), m = s.match(/intro: \{\s*en: '((?:[^'\\]|\\.)*)',\s*fr: '((?:[^'\\]|\\.)*)',\s*ar: '((?:[^'\\]|\\.)*)'/);
  if (m) siteIntro[f.replace(/\.ts$/, '')] = { en: m[1].replace(/\\'/g, "'"), fr: m[2].replace(/\\'/g, "'"), ar: m[3].replace(/\\'/g, "'") };
}
const describe = (it, l) => (it.walk && siteIntro[it.id] ? tr(siteIntro[it.id], l) : tr(it.text, l));

const CAT = { historic: 'catHistoric', beach: 'catBeach', nature: 'catNature', sahara: 'catSahara' };
const fmtH = (h, l) => { const m = Math.max(15, Math.round((h * 60) / 15) * 15); return m < 60 ? `${m} min` : ui('hoursShort', l).replace('{h}', String(Math.floor(m / 60))) + (m % 60 ? ` ${m % 60}` : ''); };

// structured data shared by every page: the site and who publishes it
const WEBSITE = SITE ? { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'Discover Tunisia', url: `${SITE}/`, inLanguage: LANGS,
  publisher: { '@type': 'Organization', name: 'Discover Tunisia', url: `${SITE}/`, logo: `${SITE}/icons/icon-512.png` },
  creator: { '@type': 'Organization', name: 'Storeware TN', url: 'https://storeware.tn/' }, copyrightYear: 2026 } : null;
/** The footer of every plain-HTML page: copyright and who made the site. */
const foot = (l) => `<footer><p>© 2026 Discover Tunisia · ${esc(ui('madeBy', l)).replace('{name}', '<a href="https://storeware.tn/">Storeware TN</a>')}</p></footer>`;
const TUNISIA = { '@type': 'Country', name: 'Tunisia', identifier: 'TN' };
const crumbs = (l, list) => (SITE ? { '@type': 'BreadcrumbList', itemListElement: list.map(([name, rel], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(rel) })) } : null);
const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': [WEBSITE, ...nodes].filter(Boolean) });

function page({ l, depth, title, desc, image, url, alternates, jsonld, body, extra }) {
  const up = '../'.repeat(depth);
  const head = [
    `<base href="${up || './'}">`,
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    GSC ? `<meta name="google-site-verification" content="${esc(GSC)}">` : '',
    url ? `<link rel="canonical" href="${url}">` : '',
    ...alternates.map(([hl, href]) => `<link rel="alternate" hreflang="${hl}" href="${href}">`),
    `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="Discover Tunisia">`,
    `<meta property="og:title" content="${esc(title)}">`, `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:locale" content="${l === 'zh' ? 'zh_CN' : l}">`,
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
    .replace('<div id="app"></div>', `<div id="app"><main class="seo">${body}</main>${foot(l)}</div>`);
}
const write = (rel, html) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
/** Every page with its language versions, for the sitemap. */
const pages = [];
const alts = (relOf) => (SITE ? [...LANGS.map((x) => [x, abs(relOf(x))]), ['x-default', abs(relOf('en'))]] : []);
const nav = (l) => `<nav><a href="${l}/">${esc(ui('navExplore', l))}</a> · <a href="${l}/plan/">${esc(ui('navPlan', l))}</a> · <a href="${l}/guide/">${esc(ui('navGuide', l))}</a> · <a href="${l}/events/">${esc(ui('navEvents', l))}</a> · <a href="${l}/food/">${esc(ui('navFoodShort', l))}</a></nav>`;

// ---- place pages ----
for (const it of items) for (const l of LANGS) {
  const name = tr(it.name, l), text = describe(it, l);
  const d = D.drive(D.TUNIS, [it.lat, it.lon]);
  const ap = D.AIRPORTS.map((a) => ({ a, d: D.km([it.lat, it.lon], [a.lat, a.lon]) })).sort((x, y) => x.d - y.d)[0];
  const rel = `${l}/${it.id}/`, v = D.VISITS[it.id];
  const facts = [
    [ui('bestTime', l), tr(D.BEST_TIME[it.cats[it.cats.length - 1]], l)],
    d.km >= 15 ? [ui('fromTunis', l), ui('byRoad', l).replace('{km}', String(d.km)).replace('{h}', fmtH(d.h, l))] : null,
    [ui('nearestAirport', l), ui('kmAway', l).replace('{name}', `${tr(ap.a.name, l)} · ${ap.a.code}`).replace('{km}', String(Math.max(5, Math.round(ap.d / 5) * 5)))],
    ...(v?.hours ? [[ui('hoursL', l), tr(v.hours, l)]] : []),
    ...(v?.price ? [[ui('ticketL', l), tr(v.price, l)]] : []),
    ...(v?.closed ? [[ui('closedL', l), tr(v.closed, l)]] : []),
  ].filter(Boolean);
  const body = `<article>${nav(l)}<h1>${esc(name)}</h1>`
    + `<p>${it.cats.map((c) => esc(ui(CAT[c], l))).join(' · ')}${it.unesco ? ' · UNESCO' : ''}${it.walk ? ` · ${esc(ui('walkIn3d', l))}` : ''}</p>`
    + `<img src="${it.photo}" alt="${esc(name)}" width="840">`
    + `<p>${esc(text)}</p>`
    + `<dl>${facts.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${esc(val)}</dd>`).join('')}</dl>`
    + `<p><a href="${l}/">${esc(ui('placesTitle', l))}</a></p></article>`;
  const place = { '@type': 'TouristAttraction', name, description: text, geo: { '@type': 'GeoCoordinates', latitude: it.lat, longitude: it.lon },
    address: { '@type': 'PostalAddress', addressCountry: 'TN' }, containedInPlace: TUNISIA, inLanguage: l,
    ...(SITE ? { url: abs(rel), image: abs(it.photo) } : {}), ...(it.unesco ? { award: 'UNESCO World Heritage' } : {}),
    ...(v?.price && /free/i.test(v.price.en) ? { isAccessibleForFree: true } : {}) };
  write(path.join(rel, 'index.html'), page({
    l, depth: 2, title: `${name} · Discover Tunisia`, desc: short(text), image: abs(it.photo), url: abs(rel), body,
    jsonld: graph(place, crumbs(l, [['Discover Tunisia', `${l}/`], [name, rel]])),
    alternates: alts((x) => `${x}/${it.id}/`), extra: `window.__PLACE__=${JSON.stringify(it.id)};`,
  }));
  if (l === 'en') pages.push((x) => `${x}/${it.id}/`);
}

// ---- the views of the guide: plan, before you go, festivals, food ----
const placeLink = (id, l) => { const it = byId.get(id); return it ? `<a href="${l}/${id}/">${esc(tr(it.name, l))}</a>` : ''; };
const VIEWS = {
  plan: (l) => ({ title: ui('planTitle', l), lead: ui('planText', l),
    body: D.ITINERARIES.map((it) => `<section><h2>${esc(tr(it.name, l))}</h2><p>${esc(tr(it.text, l))}</p><ol>${it.plan.map((d, i) => `<li><b>${esc(ui('dayN', l).replace('{n}', String(i + 1)))}</b> ${d.stops.map((s) => placeLink(s, l)).filter(Boolean).join(', ')}: ${esc(tr(d.text, l))}</li>`).join('')}</ol></section>`).join('')
      + `<section><h2>${esc(ui('themedJourneys', l))}</h2><ul>${D.JOURNEYS.map((j) => `<li><b>${esc(tr(j.name, l))}</b>: ${esc(tr(j.text, l))} (${j.stops.map((s) => placeLink(s, l)).filter(Boolean).join(', ')})</li>`).join('')}</ul></section>` }),
  guide: (l) => ({ title: ui('guideTitle', l), lead: ui('guideText', l),
    body: D.PRACTICAL.map((s) => `<section><h2>${esc(tr(s.title, l))}</h2><ul>${s.points.map((p) => `<li>${esc(tr(p, l))}</li>`).join('')}</ul><p>${esc(ui('sources', l))}: ${s.sources.map((u) => `<a href="${esc(u)}" rel="nofollow">${esc(new URL(u).hostname.replace(/^www\./, ''))}</a>`).join(' · ')}</p></section>`).join('') }),
  events: (l) => ({ title: ui('eventsTitle', l), lead: ui('eventsText', l),
    body: Array.from({ length: 12 }, (_, m) => { const evs = D.EVENTS.filter((e) => e.months.includes(m + 1)); return evs.length ? `<section><h2>${esc(monthName(m, l))}</h2><ul>${evs.map((e) => `<li><b>${esc(tr(e.name, l))}</b> (${esc(e.town)}): ${esc(tr(e.text, l))}</li>`).join('')}</ul></section>` : ''; }).join('') }),
  food: (l) => ({ title: ui('foodTitle', l), lead: ui('foodText', l),
    body: D.DISHES.map((d) => `<section><h2>${esc(d.name)} <span lang="ar">${esc(d.ar)}</span></h2><img src="photos/food/${d.id}.jpg" alt="${esc(d.name)}" width="720">${d.where ? `<p>${esc(tr(d.where, l))}</p>` : ''}<p>${esc(tr(d.text, l))}</p></section>`).join('')
      + `<section><h2>${esc(ui('phrasesTitle', l))}</h2><p>${esc(ui('phrasesText', l))}</p><table>${D.PHRASES.map((p) => `<tr><td>${esc(p.tr)}</td><td lang="ar">${esc(p.ar)}</td><td>${esc(tr(p.en, l))}</td></tr>`).join('')}</table></section>` }),
};
for (const [view, make] of Object.entries(VIEWS)) {
  for (const l of LANGS) {
    const v = make(l), rel = `${l}/${view}/`;
    const jsonld = graph(
      { '@type': view === 'events' ? 'CollectionPage' : 'WebPage', name: v.title, description: v.lead, inLanguage: l, about: TUNISIA, ...(SITE ? { url: abs(rel), isPartOf: { '@id': `${SITE}/#website` } } : {}) },
      crumbs(l, [['Discover Tunisia', `${l}/`], [v.title, rel]]),
      ...(view === 'events' ? D.EVENTS.map((e) => ({ '@type': 'Festival', name: tr(e.name, l), description: tr(e.text, l), location: { '@type': 'Place', name: e.town, address: { '@type': 'PostalAddress', addressLocality: e.town, addressCountry: 'TN' } }, ...(SITE ? { url: abs(rel) } : {}) })) : []),
      ...(view === 'plan' ? D.ITINERARIES.map((it) => ({ '@type': 'TouristTrip', name: tr(it.name, l), description: tr(it.text, l), touristType: 'Leisure',
        itinerary: { '@type': 'ItemList', itemListElement: [...new Set(it.plan.flatMap((d) => d.stops))].map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: tr(byId.get(s)?.name ?? { en: s }, l), ...(SITE ? { url: abs(`${l}/${s}/`) } : {}) } })) } })) : []),
    );
    write(path.join(rel, 'index.html'), page({
      l, depth: 2, title: `${v.title} · Discover Tunisia`, desc: short(v.lead), image: abs(OG), url: abs(rel), jsonld,
      body: `<article>${nav(l)}<h1>${esc(v.title)}</h1><p>${esc(v.lead)}</p>${v.body}</article>`,
      alternates: alts((x) => `${x}/${view}/`), extra: `window.__VIEW__=${JSON.stringify(view)};`,
    }));
  }
  pages.push((x) => `${x}/${view}/`);
}

// ---- a home page per language, and the root page ----
for (const l of LANGS) {
  const title = `${ui('brand', l)}: ${ui('heroTitle', l)}`, desc = short(ui('heroText', l));
  const list = items.map((it) => `<li><a href="${l}/${it.id}/">${esc(tr(it.name, l))}</a>: ${esc(short(tr(it.text, l), 110))}</li>`).join('');
  write(path.join(l, 'index.html'), page({
    l, depth: 1, title, desc, image: abs(OG), url: abs(`${l}/`),
    jsonld: graph({ '@type': 'TouristDestination', name: 'Tunisia', description: desc, inLanguage: l, containedInPlace: TUNISIA,
      includesAttraction: items.map((it) => ({ '@type': 'TouristAttraction', name: tr(it.name, l), ...(SITE ? { url: abs(`${l}/${it.id}/`) } : {}) })) }),
    body: `${nav(l)}<h1>${esc(ui('heroTitle', l))}</h1><p>${esc(ui('heroText', l))}</p><h2>${esc(ui('placesTitle', l))}</h2><ul>${list}</ul>`,
    alternates: SITE ? [...LANGS.map((x) => [x, abs(`${x}/`)]), ['x-default', `${SITE}/`]] : [],
  }));
}
pages.unshift((x) => `${x}/`);
{
  // the root page keeps detecting the visitor's language; it gets the English preview and links to every language
  const rootHead = [
    GSC ? `<meta name="google-site-verification" content="${esc(GSC)}">` : '',
    `<meta property="og:title" content="${esc(`Discover Tunisia: ${D.UI_TEXTS.heroTitle.en}`)}">`, `<meta property="og:description" content="${esc(short(D.UI_TEXTS.heroText.en))}">`,
    `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="Discover Tunisia">`, `<meta name="twitter:card" content="summary_large_image">`,
    SITE ? `<meta property="og:image" content="${abs(OG)}">` : '', SITE ? `<meta property="og:url" content="${SITE}/">` : '', SITE ? `<link rel="canonical" href="${SITE}/">` : '',
    ...(SITE ? [...LANGS.map((x) => `<link rel="alternate" hreflang="${x}" href="${abs(`${x}/`)}">`), `<link rel="alternate" hreflang="x-default" href="${SITE}/">`] : []),
    WEBSITE ? `<script type="application/ld+json">${JSON.stringify(graph()).replace(/</g, '\\u003c')}</script>` : '',
  ].filter(Boolean).join('\n    ');
  const list = items.map((it) => `<li><a href="en/${it.id}/">${esc(it.name.en)}</a></li>`).join('');
  write('index.html', template.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${rootHead}`)
    .replace('<div id="app"></div>', `<div id="app"><main class="seo">${nav('en')}<h1>${esc(D.UI_TEXTS.heroTitle.en)}</h1><p>${esc(D.UI_TEXTS.heroText.en)}</p><ul>${list}</ul></main>${foot('en')}</div>`));
}

// ---- for search engines and AI assistants ----
const link = (rel) => (SITE ? abs(rel) : `/${rel}`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `# Everyone is welcome, search engines and AI assistants alike.\nUser-agent: *\nAllow: /\n${SITE ? `\nSitemap: ${SITE}/sitemap.xml\n` : ''}`);
if (SITE) {
  const now = new Date().toISOString().slice(0, 10);
  const entry = (relOf) => LANGS.map((l) => `  <url><loc>${abs(relOf(l))}</loc><lastmod>${now}</lastmod>\n${LANGS.map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${abs(relOf(x))}"/>`).join('\n')}\n  </url>`).join('\n');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  <url><loc>${SITE}/</loc><lastmod>${now}</lastmod></url>\n${pages.map(entry).join('\n')}\n</urlset>\n`);
}
// llms.txt (https://llmstxt.org): what the site is and where its content lives; llms-full.txt: the guide itself
const en = 'en';
fs.writeFileSync(path.join(DIST, 'llms.txt'), `# Discover Tunisia

> A free, independent travel guide to Tunisia: a living map of ${items.length} places (heritage, beaches, nature, the Sahara and its oases), ${D.SITES.length} monuments to walk through in 3D, weather and climate, festivals by month, ready-made itineraries, practical advice and Tunisian food, in ${LANGS.length} languages. Facts are checked against the sources each page lists.

## Guide
- [The map of Tunisia](${link('en/')}): every place, with when to go, distances and the nearest airport
- [Plan my trip](${link('en/plan/')}): itineraries of 3, 7 and 10 days, day by day, and themed journeys
- [Before you go](${link('en/guide/')}): visas, money, safety, health, emergency numbers, transport, customs, holidays
- [What's on](${link('en/events/')}): festivals month by month
- [Food](${link('en/food/')}): dishes, where they are best, and phrases of Tunisian Arabic

## Places
${items.map((it) => `- [${it.name.en}](${link(`en/${it.id}/`)}): ${describe(it, en).split('. ')[0].replace(/\.$/, '')}`).join('\n')}

## Optional
- [The whole guide as plain text](${link('llms-full.txt')})
- Other languages: ${LANGS.filter((l) => l !== 'en').map((l) => `[${l}](${link(`${l}/`)})`).join(', ')}
`);
const visitLine = (id) => { const v = D.VISITS[id]; if (!v) return ''; return [v.hours && `Hours: ${v.hours.en}.`, v.price && `Ticket: ${v.price.en}.`, v.closed && `Closed: ${v.closed.en}.`, `(checked ${v.year})`].filter(Boolean).join(' '); };
fs.writeFileSync(path.join(DIST, 'llms-full.txt'), `# Discover Tunisia: the travel guide in plain text

${D.UI_TEXTS.heroText.en}

# Places

${items.map((it) => `## ${it.name.en}\n${it.cats.map((c) => D.UI_TEXTS[CAT[c]].en).join(', ')}${it.unesco ? ', UNESCO World Heritage' : ''}${it.walk ? ', walkable in 3D on the site' : ''}. Coordinates ${it.lat.toFixed(4)}, ${it.lon.toFixed(4)}.\n${describe(it, en)}\nBest time: ${D.BEST_TIME[it.cats[it.cats.length - 1]].en}. ${visitLine(it.id)}\nPage: ${link(`en/${it.id}/`)}`).join('\n\n')}

# Itineraries

${D.ITINERARIES.map((it) => `## ${it.name.en}\n${it.text.en}\n${it.plan.map((d, i) => `- Day ${i + 1}: ${d.stops.map((s) => byId.get(s)?.name.en ?? s).join(', ')}. ${d.text.en}`).join('\n')}`).join('\n\n')}

# Before you go

${D.PRACTICAL.map((s) => `## ${s.title.en}\n${s.points.map((p) => `- ${p.en}`).join('\n')}\nSources: ${s.sources.join(', ')}`).join('\n\n')}

# Festivals by month

${D.EVENTS.map((e) => `- ${e.name.en} (${e.town}; ${e.months.map((m) => monthName(m - 1, 'en')).join(' – ')}): ${e.text.en} Source: ${e.source}`).join('\n')}

# Food

${D.DISHES.map((d) => `- ${d.name} (${d.ar})${d.where ? `, ${d.where.en}` : ''}: ${d.text.en}`).join('\n')}

## Phrases of Tunisian Arabic
${D.PHRASES.map((p) => `- ${p.tr} (${p.ar}): ${p.en.en}`).join('\n')}
`);
console.log(`pages: ${items.length} places + ${Object.keys(VIEWS).length} guide views, × ${LANGS.length} languages, + ${LANGS.length} home pages; robots.txt, llms.txt, llms-full.txt`
  + (SITE ? `, sitemap for ${SITE}` : ' (set VITE_SITE_URL for canonical links, share images and the sitemap)') + (GSC ? ', Search Console tag' : ''));
