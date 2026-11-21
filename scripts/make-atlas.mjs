// Base layers of the home map, in the projection of src/content/tunisia-map.ts:
//  - public/atlas/relief.webp: Tunisia's real colours (NASA Blue Marble, public domain, via NASA GIBS)
//    with hill shading from AWS Terrain Tiles (Terrarium, open data), for the country frame;
//  - public/atlas/around.jpg: the same imagery for the neighbouring land (drawn dimmed);
//  - src/content/atlas-geo.ts: the big lakes and salt flats and the Medjerda river
//    (© OpenStreetMap contributors, ODbL), as SVG paths.
// The OSM extracts are downloaded once with the Overpass queries noted below (references/atlas/*.json).
// Usage: node scripts/make-atlas.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const src = fs.readFileSync('src/content/tunisia-map.ts', 'utf8');
const MAP_W = +src.match(/MAP_W = (\d+)/)[1], MAP_H = +src.match(/MAP_H = (\d+)/)[1];
const [, LON0, KX, S, LAT1] = src.match(/\(lon - ([\d.]+)\) \* ([\d.]+) \* ([\d.]+), \(([\d.]+) - lat\)/).map(Number);
const project = (lat, lon) => [(lon - LON0) * KX * S, (LAT1 - lat) * S];
const unproject = (x, y) => [LAT1 - y / S, LON0 + x / (KX * S)];
const UA = { 'User-Agent': 'visit-tunisia-dev/0.1' };
const DIR = 'references/atlas';
fs.mkdirSync(DIR, { recursive: true });
fs.mkdirSync('public/atlas', { recursive: true });

async function cached(file, url) {
  const f = path.join(DIR, file);
  if (!fs.existsSync(f)) {
    const r = await fetch(url, { headers: UA });
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  return f;
}
const wms = (lat0, lon0, lat1, lon1, w, h) =>
  `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=BlueMarble_ShadedRelief_Bathymetry&STYLES=&FORMAT=image/jpeg&SRS=EPSG:4326&BBOX=${lon0},${lat0},${lon1},${lat1}&WIDTH=${w}&HEIGHT=${h}`;

// ---------- relief: Blue Marble colours × hill shading ----------
{
  const W = 1600, H = Math.round((W * MAP_H) / MAP_W);
  const [latN, lonW] = unproject(0, 0), [latS, lonE] = unproject(MAP_W, MAP_H);
  const bm = await cached('bluemarble-tunisia.jpg', wms(latS, lonW, latN, lonE, 1200, Math.round((1200 * MAP_H) / MAP_W)));
  const colour = await sharp(bm).resize(W, H, { kernel: 'cubic' }).removeAlpha().raw().toBuffer();

  // elevation from Terrarium tiles (zoom 9, about 250 m per pixel here)
  const Z = 9, n = 2 ** Z;
  const tileXY = (lat, lon) => [((lon + 180) / 360) * n, ((1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2) * n];
  const [tx0, ty0] = tileXY(latN + 0.05, lonW - 0.05).map(Math.floor), [tx1, ty1] = tileXY(latS - 0.05, lonE + 0.05).map(Math.floor);
  const tiles = new Map();
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const f = await cached(`terrain-${Z}-${tx}-${ty}.png`, `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`);
    const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    tiles.set(`${tx},${ty}`, { data, w: info.width });
  }
  const px = (ix, iy) => {
    const t = tiles.get(`${Math.floor(ix / 256)},${Math.floor(iy / 256)}`);
    if (!t) return 0;
    const i = ((iy & 255) * t.w + (ix & 255)) * 3;
    return t.data[i] * 256 + t.data[i + 1] + t.data[i + 2] / 256 - 32768;
  };
  const elev = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [lat, lon] = unproject(((x + 0.5) * MAP_W) / W, ((y + 0.5) * MAP_H) / H);
    const [fx, fy] = tileXY(lat, lon), gx = fx * 256 - 0.5, gy = fy * 256 - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), ax = gx - x0, ay = gy - y0;
    elev[y * W + x] = px(x0, y0) * (1 - ax) * (1 - ay) + px(x0 + 1, y0) * ax * (1 - ay) + px(x0, y0 + 1) * (1 - ax) * ay + px(x0 + 1, y0 + 1) * ax * ay;
  }
  // hill shading (light from the north-west), blended into the colours; a little more saturation and warmth
  const out = Buffer.alloc(W * H * 3);
  const m = (MAP_W / W / S) * 111200;                      // metres per output pixel (north-south)
  const e = (x, y) => elev[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dzdx = (e(x + 1, y) - e(x - 1, y)) / (2 * m), dzdy = (e(x, y + 1) - e(x, y - 1)) / (2 * m);
    const k = 9, nx = -dzdx * k, ny = -dzdy * k, nl = Math.hypot(nx, ny, 1);
    const shade = Math.max(0, (nx * -0.55 + ny * -0.55 + 0.63) / nl);       // 0.63 on flat ground
    const f = 0.62 + 0.6 * shade;
    const i = (y * W + x) * 3;
    let r = colour[i], g = colour[i + 1], b = colour[i + 2];
    const grey = 0.3 * r + 0.59 * g + 0.11 * b, sat = 1.28;
    r = grey + (r - grey) * sat; g = grey + (g - grey) * sat; b = grey + (b - grey) * sat;
    out[i] = Math.max(0, Math.min(255, r * f * 1.03)); out[i + 1] = Math.max(0, Math.min(255, g * f)); out[i + 2] = Math.max(0, Math.min(255, b * f * 0.96));
  }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 80 }).toFile('public/atlas/relief.webp');
  console.log('relief', W, 'x', H, (fs.statSync('public/atlas/relief.webp').size / 1024).toFixed(0), 'KB, tiles', tiles.size);
}

