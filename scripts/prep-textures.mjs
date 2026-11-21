// Downscale source textures (references/textures-2k) into public/textures at the given size.
// Usage: node scripts/prep-textures.mjs 1024
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const size = Number(process.argv[2] || 1024);
const src = path.join('references', 'textures-2k');
const dst = path.join('public', 'textures');
for (const asset of fs.readdirSync(src)) {
  const dir = path.join(src, asset);
  if (!fs.statSync(dir).isDirectory()) { fs.copyFileSync(dir, path.join(dst, asset)); continue; }
  fs.mkdirSync(path.join(dst, asset), { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    await sharp(path.join(dir, f)).resize(size, size).jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(dst, asset, f));
  }
  console.log('ok', asset);
}
