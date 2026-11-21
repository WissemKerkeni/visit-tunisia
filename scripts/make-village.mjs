// Real data for Sidi Bou Said: terrain heights + OpenStreetMap features, in scene coordinates.
//  - Terrain: AWS Terrain Tiles (Terrarium PNG, open data: SRTM / ETOPO1 / others, https://registry.opendata.aws/terrain-tiles/)
//  - Map: OpenStreetMap (© OpenStreetMap contributors, ODbL), downloaded to references/sidi-bou-said/osm/sbs-osm.json:
//      curl -A "walk-tunisia-dev" "https://api.openstreetmap.org/api/0.6/map.json?bbox=10.3290,36.8620,10.3560,36.8800" -o references/sidi-bou-said/osm/sbs-osm.json
// Scene frame: origin = Café des Nattes (top of the main stairs), x = east, z = south, y = metres above sea level.
// Output: public/data/sidi-bou-said/terrain.bin (Int16 decimetres, row-major, north row first)
//         src/content/sidi-bou-said-town.json
//         references/sidi-bou-said/osm/preview.png
// Usage: node scripts/make-village.mjs [site]   (sidi-bou-said | carthage | dougga | kairouan | sousse | sbeitla | djerba | matmata | ksar-ouled-soltane | bulla-regia | tunis-medina)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SITES = {
  'sidi-bou-said': { origin: { lat: 36.87114, lon: 10.34830 } /* Café des Nattes */, half: 720, osm: 'references/sidi-bou-said/osm/sbs-osm.json' },
  // between Byrsa Hill and the Antonine Baths
  carthage: { origin: { lat: 36.8550, lon: 10.3290 }, half: 840, osm: 'references/carthage/osm/carthage-osm.json' },
  // centred on the Capitol
  dougga: { origin: { lat: 36.4228, lon: 9.2182 }, half: 580, osm: 'references/dougga/osm/dougga-osm.json' },
  // between the Great Mosque, the medina and the Aghlabid basins
  kairouan: { origin: { lat: 35.6810, lon: 10.0985 }, half: 880, osm: 'references/kairouan/osm/kairouan-osm.json' },
  // the centre of the walled medina, between the Ribat and the Kasbah
  sousse: { origin: { lat: 35.8252, lon: 10.6375 }, half: 700, osm: 'references/sousse/osm/sousse-osm.json' },
  // by the forum of Sufetula, between the amphitheatre and the Arch of the Tetrarchy
  sbeitla: { origin: { lat: 35.2400, lon: 9.1195 }, half: 620, osm: 'references/sbeitla/osm/sbeitla-osm.json' },
  // Djerba: between the village of Erriadh (Hara Sghira) and the Ghriba synagogue
  djerba: { origin: { lat: 33.8175, lon: 10.8565 }, half: 650, osm: 'references/djerba/osm/djerba-osm.json' },
  // Matmata el Qadima: the pit houses south of the village, between Hotel Sidi Driss and Hotel Matmata
  matmata: { origin: { lat: 33.5425, lon: 9.9705 }, half: 650, osm: 'references/matmata/osm/matmata-osm.json' },
  // Ksar Ouled Soltane: centred on the granary's courtyards, on its hilltop south of Tataouine
  'ksar-ouled-soltane': { origin: { lat: 32.78843, lon: 10.51483 }, half: 600, osm: 'references/ksar-ouled-soltane/osm/kos-osm.json' },
  // Bulla Regia: between the underground houses (Hunt, Amphitrite, Fishing), the forum and the theatre
  'bulla-regia': { origin: { lat: 36.55884, lon: 8.75482 }, half: 560, osm: 'references/bulla-regia/osm/bulla-osm.json' },
  // Medina of Tunis: between the Kasbah, the Zitouna Mosque, Bab Bhar and Bab Souika
  //   curl -A "walk-tunisia-dev" "https://api.openstreetmap.org/api/0.6/map.json?bbox=10.1610,36.7905,10.1815,36.8065" -o references/tunis-medina/osm/tunis-osm.json
  'tunis-medina': { origin: { lat: 36.7985, lon: 10.1712 }, half: 820, osm: 'references/tunis-medina/osm/tunis-osm.json' },
};
const SITE = process.argv[2] || 'sidi-bou-said';
const cfg = SITES[SITE];
if (!cfg) throw new Error('unknown site ' + SITE);
const ORIGIN = cfg.origin;
const HALF = cfg.half;   // terrain covers ±HALF metres
const CELL = 4;          // terrain grid spacing (m)
const RADIUS = HALF + 40; // keep map features within this distance
const Z = 15;            // Terrarium zoom (~3.8 m/pixel here; source data is ~30 m SRTM on land)
const SRC = cfg.osm;
const TILE_DIR = `references/${SITE}/terrain-tiles`;
const OUT_BIN = `public/data/${SITE}/terrain.bin`;
const OUT_JSON = `src/content/${SITE}-town.json`;
const PREVIEW = `references/${SITE}/osm/preview.png`;

