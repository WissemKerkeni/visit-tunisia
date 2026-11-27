// The share image of the home and guide pages (public/og.jpg, 1200 × 630): El Jem at dusk, the logo and the name.
// Usage: node scripts/make-og.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const W = 1200, H = 630;
const logo = fs.readFileSync('public/logo.svg');
const photo = await sharp('public/photos/el-jem/p22.jpg').resize(W, H, { fit: 'cover', position: 'centre' }).modulate({ brightness: 0.82 }).toBuffer();
const shade = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b1923" stop-opacity=".92"/><stop offset=".62" stop-color="#0b1923" stop-opacity=".55"/><stop offset="1" stop-color="#0b1923" stop-opacity=".05"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="80" y="330" font-family="Georgia, 'Times New Roman', serif" font-size="92" fill="#f7f3ee">Discover Tunisia</text>
  <text x="84" y="398" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#e9d7bb">A living map, festivals, itineraries</text>
  <text x="84" y="444" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#e9d7bb">and monuments to walk in 3D</text>
  <rect x="84" y="488" width="120" height="6" rx="3" fill="#d46538"/>
</svg>`);
const mark = await sharp(logo, { density: 600 }).resize(132, 132).png().toBuffer();
await sharp(photo).composite([{ input: shade }, { input: mark, left: 80, top: 110 }]).jpeg({ quality: 84, mozjpeg: true }).toFile('public/og.jpg');
console.log('public/og.jpg', (fs.statSync('public/og.jpg').size / 1024).toFixed(0), 'KB');