// ---------- the land around (dimmed on the map) ----------
const AROUND = { lon0: 2.5, lon1: 17, lat0: 29.5, lat1: 39.5 };
{
  const w = 1300, h = Math.round((w * (AROUND.lat1 - AROUND.lat0)) / ((AROUND.lon1 - AROUND.lon0) * KX));
  const f = await cached('bluemarble-around.jpg', wms(AROUND.lat0, AROUND.lon0, AROUND.lat1, AROUND.lon1, w, h));
  await sharp(f).jpeg({ quality: 72 }).toFile('public/atlas/around.jpg');
  console.log('around', w, 'x', h, (fs.statSync('public/atlas/around.jpg').size / 1024).toFixed(0), 'KB');
}

// ---------- lakes, salt flats, the Medjerda ----------
// references/atlas/osm-lakes.json: Overpass `(relation(3969167);relation(2895174);relation(10224416);relation(8031768);
//   relation(2307563);relation(1431499);way(284826905);way(551247241);way(551346335);way(103534038);way(31831896);
//   way(99327451);way(49730150);way(31832215););out geom;`
// references/atlas/osm-medjerda.json: `way["waterway"="river"]["name:fr"~"Medjerda"](35.9,7.9,37.3,10.4);out geom;`
function simplify(p, tol) {
  if (p.length < 4) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const stack = [[0, p.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1, bi = -1;
    const [ax, ay] = p[a], [bx, by] = p[b], L = Math.hypot(bx - ax, by - ay) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (ay - p[i][1]) - (ax - p[i][0]) * (by - ay)) / L; if (d > best) { best = d; bi = i; } }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
/** Join ways end to end into lines (closed ones are rings). */
function chain(ways) {
  const left = ways.map((w) => w.slice()), out = [];
  const same = (a, b) => Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lon - b.lon) < 1e-7;
  while (left.length) {
    let line = left.shift();
    for (let grew = true; grew;) {
      grew = false;
      for (let i = 0; i < left.length; i++) {
        const w = left[i], a = line[0], b = line[line.length - 1];
        if (same(b, w[0])) line = line.concat(w.slice(1));
        else if (same(b, w[w.length - 1])) line = line.concat(w.slice(0, -1).reverse());
        else if (same(a, w[w.length - 1])) line = w.slice(0, -1).concat(line);
        else if (same(a, w[0])) line = w.slice(1).reverse().concat(line);
        else continue;
        left.splice(i, 1); grew = true; break;
      }
    }
    out.push(line);
  }
  return out;
}
const toXY = (line) => line.map((q) => project(q.lat, q.lon));
/** A closed ring is simplified in two halves (its two ends are the same point). */
const simplifyRing = (p, tol) => {
  let far = 0, fd = -1;
  p.forEach((q, i) => { const d = Math.hypot(q[0] - p[0][0], q[1] - p[0][1]); if (d > fd) { fd = d; far = i; } });
  return simplify(p.slice(0, far + 1), tol).concat(simplify(p.slice(far), tol).slice(1, -1));
};
const dOf = (lines, close, tol) => lines.map((l) => (close ? simplifyRing(toXY(l), tol) : simplify(toXY(l), tol))).filter((l) => l.length > (close ? 2 : 1))
  .map((l) => 'M' + l.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + (close ? 'Z' : '')).join('');

