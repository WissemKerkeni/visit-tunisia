// Real town of El Jem from OpenStreetMap (© OpenStreetMap contributors, ODbL).
// Input:  references/el-jem/osm/eljem-osm.json  (API 0.6 map.json download, see README)
// Output: src/content/el-jem-town.json  (scene coordinates, metres)
//         references/el-jem/osm/preview.png (top view for checking against Google Maps / photos)
// Scene frame: origin = centre of the arena, x = long axis of the amphitheatre (towards ENE),
// north is -z. The arena centre and axis come from the arena outline in OSM (relation 2894555, inner ring).
// Usage: node scripts/make-town.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const SRC = 'references/el-jem/osm/eljem-osm.json';
const OUT = 'src/content/el-jem-town.json';
const PREVIEW = 'references/el-jem/osm/preview.png';
const RADIUS = 1150;          // keep features within this distance of the arena centre
const SITE = { a: 78, b: 65 }; // ellipse (scene metres) covering the amphitheatre: features inside are the monument itself

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const nodes = new Map(), ways = new Map();
for (const e of data.elements) {
  if (e.type === 'node') nodes.set(e.id, e);
  else if (e.type === 'way') ways.set(e.id, e);
}

// ---- frame from the arena outline ----
const R = 6378137;
const lat0g = 35.2964, lon0g = 10.7069;
const kx = Math.cos((lat0g * Math.PI) / 180) * R * Math.PI / 180, ky = R * Math.PI / 180;
const amph = data.elements.find((e) => e.type === 'relation' && e.id === 2894555);
const arenaWay = ways.get(amph.members.find((m) => m.role === 'inner').ref);
const ap = arenaWay.nodes.map((i) => nodes.get(i)).map((n) => [(n.lon - lon0g) * kx, (n.lat - lat0g) * ky]);
const cx = ap.reduce((s, p) => s + p[0], 0) / ap.length, cy = ap.reduce((s, p) => s + p[1], 0) / ap.length;
let sxx = 0, syy = 0, sxy = 0;
for (const [x, y] of ap) { sxx += (x - cx) ** 2; syy += (y - cy) ** 2; sxy += (x - cx) * (y - cy); }
const axis = 0.5 * Math.atan2(2 * sxy, sxx - syy); // long axis, radians counter-clockwise from east
const ca = Math.cos(axis), sa = Math.sin(axis);
const origin = { lat: lat0g + cy / ky, lon: lon0g + cx / kx };
console.log(`arena centre ${origin.lat.toFixed(6)}, ${origin.lon.toFixed(6)}; long axis bearing ${(90 - (axis * 180) / Math.PI).toFixed(1)}°`);

/** lat/lon -> scene [x, z] */
const toScene = (n) => {
  const e = (n.lon - lon0g) * kx - cx, nn = (n.lat - lat0g) * ky - cy;
  const u = e * ca + nn * sa, v = -e * sa + nn * ca;
  return [u, -v];
};
const r1 = (v) => Math.round(v * 10) / 10;
const pts = (w) => w.nodes.map((i) => nodes.get(i)).filter(Boolean).map(toScene);
const inSite = ([x, z]) => (x / SITE.a) ** 2 + (z / SITE.b) ** 2 < 1;
const centroid = (p) => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
const near = (p) => p.some(([x, z]) => Math.hypot(x, z) < RADIUS);

