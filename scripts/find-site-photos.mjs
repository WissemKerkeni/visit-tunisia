// Find candidate photos on Wikimedia Commons for each monument (free licences only) and build a
// numbered contact sheet per monument so the best one can be picked by eye.
// Usage: node scripts/find-site-photos.mjs <outDir> [site "query 1" "query 2" ...]   (one site with custom queries)
// Writes <outDir>/candidates.json and <outDir>/<site>.jpg (contact sheets).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = process.argv[2] || 'references/sites/candidates';
fs.mkdirSync(OUT, { recursive: true });
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = { 'User-Agent': 'VisitTunisia/0.1 (heritage education site; photo credits kept)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const [, , , onlySite, ...custom] = process.argv;
const DEFAULT_QUERIES = {
  'sidi-bou-said': ['Sidi Bou Said'],
  carthage: ['Antonine Baths Carthage', 'Carthage ruins'],
  'tunis-medina': ['Medina of Tunis', 'Zitouna Mosque'],
  dougga: ['Dougga Capitol', 'Dougga'],
  'bulla-regia': ['Bulla Regia'],
  kairouan: ['Great Mosque of Kairouan', 'Mosque of Uqba'],
  sousse: ['Ribat of Sousse', 'Medina of Sousse'],
  sbeitla: ['Sbeitla', 'Sufetula'],
  matmata: ['Matmata troglodyte', 'Matmata'],
  djerba: ['Djerba Houmt Souk', 'El Ghriba synagogue', 'Djerba'],
  'ksar-ouled-soltane': ['Ksar Ouled Soltane'],
};
const QUERIES = onlySite ? { [onlySite]: custom } : DEFAULT_QUERIES;
const FREE = /^(CC0|Public domain|PD|CC BY(-SA)? [1-4]\.0)/i;

async function api(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: 2, ...params })) u.searchParams.set(k, v);
  for (let t = 0; t < 7; t++) {
    const r = await fetch(u, { headers: UA });
    if (r.status === 429) { await sleep(8000 * (t + 1)); continue; }
    return r.json();
  }
  throw new Error('rate limited');
}
const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const CJ = path.join(OUT, 'candidates.json');
const all = fs.existsSync(CJ) ? JSON.parse(fs.readFileSync(CJ, 'utf8')) : {};
for (const [site, qs] of Object.entries(QUERIES)) {
  if (all[site]?.length && !onlySite) continue; // resumable
  const titles = new Set();
  for (const q of qs) {
    for (const extra of ['incategory:"Quality images"', '']) {
      const r = await api({ action: 'query', list: 'search', srnamespace: 6, srlimit: 14, srsearch: `${q} filetype:bitmap ${extra}` });
      for (const s of r.query?.search ?? []) titles.add(s.title);
      await sleep(400);
      if (titles.size >= 18) break;
    }
    if (titles.size >= 18) break;
  }
  const list = [...titles].slice(0, 24);
  const info = await api({ action: 'query', titles: list.join('|'), prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: 480 });
  const cands = [];
  for (const p of info.query?.pages ?? []) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const m = ii.extmetadata || {};
    const license = strip(m.LicenseShortName?.value);
    if (!FREE.test(license) || Math.max(ii.width, ii.height) < 1600 || ii.width < ii.height * 0.9) continue; // landscape-ish, big enough, free
    cands.push({
      title: p.title, width: ii.width, height: ii.height, thumb: ii.thumburl, url: ii.url,
      author: strip(m.Artist?.value) || 'unknown', license, license_url: m.LicenseUrl?.value || '',
      source: ii.descriptionurl, desc: strip(m.ImageDescription?.value).slice(0, 160),
    });
  }
  all[site] = cands.slice(0, 16);
  // contact sheet
  const tw = 360, th = 240, cols = 4;
  const tiles = [];
  for (let i = 0; i < all[site].length; i++) {
    try {
      const r = await fetch(all[site][i].thumb, { headers: UA });
      const img = await sharp(Buffer.from(await r.arrayBuffer())).resize(tw, th, { fit: 'cover' }).jpeg().toBuffer();
      const label = Buffer.from(`<svg width="${tw}" height="24"><rect width="60" height="24" fill="black"/><text x="6" y="18" font-size="18" fill="yellow" font-family="sans-serif">${i}</text></svg>`);
      tiles.push({ input: img, left: (i % cols) * tw, top: Math.floor(i / cols) * th }, { input: label, left: (i % cols) * tw, top: Math.floor(i / cols) * th });
    } catch (e) { console.warn(site, i, e.message); }
    await sleep(250);
  }
  if (tiles.length) {
    const rows = Math.ceil(all[site].length / cols);
    await sharp({ create: { width: cols * tw, height: rows * th, channels: 3, background: '#111' } }).composite(tiles).jpeg({ quality: 70 }).toFile(path.join(OUT, `${site}.jpg`));
  }
  console.log(site, all[site].length, 'candidates');
  fs.writeFileSync(CJ, JSON.stringify(all, null, 1));
  await sleep(2000);
}
fs.writeFileSync(path.join(OUT, 'candidates.json'), JSON.stringify(all, null, 1));
