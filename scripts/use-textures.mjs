// Copy chosen texture folders from a candidates dir into public/textures, prune unused ones,
// and rebuild public/textures/credits.json from the candidates' + existing credits.
// Usage: node scripts/use-textures.mjs <candDir> <keep1,keep2,...> <add1,add2,...>
import fs from 'node:fs';
import path from 'node:path';

const [cand, keepArg, addArg] = process.argv.slice(2);
const keep = new Set(keepArg.split(','));
const add = addArg.split(',');
const dst = path.join('public', 'textures');
const old = JSON.parse(fs.readFileSync(path.join(dst, 'credits.json'), 'utf8'));
const candCredits = JSON.parse(fs.readFileSync(path.join(cand, 'credits.json'), 'utf8'));

for (const d of fs.readdirSync(dst)) {
  const p = path.join(dst, d);
  if (fs.statSync(p).isDirectory() && !keep.has(d)) fs.rmSync(p, { recursive: true });
}
for (const a of add) fs.cpSync(path.join(cand, a), path.join(dst, a), { recursive: true });
const credits = [...old.filter((c) => keep.has(c.asset)), ...candCredits.filter((c) => add.includes(c.asset))];
fs.writeFileSync(path.join(dst, 'credits.json'), JSON.stringify(credits, null, 2));
console.log(credits.map((c) => c.asset).join(', '));
