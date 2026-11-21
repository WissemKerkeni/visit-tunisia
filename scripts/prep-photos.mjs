// Resize selected reference photos for the web and copy their credits.
// Usage: node scripts/prep-photos.mjs el-jem _22 _15 ...   (suffixes of the Commons filenames)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [site, ...picks] = process.argv.slice(2);
const srcDir = path.join('references', site);
const outDir = path.join('public', 'photos', site);
fs.mkdirSync(outDir, { recursive: true });
const credits = JSON.parse(fs.readFileSync(path.join(srcDir, 'credits.json'), 'utf8'));
const out = {};
for (const pick of picks) {
  const entry = credits.find((c) => c.file.endsWith(pick + '.jpg'));
  if (!entry) { console.warn('not found', pick); continue; }
  const id = pick.replace(/^_/, 'p');
  await sharp(path.join(srcDir, entry.file)).resize({ width: 1280 }).jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(outDir, id + '.jpg'));
  out[id] = { file: `photos/${site}/${id}.jpg`, author: entry.author, license: entry.license,
    license_url: entry.license_url, source: entry.source };
  console.log(id, entry.file);
}
fs.writeFileSync(path.join(outDir, 'credits.json'), JSON.stringify(out, null, 2));
