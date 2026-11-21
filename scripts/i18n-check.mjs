// Check a translation file src/locales/<lang>.json against references/i18n/source.json:
// every English text translated, nothing empty, the same {placeholders}, no leftover keys.
// Usage: node scripts/i18n-check.mjs de
import fs from 'node:fs';

const lang = process.argv[2];
// French and Arabic sit beside the English in the code; their files only hold the English-only texts
const src = ['fr', 'ar'].includes(lang) ? JSON.parse(fs.readFileSync('references/i18n/t1.json', 'utf8'))
  : Object.values(JSON.parse(fs.readFileSync('references/i18n/source.json', 'utf8'))).flat();
const file = `src/locales/${lang}.json`;
let tr;
try { tr = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('cannot read', file, e.message); process.exit(1); }
const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
const missing = src.filter((s) => !(s in tr)), empty = src.filter((s) => s in tr && !String(tr[s]).trim());
const badPh = src.filter((s) => s in tr && ph(s) !== ph(tr[s]));
const extra = Object.keys(tr).filter((k) => !src.includes(k));
const same = src.filter((s) => tr[s] === s && s.split(' ').length > 3);
console.log(`${lang}: ${src.length} texts, ${missing.length} missing, ${empty.length} empty, ${badPh.length} placeholder mismatches, ${extra.length} unknown keys, ${same.length} long texts left in English`);
for (const [label, list] of [['MISSING', missing], ['EMPTY', empty], ['PLACEHOLDERS', badPh], ['UNKNOWN', extra], ['UNTRANSLATED', same]]) for (const s of list.slice(0, 15)) console.log(label, JSON.stringify(s).slice(0, 140));
process.exit(missing.length || empty.length || badPh.length ? 1 : 0);
