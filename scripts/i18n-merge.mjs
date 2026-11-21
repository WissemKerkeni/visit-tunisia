// Merge the partial translation files references/i18n/<lang>/*.json (each an object: English text → translation)
// into src/locales/<lang>.json, then check it. Usage: node scripts/i18n-merge.mjs de
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const lang = process.argv[2], dir = `references/i18n/${lang}`;
const out = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  try { Object.assign(out, JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'))); } catch (e) { console.error('bad JSON in', f, e.message); process.exit(1); }
}
fs.mkdirSync('src/locales', { recursive: true });
fs.writeFileSync(`src/locales/${lang}.json`, JSON.stringify(out));
console.log('merged', Object.keys(out).length, 'texts into', `src/locales/${lang}.json`);
try { console.log(execFileSync('node', ['scripts/i18n-check.mjs', lang], { encoding: 'utf8' })); } catch (e) { console.log(e.stdout); process.exit(1); }
