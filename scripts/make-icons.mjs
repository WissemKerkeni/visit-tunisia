// The app's icons (favicon, home-screen and install icons) drawn from one SVG: a Roman arch against the sun.
// Usage: node scripts/make-icons.mjs  →  public/icons/*.png, public/favicon.svg
import fs from 'node:fs';
import sharp from 'sharp';

const art = (pad) => {
  // pad: the share of the icon kept clear around the drawing (maskable icons are cropped to a circle)
  const s = 1 - pad * 2, o = pad * 512;
  return `<g transform="translate(${o} ${o}) scale(${s})">
    <circle cx="256" cy="214" r="112" fill="#f3c77a"/>
    <path d="M96 420V250q0-28 28-28h264q28 0 28 28v170h-78V300a62 62 0 0 0-124 0v120Z" fill="#fff8ec"/>
    <path d="M96 222h320v-24H96Z" fill="#fff8ec"/>
    <path d="M64 420h384v34H64Z" fill="#fff8ec"/>
  </g>`;
};
const svg = (pad, round) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d46538"/><stop offset="1" stop-color="#a8431f"/></linearGradient></defs>
  <rect width="512" height="512" rx="${round}" fill="url(#g)"/>${art(pad)}</svg>`;

fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/favicon.svg', svg(0.08, 112));
const out = [
  ['icon-192.png', 192, svg(0.08, 96)], ['icon-512.png', 512, svg(0.08, 96)],
  ['maskable-512.png', 512, svg(0.18, 0)], ['apple-touch-icon.png', 180, svg(0.1, 0)],
];
for (const [name, size, s] of out) await sharp(Buffer.from(s)).resize(size, size).png().toFile(`public/icons/${name}`);
console.log('icons written');
