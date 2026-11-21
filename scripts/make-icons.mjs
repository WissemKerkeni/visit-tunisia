// The site's logo and icons, from one drawing: the shape of Tunisia in terracotta with the sun beside the coast,
// on cream. Writes public/logo.svg (the mark, also the favicon), public/favicon.svg and the PNG icons for
// phones and installed apps (public/icons/*). Usage: node scripts/make-icons.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const src = fs.readFileSync('src/content/tunisia-map.ts', 'utf8');
const outline = src.match(/TUNISIA_PATH = '([^Z]*Z)/)[1];   // the mainland only (no islands at this size)
const CREAM = '#fff8ec', TERRA = '#d46538', OCHRE = '#d99b43';

/** The drawing in a 64-unit box; k shrinks it around the centre (maskable icons are cropped to a circle). */
const art = (k = 1) => `<g transform="translate(32 32) scale(${k}) translate(-32 -32)">
    <circle cx="53" cy="14" r="6.5" fill="${OCHRE}"/>
    <g transform="translate(19 4.2) scale(0.0735)"><path d="${outline}" fill="${TERRA}"/></g>
  </g>`;
const svg = (rx, k) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${rx}" fill="${CREAM}"/>${art(k)}</svg>`;

fs.writeFileSync('public/logo.svg', svg(15, 1));
fs.writeFileSync('public/favicon.svg', svg(15, 1));
fs.mkdirSync('public/icons', { recursive: true });
for (const [name, size, s] of [
  ['icon-192.png', 192, svg(14, 0.92)], ['icon-512.png', 512, svg(14, 0.92)],
  ['maskable-512.png', 512, svg(0, 0.7)], ['apple-touch-icon.png', 180, svg(0, 0.82)],
]) await sharp(Buffer.from(s), { density: 600 }).resize(size, size).png().toFile(`public/icons/${name}`);
console.log('logo and icons written');