const R = 6378137;
const kx = Math.cos((ORIGIN.lat * Math.PI) / 180) * R * Math.PI / 180, ky = R * Math.PI / 180;
const toScene = (lat, lon) => [(lon - ORIGIN.lon) * kx, -(lat - ORIGIN.lat) * ky];
const toLatLon = (x, z) => [ORIGIN.lat - z / ky, ORIGIN.lon + x / kx];

// ---------- terrain ----------
const tileXY = (lat, lon) => {
  const n = 2 ** Z, x = ((lon + 180) / 360) * n;
  const s = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return [x, ((1 - s / Math.PI) / 2) * n];
};
fs.mkdirSync(TILE_DIR, { recursive: true });
const [nwLat, nwLon] = toLatLon(-HALF, -HALF), [seLat, seLon] = toLatLon(HALF, HALF);
const [tx0, ty0] = tileXY(nwLat, nwLon).map(Math.floor), [tx1, ty1] = tileXY(seLat, seLon).map(Math.floor);
const tiles = new Map();
for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
  const f = path.join(TILE_DIR, `${Z}-${tx}-${ty}.png`);
  if (!fs.existsSync(f)) {
    const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`, { headers: { 'User-Agent': 'walk-tunisia-dev' } });
    if (!r.ok) throw new Error(`tile ${tx},${ty}: ${r.status}`);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  tiles.set(`${tx},${ty}`, { data, w: info.width });
}
const heightAt = (lat, lon) => {
  const [fx, fy] = tileXY(lat, lon);
  const px = (fx % 1) * 256 - 0.5, py = (fy % 1) * 256 - 0.5;
  const sample = (ix, iy) => {
    let tx = Math.floor(fx), ty = Math.floor(fy);
    if (ix < 0) { tx--; ix += 256; } if (ix > 255) { tx++; ix -= 256; }
    if (iy < 0) { ty--; iy += 256; } if (iy > 255) { ty++; iy -= 256; }
    const t = tiles.get(`${tx},${ty}`);
    if (!t) return 0;
    const i = (iy * t.w + ix) * 3;
    return t.data[i] * 256 + t.data[i + 1] + t.data[i + 2] / 256 - 32768;
  };
  const x0 = Math.floor(px), y0 = Math.floor(py), ax = px - x0, ay = py - y0;
  return sample(x0, y0) * (1 - ax) * (1 - ay) + sample(x0 + 1, y0) * ax * (1 - ay) + sample(x0, y0 + 1) * (1 - ax) * ay + sample(x0 + 1, y0 + 1) * ax * ay;
};
const N = Math.round((2 * HALF) / CELL) + 1;
const H = new Int16Array(N * N);
let hmin = Infinity, hmax = -Infinity;
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const x = -HALF + i * CELL, z = -HALF + j * CELL;
  const h = heightAt(...toLatLon(x, z));
  H[j * N + i] = Math.round(h * 10);
  hmin = Math.min(hmin, h); hmax = Math.max(hmax, h);
}
console.log(`terrain ${N}x${N} @${CELL} m, ${hmin.toFixed(1)}..${hmax.toFixed(1)} m, tiles ${tiles.size}`);

// ---------- map features ----------
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const nodes = new Map(), ways = new Map();
for (const e of data.elements) { if (e.type === 'node') nodes.set(e.id, e); else if (e.type === 'way') ways.set(e.id, e); }
const r1 = (v) => Math.round(v * 10) / 10;
const pts = (w) => w.nodes.map((i) => nodes.get(i)).filter(Boolean).map((n) => toScene(n.lat, n.lon));
const near = (p) => p.some(([x, z]) => Math.abs(x) < RADIUS && Math.abs(z) < RADIUS);
function simplify(p, tol) {
  if (p.length < 4) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const stack = [[0, p.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1, bi = -1;
    const [ax, az] = p[a], [bx, bz] = p[b];
    const L = Math.hypot(bx - ax, bz - az) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (az - p[i][1]) - (ax - p[i][0]) * (bz - az)) / L; if (d > best) { best = d; bi = i; } }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
const area = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const [x1, z1] = p[i], [x2, z2] = p[(i + 1) % p.length]; s += x1 * z2 - x2 * z1; } return s / 2; };
const ring = (p) => {
  let q = p.slice();
  if (q.length > 2 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop();
  q = simplify(q, 0.2).map(([x, z]) => [r1(x), r1(z)]);
  return area(q) < 0 ? q.reverse() : q;
};
const line = (p) => simplify(p, 0.25).map(([x, z]) => [r1(x), r1(z)]);

const out = { source: '© OpenStreetMap contributors (ODbL); terrain: AWS Terrain Tiles (SRTM and others), downloaded ' + new Date().toISOString().slice(0, 10),
  origin: ORIGIN, terrain: { half: HALF, cell: CELL, n: N, file: `data/${SITE}/terrain.bin` },
  buildings: [], roads: [], areas: [], piers: [], coast: [], pois: [] };
const ROAD_W = { trunk: 12, primary: 11, secondary: 9, tertiary: 7.5, tertiary_link: 6, unclassified: 6, residential: 5.5, service: 4, pedestrian: 4, footway: 2.2, path: 1.8, steps: 3, track: 3, living_street: 4.5 };
const areaKind = (t) =>
  t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'village_green' || t.landuse === 'grass' || t.leisure === 'common' || t.landuse === 'greenfield' ? 'garden'
  : t.natural === 'wood' || t.landuse === 'forest' ? 'wood'
  : t.landuse === 'cemetery' ? 'cemetery'
  : t.amenity === 'parking' ? 'parking'
  : t.leisure === 'pitch' ? 'pitch'
  : t.leisure === 'swimming_pool' ? 'pool'
  : t.natural === 'beach' ? 'beach'
  : t.natural === 'water' ? 'water'
  : t.highway === 'pedestrian' && t.area === 'yes' ? 'pedestrian'
  : t.amenity === 'cafe' && !t.building ? 'terrace' // open-air café (e.g. the Café des Délices terraces)
  : t.historic === 'archaeological_site' ? 'archaeology'
  : t.historic === 'ruins' && !t.building ? 'ruins'
  : null;
const skip = new Set();
for (const rel of data.elements.filter((e) => e.type === 'relation')) for (const m of rel.members || []) if (m.type === 'way') skip.add(m.ref);

function addBuilding(p, t, id, inner = []) {
  if (p.length < 3 || !near(p)) return;
  const q = ring(p);
  if (q.length < 3 || Math.abs(area(q)) < 5) return;
  const b = { id, p: q };
  if (inner.length) b.holes = inner.map((h) => ring(h).reverse()); // courtyards of a multipolygon building (clockwise)
  const k = t.building === 'mosque' || t.amenity === 'place_of_worship' ? 'mosque'
    : t.man_made === 'lighthouse' ? 'lighthouse'
    : t.building === 'cathedral' ? 'cathedral'
    : t.building === 'ruins' || (t.historic === 'ruins' && t.building) ? 'ruins'
    : t.historic === 'monument' || /ennejma/i.test(t.name || '') ? 'palace'
    : t.amenity === 'cafe' || t.amenity === 'restaurant' ? 'cafe'
    : t.building === 'roof' ? 'roof' : null;
  if (k) b.k = k;
  const lv = parseFloat(t['building:levels']); if (lv > 0) b.lv = lv;
  const name = t['name:fr'] || t['name:en'] || t.name; if (name) b.name = name;
  out.buildings.push(b);
}
for (const rel of data.elements.filter((e) => e.type === 'relation' && e.tags)) {
  const t = rel.tags;
  const outers = (rel.members || []).filter((m) => m.type === 'way' && m.role === 'outer').map((m) => ways.get(m.ref)).filter(Boolean);
  const inners = (rel.members || []).filter((m) => m.type === 'way' && m.role === 'inner').map((m) => ways.get(m.ref)).filter(Boolean).map(pts);
  if (t.building || (t.amenity === 'place_of_worship' && t.historic)) for (const w of outers) addBuilding(pts(w), t, rel.id, outers.length === 1 ? inners : []);
  const k = areaKind(t);
  if (k) for (const w of outers) { const p = pts(w); if (near(p)) out.areas.push(Object.assign({ k, p: ring(p) }, (t['name:fr'] || t.name) ? { name: t['name:fr'] || t.name } : {})); }
}
for (const w of ways.values()) {
  const t = w.tags; if (!t) continue;
  const p = pts(w); if (p.length < 2 || !near(p)) continue;
  // Matmata: the courtyard pits of troglodyte houses are mapped as closed natural=cliff rings
  if (t.natural === 'cliff' && w.nodes[0] === w.nodes[w.nodes.length - 1]) { (out.pits ??= []).push(ring(p)); continue; }
  if (t.building && !skip.has(w.id)) { addBuilding(p, t, w.id); continue; }
  if (t.highway && ROAD_W[t.highway] && t.area !== 'yes') {
    const road = { k: t.highway, w: ROAD_W[t.highway], p: line(p) };
    if (t.surface) road.s = t.surface;
    const name = t['name:fr'] || t.name; if (name) road.name = name;
    out.roads.push(road); continue;
  }
  if (t.man_made === 'pier' || t.man_made === 'breakwater' || t.man_made === 'groyne') {
    const closed = w.nodes[0] === w.nodes[w.nodes.length - 1];
    out.piers.push(closed ? { p: ring(p), area: true } : { p: line(p), w: t.man_made === 'breakwater' ? 8 : 4 }); continue;
  }
  if (t.natural === 'coastline') { out.coast.push(line(p)); continue; }
  // the UNESCO World Heritage outline of a historic town (e.g. the Medina of Tunis): its old core
  if (t['heritage:operator'] === 'whc' && w.nodes[0] === w.nodes[w.nodes.length - 1]) { (out.heritage ??= []).push(ring(p)); continue; }
  if (t.barrier === 'city_wall') { (out.walls ??= []).push(line(p)); continue; }
  const k = areaKind(t);
  if (k && !skip.has(w.id)) out.areas.push(Object.assign({ k, p: ring(p) }, (t['name:fr'] || t.name) ? { name: t['name:fr'] || t.name } : {}));
}
for (const n of nodes.values()) {
  const t = n.tags; if (!t) continue;
  const k = t.historic === 'city_gate' ? 'gate' : t.tourism === 'hotel' || t.tourism === 'museum' || t.tourism === 'guest_house' ? 'tourism' : t.natural === 'tree' ? 'tree' : t.amenity === 'cafe' || t.amenity === 'restaurant' ? 'cafe' : t.tourism === 'viewpoint' ? 'viewpoint' : t.shop ? 'shop'
    : t.amenity === 'place_of_worship' ? 'worship' : t.historic === 'monument' || t.historic === 'tomb' ? 'monument' : t.amenity === 'marketplace' || (t.tourism === 'attraction' && /سوق|souk/i.test(t.name || '')) ? 'souk' : null;
  if (!k) continue;
  const p = toScene(n.lat, n.lon);
  if (Math.abs(p[0]) > RADIUS || Math.abs(p[1]) > RADIUS) continue;
  const poi = { k, p: p.map(r1) };
  const name = t['name:fr'] || t.name; if (name) poi.name = name;
  out.pois.push(poi);
}
fs.writeFileSync(OUT_JSON, JSON.stringify(out));
console.log(`${out.buildings.length} buildings, ${out.roads.length} roads, ${out.areas.length} areas, ${out.piers.length} piers, ${out.coast.length} coast lines, ${out.pois.length} pois -> ${OUT_JSON} (${(fs.statSync(OUT_JSON).size / 1024).toFixed(0)} KB)`);


// ---------- shoreline from OpenStreetMap ----------
// The free elevation data blurs the coast (much of the shallow sea reads 0 m, some beaches below 0).
// OSM coastlines are drawn with land on the left: near the coast, the side of the nearest coastline segment
// decides land or sea; further away, the height does. Land stays above the sea, sea gets a sloping floor.
if (out.coast.length) {
  const segs = [];
  for (const c of out.coast) for (let i = 0; i < c.length - 1; i++) segs.push([c[i], c[i + 1], i === 0, i === c.length - 2, i > 0 ? c[i - 1] : null, i < c.length - 2 ? c[i + 2] : null]);
  let land = 0, sea = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = -HALF + i * CELL, z = -HALF + j * CELL, k = j * N + i;
    let best = Infinity, side = 0, atEnd = false;
    const sideOf = (p, q) => (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]);
    for (const [a, b, first, last, prev, next] of segs) {
      const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      const d = Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
      if (d < best) {
        best = d; side = dx * (z - a[1]) - dz * (x - a[0]); atEnd = (first && t === 0) || (last && t === 1);
        // nearest point is a corner: combine both segments (land = both sides at an inner corner, either at an outer one)
        const corner = t === 0 && prev ? [prev, a, b] : t === 1 && next ? [a, b, next] : null;
        if (corner) {
          const [p0, p1, p2] = corner;
          const s1 = sideOf(p0, p1), s2 = sideOf(p1, p2);
          const turn = (p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0]);
          const land = turn < 0 ? s1 < 0 && s2 < 0 : s1 < 0 || s2 < 0;
          side = land ? -1 : 1;
        }
      }
    }
    // in scene coordinates z points south, so 'left of the direction of travel' has a negative cross product
    // beyond the ends of a coastline the side test is meaningless: use the height there
    const isLand = best < 160 && !atEnd ? side < 0 : H[k] > 10;
    if (isLand) { if (H[k] < 6) { H[k] = 6; land++; } }
    else { const floor = Math.round(-Math.min(80, 5 + best * 0.6)); if (H[k] > floor) { H[k] = floor; sea++; } }
  }
  console.log('shoreline: raised', land, 'land cells, lowered', sea, 'sea cells');
}
fs.mkdirSync(path.dirname(OUT_BIN), { recursive: true });
fs.writeFileSync(OUT_BIN, Buffer.from(H.buffer));

// ---------- preview: hillshade + map ----------
const S = 1100, sc = S / (2 * HALF);
const img = Buffer.alloc(S * S * 3);
const hs = (x, z) => { const i = Math.min(N - 1, Math.max(0, Math.round((x + HALF) / CELL))), j = Math.min(N - 1, Math.max(0, Math.round((z + HALF) / CELL))); return H[j * N + i] / 10; };
for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
  const x = px / sc - HALF, z = py / sc - HALF, h = hs(x, z);
  const dx = hs(x + CELL, z) - hs(x - CELL, z), dz = hs(x, z + CELL) - hs(x, z - CELL);
  const shade = Math.max(0, Math.min(1, 0.6 - (dx - dz) * 0.06));
  const k = (py * S + px) * 3;
  if (h <= 0.5) { img[k] = 40; img[k + 1] = 90 + h; img[k + 2] = 140; continue; }
  const c = Math.min(1, h / 130);
  img[k] = (150 + 90 * c) * shade + 40; img[k + 1] = (150 + 60 * c) * shade + 30; img[k + 2] = (110 + 30 * c) * shade + 20;
}
const P = ([x, z]) => `${((x + HALF) * sc).toFixed(1)},${((z + HALF) * sc).toFixed(1)}`;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">`;
for (const r of out.roads) svg += `<polyline points="${r.p.map(P).join(' ')}" fill="none" stroke="${r.w >= 7 ? '#f4c26b' : '#fff'}" stroke-width="${Math.max(1, r.w * sc)}" opacity=".8"/>`;
for (const b of out.buildings) svg += `<polygon points="${b.p.map(P).join(' ')}" fill="${b.k ? '#3b6fb6' : '#f5f5f0'}" stroke="#555" stroke-width=".4"/>`;
for (const p of out.piers) svg += p.area ? `<polygon points="${p.p.map(P).join(' ')}" fill="#999"/>` : `<polyline points="${p.p.map(P).join(' ')}" fill="none" stroke="#999" stroke-width="${p.w * sc}"/>`;
svg += `<circle cx="${HALF * sc}" cy="${HALF * sc}" r="5" fill="red"/></svg>`;
await sharp(img, { raw: { width: S, height: S, channels: 3 } }).composite([{ input: Buffer.from(svg) }]).png().toFile(PREVIEW);
console.log('preview ->', PREVIEW);
