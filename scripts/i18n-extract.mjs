// Collect every English text of the site (the `en` of each { en, fr, ar } in src/**/*.ts, and of the generated
// JSON in src/content/climate.ts) into references/i18n/source.json (and the English-only ones, which French and
// Arabic also need, into references/i18n/t1.json), grouped by file, for the translations in
// src/locales/<lang>.json (English text → translation). Usage: node scripts/i18n-extract.mjs
import fs from 'node:fs';
import path from 'node:path';

const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.ts')) files.push(p); } };
walk('src');
const single = /\ben: '((?:[^'\\]|\\.)*)'/g, json = /"en":"((?:[^"\\]|\\.)*)"/g;
const unq = (s) => s.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
const groups = {}, seen = new Set(), t1 = new Set();
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8'), list = [];
  for (const re of [single, json]) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(s))) {
      const v = re === json ? JSON.parse(`"${m[1]}"`) : unq(m[1]);
      // English only (no French and Arabic beside it): French and Arabic come from src/locales too
      if (re === single && !/^\s*,\s*fr:/.test(s.slice(m.index + m[0].length))) t1.add(v);
      if (!seen.has(v)) { seen.add(v); list.push(v); }
    }
  }
  if (list.length) groups[f.replace(/\\/g, '/')] = list;
}
fs.mkdirSync('references/i18n', { recursive: true });
fs.writeFileSync('references/i18n/source.json', JSON.stringify(groups, null, 1));
fs.writeFileSync('references/i18n/t1.json', JSON.stringify([...t1], null, 1));
let n = 0, w = 0;
for (const [f, l] of Object.entries(groups)) { n += l.length; const ww = l.reduce((a, x) => a + x.split(/\s+/).length, 0); w += ww; console.log(f, l.length, ww); }
console.log('total', n, 'strings', w, 'words');
