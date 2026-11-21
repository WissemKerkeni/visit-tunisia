// For each place of the home map: its coordinates and lead photo from Wikipedia, with the photo's
// author and licence from Wikimedia Commons (free licences only). Writes references/places/picks.json
// (the format scripts/prep-site-photos.mjs takes), coords.json and a contact sheet to check by eye.
// Usage: node scripts/find-place-photos.mjs            (all places in references/places/wiki.json)
//        node scripts/find-place-photos.mjs <id> "File:Name.jpg"   (set one place's photo by hand)
import fs from 'node:fs';
import sharp from 'sharp';

const DIR = 'references/places';
const UA = { 'User-Agent': 'VisitTunisia/0.1 (travel education site; photo credits kept)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FREE = /^(CC0|Public domain|PD|CC BY(-SA)? [1-4]\.0)/i;
const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
async function api(host, params) {
  const u = new URL(`https://${host}/w/api.php`);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: 2, ...params })) u.searchParams.set(k, v);
  for (let t = 0; t < 6; t++) {
    try {
      const r = await fetch(u, { headers: UA });
      if (r.status === 429) { await sleep(6000 * (t + 1)); continue; }
      return await r.json();
    } catch { await sleep(4000 * (t + 1)); }
  }
  throw new Error('rate limited');
}
async function fileInfo(title) {
  const info = await api('commons.wikimedia.org', { action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: 480 });
  const p = info.query?.pages?.[0], ii = p?.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata || {}, license = strip(m.LicenseShortName?.value);
  if (!FREE.test(license)) return null;
  return { title: p.title, width: ii.width, height: ii.height, thumb: ii.thumburl, url: ii.url, author: strip(m.Artist?.value) || 'unknown', license, license_url: m.LicenseUrl?.value || '', source: ii.descriptionurl, desc: strip(m.ImageDescription?.value).slice(0, 160) };
}
const wiki = JSON.parse(fs.readFileSync(`${DIR}/wiki.json`, 'utf8'));
const picksF = `${DIR}/picks.json`, coordsF = `${DIR}/coords.json`;
const picks = fs.existsSync(picksF) ? JSON.parse(fs.readFileSync(picksF, 'utf8')) : {};
const coords = fs.existsSync(coordsF) ? JSON.parse(fs.readFileSync(coordsF, 'utf8')) : {};
const [, , oneId, oneFile] = process.argv;
if (oneId && oneFile) {
  const c = await fileInfo(oneFile);
  if (!c) throw new Error('not found or not free: ' + oneFile);
  picks[oneId] = c; console.log(oneId, c.title, c.license);
} else for (const [id, w] of Object.entries(wiki)) {
  if (picks[id] && coords[id]) continue;
  const [lang, title] = [w.wiki.slice(0, 2), w.wiki.slice(3)];
  const r = await api(`${lang}.wikipedia.org`, { action: 'query', titles: title, redirects: 1, prop: 'pageimages|coordinates', piprop: 'name', pilicense: 'free' });
  const p = r.query?.pages?.[0];
  if (p?.coordinates?.[0]) coords[id] = [+p.coordinates[0].lat.toFixed(4), +p.coordinates[0].lon.toFixed(4)];
  let c = p?.pageimage ? await fileInfo('File:' + p.pageimage) : null;
  if (c && (c.width < c.height * 0.9 || Math.max(c.width, c.height) < 1200 || /map|locator|flag|logo|coat|\.svg/i.test(c.title))) c = null;
  if (!c) {
    // fall back to a Commons search
    const s = await api('commons.wikimedia.org', { action: 'query', list: 'search', srnamespace: 6, srlimit: 12, srsearch: `${w.q ?? title + ' Tunisia'} filetype:bitmap` });
    for (const hit of s.query?.search ?? []) {
      const x = await fileInfo(hit.title);
      if (x && x.width >= x.height * 0.9 && Math.max(x.width, x.height) >= 1600) { c = x; break; }
      await sleep(200);
    }
  }
  if (c) picks[id] = c;
  console.log(id, coords[id] ?? 'no coords', c ? c.title : 'NO PHOTO');
  fs.writeFileSync(picksF, JSON.stringify(picks, null, 1)); fs.writeFileSync(coordsF, JSON.stringify(coords));
  await sleep(500);
}
fs.writeFileSync(picksF, JSON.stringify(picks, null, 1)); fs.writeFileSync(coordsF, JSON.stringify(coords));
// contact sheet
const ids = Object.keys(wiki).filter((id) => picks[id]), tw = 300, th = 200, cols = 6, tiles = [];
for (let i = 0; i < ids.length; i++) {
  try {
    const r = await fetch(picks[ids[i]].thumb, { headers: UA });
    const img = await sharp(Buffer.from(await r.arrayBuffer())).resize(tw, th, { fit: 'cover' }).jpeg().toBuffer();
    const label = Buffer.from(`<svg width="${tw}" height="22"><rect width="${tw}" height="22" fill="black" opacity=".7"/><text x="5" y="16" font-size="15" fill="yellow" font-family="sans-serif">${ids[i]}</text></svg>`);
    tiles.push({ input: img, left: (i % cols) * tw, top: Math.floor(i / cols) * th }, { input: label, left: (i % cols) * tw, top: Math.floor(i / cols) * th });
  } catch (e) { console.warn(ids[i], e.message); }
  await sleep(150);
}
await sharp({ create: { width: cols * tw, height: Math.ceil(ids.length / cols) * th, channels: 3, background: '#111' } }).composite(tiles).jpeg({ quality: 72 }).toFile(`${DIR}/sheet.jpg`);
console.log('sheet', ids.length);