/** Douglas-Peucker simplification (keeps footprints light, tolerance in metres). */
function simplify(p, tol) {
  if (p.length < 4) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const stack = [[0, p.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1, bi = -1;
    const [ax, az] = p[a], [bx, bz] = p[b];
    const L = Math.hypot(bx - ax, bz - az) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (az - p[i][1]) - (ax - p[i][0]) * (bz - az)) / L;
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
const ring = (p) => {
  let q = p.slice();
  if (q.length > 2 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop();
  q = simplify(q, 0.25); // open chain: its two ends are neighbours on the ring
  return q.map(([x, z]) => [r1(x), r1(z)]);
};
const area = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const [x1, z1] = p[i], [x2, z2] = p[(i + 1) % p.length]; s += x1 * z2 - x2 * z1; } return s / 2; };

const out = { source: '© OpenStreetMap contributors (ODbL), downloaded ' + new Date().toISOString().slice(0, 10), origin, axisBearing: r1(90 - (axis * 180) / Math.PI), buildings: [], roads: [], rail: [], areas: [], treeRows: [], pois: [] };

// relation outer rings (multipolygon buildings / areas)
const relOuter = (rel) => rel.members.filter((m) => m.type === 'way' && m.role === 'outer').map((m) => ways.get(m.ref)).filter(Boolean);
const skipWays = new Set();
for (const rel of data.elements.filter((e) => e.type === 'relation')) {
  for (const m of rel.members || []) if (m.type === 'way') skipWays.add(m.ref);
}

const ROAD_W = { primary: 11, secondary: 10, secondary_link: 7, tertiary: 8, unclassified: 6.5, residential: 6, living_street: 5, service: 4.5, pedestrian: 5, footway: 2.2, path: 1.8, steps: 2.5, track: 3.5 };
const AREA_KIND = (t) =>
  t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'village_green' || t.landuse === 'grass' ? 'park'
  : t.landuse === 'orchard' ? 'orchard'
  : t.landuse === 'farmland' ? 'farmland'
  : t.landuse === 'cemetery' || t.amenity === 'grave_yard' ? 'cemetery'
  : t.amenity === 'parking' ? 'parking'
  : t.leisure === 'pitch' || t.leisure === 'sports_centre' ? 'pitch'
  : t.amenity === 'school' ? 'school'
  : t.amenity === 'marketplace' ? 'market'
  : t.highway === 'pedestrian' && t.area === 'yes' ? 'pedestrian'
  : t.historic === 'archaeological_site' ? 'archaeology'
  : t.natural === 'sand' ? 'sand'
  : null;

function addBuilding(p, t, id) {
  if (p.length < 3 || !near(p)) return;
  const c = centroid(p);
  if (inSite(c)) return; // the amphitheatre is modelled separately
  const q = ring(p);
  if (q.length < 3 || Math.abs(area(q)) < 6) return;
  const b = { id, p: area(q) < 0 ? q.reverse() : q };
  const kind = t.building === 'mosque' || t.amenity === 'place_of_worship' ? 'mosque'
    : t.building === 'ruins' || t.historic ? 'ruins'
    : t.building === 'museum' || t.tourism === 'museum' ? 'museum'
    : t.amenity === 'school' || t.building === 'school' ? 'school'
    : ['service', 'kiosk', 'toilets'].includes(t.building) || t.amenity === 'toilets' ? 'kiosk'
    : t.building === 'roof' ? 'roof'
    : 'house';
  if (kind !== 'house') b.k = kind;
  const lv = parseFloat(t['building:levels']);
  if (lv > 0) b.lv = lv;
  const h = parseFloat(t.height);
  if (h > 0) b.h = h;
  if (t.name) b.name = t['name:en'] || t['name:fr'] || t.name;
  out.buildings.push(b);
}

for (const rel of data.elements.filter((e) => e.type === 'relation' && e.tags)) {
  const t = rel.tags;
  if (rel.id === 2894555) continue;
  if (t.building) for (const w of relOuter(rel)) addBuilding(pts(w), t, rel.id);
  const k = AREA_KIND(t);
  if (k) for (const w of relOuter(rel)) { const p = pts(w); if (near(p)) out.areas.push({ k, p: ring(p) }); }
}

for (const w of ways.values()) {
  const t = w.tags;
  if (!t) continue;
  const p = pts(w);
  if (p.length < 2 || !near(p)) continue;
  if (t.building && !skipWays.has(w.id)) { addBuilding(p, t, w.id); continue; }
  if (t.highway && ROAD_W[t.highway] && t.area !== 'yes') {
    const q = simplify(p, 0.3).map(([x, z]) => [r1(x), r1(z)]);
    const road = { k: t.highway, w: ROAD_W[t.highway], p: q };
    if (t.name) road.name = t['name:fr'] || t.name;
    if (t.lanes) road.w = Math.max(road.w, parseFloat(t.lanes) * 3.3);
    out.roads.push(road);
    continue;
  }
  if (t.railway === 'rail' || t.railway === 'disused') { out.rail.push({ k: t.railway, p: simplify(p, 0.3).map(([x, z]) => [r1(x), r1(z)]) }); continue; }
  if (t.railway === 'platform') { out.areas.push({ k: 'platform', p: ring(p) }); continue; }
  if (t.natural === 'tree_row') { out.treeRows.push(simplify(p, 0.5).map(([x, z]) => [r1(x), r1(z)])); continue; }
  const k = AREA_KIND(t);
  if (k && !skipWays.has(w.id)) out.areas.push({ k, p: ring(p) });
}
for (const n of nodes.values()) {
  const t = n.tags;
  if (!t) continue;
  const kind = t.natural === 'tree' ? 'tree' : t.amenity === 'cafe' || t.amenity === 'restaurant' ? 'cafe' : t.shop ? 'shop' : t.amenity === 'place_of_worship' ? 'mosque' : null;
  if (!kind) continue;
  const p = toScene(n);
  if (Math.hypot(...p) > RADIUS) continue;
  out.pois.push({ k: kind, p: p.map(r1) });
}

fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`${out.buildings.length} buildings, ${out.roads.length} roads, ${out.rail.length} rail, ${out.areas.length} areas, ${out.treeRows.length} tree rows, ${out.pois.length} pois -> ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);

// ---- preview (top view, north up = -z up) ----
const S = 1600, half = 1200, sc = S / (2 * half);
const P = ([x, z]) => `${((x + half) * sc).toFixed(1)},${((z + half) * sc).toFixed(1)}`;
const col = { park: '#b9d79a', orchard: '#cfe0a8', farmland: '#efe2bf', cemetery: '#c9d1b8', parking: '#dddddd', pitch: '#a9d6a0', school: '#f2e6c9', market: '#f0d0c0', pedestrian: '#e9e2d6', archaeology: '#e8cfa8', sand: '#f3dfb5', platform: '#cccccc' };
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><rect width="100%" height="100%" fill="#f6f1e7"/>`;
for (const a of out.areas) svg += `<polygon points="${a.p.map(P).join(' ')}" fill="${col[a.k] || '#eee'}"/>`;
for (const r of out.roads) svg += `<polyline points="${r.p.map(P).join(' ')}" fill="none" stroke="${r.w >= 8 ? '#f4c26b' : '#ffffff'}" stroke-width="${(r.w * sc).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
for (const r of out.rail) svg += `<polyline points="${r.p.map(P).join(' ')}" fill="none" stroke="#555" stroke-width="1.5" stroke-dasharray="4 3"/>`;
for (const b of out.buildings) svg += `<polygon points="${b.p.map(P).join(' ')}" fill="${b.k === 'mosque' ? '#7aa7d9' : b.k ? '#c49a6c' : '#d8c3a5'}" stroke="#9c8466" stroke-width="0.4"/>`;
svg += `<ellipse cx="${half * sc}" cy="${half * sc}" rx="${74 * sc}" ry="${61 * sc}" fill="#b5895a" stroke="#6b4a2b"/>`;
svg += `<text x="20" y="40" font-size="28" font-family="Arial">N ↑  (scene x → long axis)</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile(PREVIEW);
console.log('preview ->', PREVIEW);