const NAMES = {
  3969167: ['djerid', 'salt', { en: 'Chott el Djerid', fr: 'Chott el-Jérid', ar: 'شط الجريد' }],
  284826905: ['fejaj', 'salt', { en: 'Chott el Fejaj', fr: 'Chott el-Fejaj', ar: 'شط الفجاج' }],
  551247241: ['gharsa', 'salt', { en: 'Chott el Gharsa', fr: 'Chott el-Gharsa', ar: 'شط الغرسة' }],
  551346335: ['hamma', 'salt', null],
  2895174: ['sidi-el-hani', 'salt', { en: 'Sebkha of Sidi El Hani', fr: 'Sebkha de Sidi El Hani', ar: 'سبخة سيدي الهاني' }],
  103534038: ['melah', 'salt', null],
  31831896: ['noual', 'salt', null],
  99327451: ['kelbia', 'salt', { en: 'Sebkha Kelbia', fr: 'Sebkha Kelbia', ar: 'سبخة الكلبية' }],
  31832215: ['moknine', 'salt', null],
  49730150: ['ariana', 'salt', null],
  1431499: ['sijoumi', 'salt', null],
  10224416: ['ichkeul', 'water', { en: 'Lake Ichkeul', fr: 'Lac Ichkeul', ar: 'بحيرة إشكل' }],
  8031768: ['tunis', 'water', { en: 'Lake of Tunis', fr: 'Lac de Tunis', ar: 'بحيرة تونس' }],
  2307563: ['sidi-salem', 'water', null],
};
const lakes = [];
for (const el of JSON.parse(fs.readFileSync(path.join(DIR, 'osm-lakes.json'), 'utf8')).elements) {
  const meta = NAMES[el.id]; if (!meta) continue;
  const ways = el.type === 'way' ? [el.geometry] : el.members.filter((mm) => mm.type === 'way' && mm.role !== 'inner' && mm.geometry).map((mm) => mm.geometry);
  const rings = chain(ways).filter((l) => l.length > 3);
  const d = dOf(rings, true, 0.18);
  if (!d) continue;
  let sx = 0, sy = 0, cnt = 0;
  for (const r of rings) for (const q of r) { const [x, y] = project(q.lat, q.lon); sx += x; sy += y; cnt++; }
  lakes.push({ id: meta[0], kind: meta[1], name: meta[2], c: [+(sx / cnt).toFixed(1), +(sy / cnt).toFixed(1)], d });
}
const river = dOf(chain(JSON.parse(fs.readFileSync(path.join(DIR, 'osm-medjerda.json'), 'utf8')).elements.map((e) => e.geometry)), false, 0.25);

const [ax0, ay0] = project(AROUND.lat1, AROUND.lon0), [ax1, ay1] = project(AROUND.lat0, AROUND.lon1);
fs.writeFileSync('src/content/atlas-geo.ts', `// Generated by scripts/make-atlas.mjs. Lakes and river: © OpenStreetMap contributors (ODbL).
// Imagery: NASA Blue Marble (public domain) via NASA GIBS; hill shading from AWS Terrain Tiles.
import type { T3 } from '../i18n';

/** Tunisia's relief image, covering the map frame (0,0)–(MAP_W,MAP_H). */
export const RELIEF = 'atlas/relief.webp';
/** Imagery of the land around, and where it sits in map units. */
export const AROUND = { src: 'atlas/around.jpg', x: ${ax0.toFixed(1)}, y: ${ay0.toFixed(1)}, w: ${(ax1 - ax0).toFixed(1)}, h: ${(ay1 - ay0).toFixed(1)} };
export interface Lake { id: string; kind: 'salt' | 'water'; name: T3 | null; c: [number, number]; d: string }
export const LAKES: Lake[] = ${JSON.stringify(lakes)};
/** The Medjerda, Tunisia's only river that flows all year. */
export const MEDJERDA = '${river}';
`);
console.log('lakes', lakes.map((l) => `${l.id} ${l.d.length}`).join(', '), '| river', river.length);
