// Draw the logo options side by side (references/design/logo-options.html) to choose one.
// Each option: the mark at large size, with the wordmark, and at favicon sizes (32 and 16 px).
import fs from 'node:fs';

const src = fs.readFileSync('src/content/tunisia-map.ts', 'utf8');
const outline = src.match(/TUNISIA_PATH = '([^Z]*Z)/)[1];   // the mainland only

const C = { terra: '#d46538', terraD: '#a8431f', ochre: '#d99b43', sun: '#f3c77a', sand: '#e9d7bb', cream: '#fff8ec', navy: '#0b1923', sea: '#1f5f86' };

export const MARKS = {
  // A. Bab: a horseshoe-arched gate opening on the sea at sunset
  bab: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="bab-o"><path d="M21 56V30.5a11 11 0 0 1 2.4-6.9 11 11 0 1 1 17.2 0 11 11 0 0 1 2.4 6.9V56Z"/></clipPath>
    <linearGradient id="bab-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a36b"/><stop offset="1" stop-color="#f3c77a"/></linearGradient></defs>
    <rect width="64" height="64" rx="15" fill="${C.terra}"/>
    <path d="M13 56V30a19 19 0 0 1 38 0v26Z" fill="${C.cream}"/>
    <g clip-path="url(#bab-o)"><rect x="18" y="12" width="28" height="44" fill="url(#bab-s)"/>
      <circle cx="32" cy="41" r="6.5" fill="#fff4d6"/><rect x="18" y="42" width="28" height="14" fill="${C.sea}"/>
      <path d="M20 46.5h24M22 50.5h20" stroke="#7fb3d3" stroke-width="1.4" stroke-linecap="round"/></g>
    <rect x="10" y="55" width="44" height="3.2" rx="1.2" fill="${C.cream}"/>
  </svg>`,
  // B. Pin: a map pin whose opening is a horseshoe arch with the sun inside
  pin: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4C19.3 4 10 13.6 10 26c0 15.5 18.6 31.7 20.6 33.4a2.2 2.2 0 0 0 2.8 0C35.4 57.7 54 41.5 54 26 54 13.6 44.7 4 32 4Z" fill="${C.terra}"/>
    <path d="M24 40V25.5a8.6 8.6 0 0 1 1.9-5.4 8.6 8.6 0 1 1 12.2 0 8.6 8.6 0 0 1 1.9 5.4V40Z" fill="${C.cream}"/>
    <circle cx="32" cy="30" r="4.6" fill="${C.ochre}"/><rect x="24" y="33.5" width="16" height="6.5" fill="${C.cream}"/>
    <path d="M26 35.5h12" stroke="${C.ochre}" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,
  // C. Najma: the eight-pointed star of Tunisian tiles, a small arch at its heart
  star: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="15" fill="${C.navy}"/>
    <g transform="translate(32 32)"><rect x="-17" y="-17" width="34" height="34" rx="2" fill="${C.ochre}"/>
      <rect x="-17" y="-17" width="34" height="34" rx="2" fill="${C.ochre}" transform="rotate(45)"/>
      <rect x="-12.5" y="-12.5" width="25" height="25" rx="1.5" fill="${C.terra}" transform="rotate(45)"/>
      <path d="M-6 9V-1a6 6 0 0 1 1.3-3.8 6 6 0 1 1 9.4 0A6 6 0 0 1 6-1V9Z" fill="${C.cream}"/></g>
  </svg>`,
  // D. Bled: the shape of Tunisia, with the sun over the coast
  map: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="15" fill="${C.cream}"/>
    <circle cx="53" cy="14" r="6.5" fill="${C.ochre}"/>
    <g transform="translate(19 4.2) scale(0.0735)"><path d="${outline}" fill="${C.terra}"/></g>
  </svg>`,
};

const NAMES = { bab: 'A · Bab (gate on the sea)', pin: 'B · Pin with an arch', star: 'C · Najma (tile star)', map: 'D · The shape of Tunisia' };
const svgs = Object.entries(MARKS).map(([id, s]) => `<section><h2>${NAMES[id]}</h2>
  <div class="row"><div class="big">${s}</div><div class="lock"><div class="m">${s}</div><span>Visit <i>Tunisia</i></span></div></div>
  <div class="row small"><div class="dark"><div class="m">${s}</div><span>Visit Tunisia</span></div><div class="fav">${s}${s}</div></div></section>`).join('');
fs.mkdirSync('references/design', { recursive: true });
fs.writeFileSync('references/design/logo-options.html', `<!doctype html><html><head><meta charset="utf-8"><title>Logo options</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>body{margin:0;padding:28px;background:#f4efe6;font-family:Inter,sans-serif;color:#0b1923;display:grid;grid-template-columns:1fr 1fr;gap:22px}
section{background:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 6px 24px rgba(0,0,0,.06)}h2{margin:0 0 12px;font-size:15px}
.row{display:flex;align-items:center;gap:22px}.big svg{width:120px;height:120px;display:block}.lock{display:flex;align-items:center;gap:12px}
.lock .m svg,.dark .m svg{width:48px;height:48px;display:block}.lock span,.dark span{font:600 34px 'Cormorant Garamond',serif;color:#0b1923}.lock i{color:#d46538}
.small{margin-top:14px}.dark{display:flex;align-items:center;gap:10px;background:#0b1923;padding:10px 16px;border-radius:10px}.dark .m svg{width:34px;height:34px}.dark span{font-size:24px;color:#f7f3ee}
.fav{display:flex;align-items:center;gap:12px}.fav svg:first-child{width:32px;height:32px}.fav svg:last-child{width:16px;height:16px}</style></head><body>${svgs}</body></html>`);
for (const [id, s] of Object.entries(MARKS)) fs.writeFileSync(`references/design/logo-${id}.svg`, s);
console.log('written references/design/logo-options.html');
