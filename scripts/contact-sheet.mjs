// Build a numbered contact sheet of every .jpg in a folder.
// Usage: node scripts/contact-sheet.mjs <dir> <out.jpg>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [dir, out] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort();
const cols = 6, tw = 320, th = 214;
const rows = Math.ceil(files.length / cols);

const tiles = await Promise.all(files.map(async (f, i) => {
  const img = await sharp(path.join(dir, f)).resize(tw, th, { fit: 'cover' }).jpeg().toBuffer();
  const label = Buffer.from(
    `<svg width="${tw}" height="20"><rect width="140" height="20" fill="black"/>` +
    `<text x="4" y="15" font-size="14" fill="yellow" font-family="sans-serif">${i}: ${f.slice(-12)}</text></svg>`);
  return [
    { input: img, left: (i % cols) * tw, top: Math.floor(i / cols) * th },
    { input: label, left: (i % cols) * tw, top: Math.floor(i / cols) * th },
  ];
}));

await sharp({ create: { width: cols * tw, height: rows * th, channels: 3, background: '#000' } })
  .composite(tiles.flat())
  .jpeg({ quality: 82 })
  .toFile(out);
console.log(out);
