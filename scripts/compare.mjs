// Side-by-side before/after sheet from snapshots/<a>-<view>.jpg and snapshots/<b>-<view>.jpg.
// Usage: node scripts/compare.mjs before after out.jpg
import sharp from 'sharp';

const [a, b, out] = process.argv.slice(2);
const views = ['aerial', 'facade', 'arena', 'seats', 'corridor'];
const W = 640, H = 360, LABEL = 28;
const label = (text) => Buffer.from(`<svg width="${W}" height="${LABEL}"><rect width="${W}" height="${LABEL}" fill="#1b130c"/><text x="12" y="19" font-size="15" fill="#f1dcbc" font-family="sans-serif">${text}</text></svg>`);
const tiles = [];
for (const [row, v] of views.entries()) {
  for (const [col, p] of [a, b].entries()) {
    const top = row * (H + LABEL);
    tiles.push({ input: label(`${p === a ? 'Before' : 'After'}: ${v}`), left: col * W, top });
    tiles.push({ input: await sharp(`snapshots/${p}-${v}.jpg`).resize(W, H).toBuffer(), left: col * W, top: top + LABEL });
  }
}
await sharp({ create: { width: 2 * W, height: views.length * (H + LABEL), channels: 3, background: '#000' } })
  .composite(tiles).jpeg({ quality: 85 }).toFile(out);
console.log(out);
