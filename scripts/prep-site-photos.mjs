// Download the chosen Commons photo for each monument, resize it for the web and record its credit.
// Usage: node scripts/prep-site-photos.mjs <picks.json> [folder under public/photos, default 'sites']
//   picks.json: { "<site id>": { title, thumb, author, license, license_url, source }, ... }
//   (made from the candidates of scripts/find-site-photos.mjs)
// Output: public/photos/sites/<site id>.jpg and public/photos/sites/credits.json
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const picks = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const SUB = process.argv[3] || 'sites';
const OUT = `public/photos/${SUB}`;
fs.mkdirSync(OUT, { recursive: true });
sharp.cache(false);
const UA = { 'User-Agent': 'DiscoverTunisia/0.1 (heritage education site; photo credits kept)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const creditsFile = path.join(OUT, 'credits.json');
const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, 'utf8')) : {};

for (const [id, p] of Object.entries(picks)) {
  // Commons serves standard thumbnail widths; 1920 is plenty for a 1280 px web image
  const url = p.thumb.replace(/\/\d+px-/, '/1920px-');
  let buf = null;
  for (let t = 0; t < 6 && !buf; t++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) buf = Buffer.from(await r.arrayBuffer());
    else { console.warn(id, r.status); await sleep(5000 * (t + 1)); }
  }
  if (!buf) { console.warn('skip', id); continue; }
  await sharp(buf).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT, `${id}.jpg`));
  credits[id] = { file: `photos/${SUB}/${id}.jpg`, author: p.author, license: p.license, license_url: p.license_url, source: p.source, title: p.title.replace(/^File:/, '') };
  console.log(id, (fs.statSync(path.join(OUT, `${id}.jpg`)).size / 1024).toFixed(0) + ' KB', p.license);
  await sleep(1500);
}
fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2));
