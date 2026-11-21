// Download Poly Haven textures (CC0) at 1k into public/textures/<id>/ (diff.jpg, nor.jpg in the OpenGL convention
// three.js uses, arm.jpg = ambient occlusion / roughness / metal) and add them to public/textures/credits.json.
// Usage: node scripts/get-polyhaven.mjs painted_plaster_wall clay_plaster …
import fs from 'node:fs';
import path from 'node:path';

const UA = { 'User-Agent': 'VisitTunisia/0.1 (texture credits kept)' };
const dst = path.join('public', 'textures');
const creditsFile = path.join(dst, 'credits.json');
const credits = JSON.parse(fs.readFileSync(creditsFile, 'utf8'));

for (const id of process.argv.slice(2)) {
  const [info, files] = await Promise.all([
    fetch(`https://api.polyhaven.com/info/${id}`, { headers: UA }).then((r) => r.json()),
    fetch(`https://api.polyhaven.com/files/${id}`, { headers: UA }).then((r) => r.json()),
  ]);
  const pick = { 'diff.jpg': files.Diffuse?.['1k']?.jpg?.url, 'nor.jpg': files.nor_gl?.['1k']?.jpg?.url, 'arm.jpg': files.arm?.['1k']?.jpg?.url };
  if (Object.values(pick).some((u) => !u)) { console.warn('skip', id, 'missing maps'); continue; }
  fs.mkdirSync(path.join(dst, id), { recursive: true });
  for (const [name, url] of Object.entries(pick)) {
    const buf = Buffer.from(await (await fetch(url, { headers: UA })).arrayBuffer());
    fs.writeFileSync(path.join(dst, id, name), buf);
  }
  const entry = { asset: id, name: info.name, authors: Object.keys(info.authors ?? {}), license: 'CC0', source: `https://polyhaven.com/a/${id}` };
  const i = credits.findIndex((c) => c.asset === id);
  if (i >= 0) credits[i] = entry; else credits.push(entry);
  console.log('ok', id, entry.authors.join(', '));
}
fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2));
