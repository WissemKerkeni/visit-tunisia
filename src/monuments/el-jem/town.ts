/**
 * The real town of El Jem around the amphitheatre.
 *
 * Geometry comes from OpenStreetMap (© OpenStreetMap contributors, ODbL), converted to scene
 * coordinates by scripts/make-town.mjs: streets, building footprints, parks, cemeteries, orchards,
 * the railway. OSM maps footprints for only part of the town, so where a real street has no mapped
 * buildings, houses are filled in along it (frontage, depth and density matched to satellite views).
 * Heights, colours and rooftop details follow photos of the town: one to three storeys, flat roofs with
 * parapets, cream / sand / white plaster, water tanks and dishes, shop awnings near the monument.
 */
import * as THREE from 'three';
import TOWN from '../../content/el-jem-town.json';
import type { MatKey } from '../../viewer/materials';
import type { Placement } from './city';
import type { Spot } from './vegetation';
import { box, cylinder, hash } from './geometry';

export type AddFn = (mat: MatKey, g: THREE.BufferGeometry, m?: THREE.Matrix4, collide?: boolean) => void;
type P2 = [number, number];

/** Rotation of the scene against true north: the amphitheatre's long axis (scene x) points ENE. */
export const NORTH_ROTATION = THREE.MathUtils.degToRad(90 - TOWN.axisBearing);
export const TOWN_SOURCE = TOWN.source;

interface Building { p: P2[]; k?: string; lv?: number; h?: number; name?: string; id?: number }
interface Road { k: string; w: number; p: P2[]; name?: string }
interface Area { k: string; p: P2[] }

const SITE = { a: 74, b: 61 };              // outer wall semi-axes
const siteS = (x: number, z: number) => Math.hypot(x / SITE.a, z / SITE.b);
export const PLAZA_S = 1.22;                // paved esplanade around the walls, inside the site fence

// ---- occupancy grid (what is already taken: roads, buildings, open areas, the site) ----
const G = 1.5, HALF = 1220, N = Math.ceil((2 * HALF) / G);
const ROAD = 1, BLD = 2, AREA = 4, KEEP = 8;
const grid = new Uint8Array(N * N);
const cell = (x: number, z: number) => {
  const i = Math.floor((x + HALF) / G), j = Math.floor((z + HALF) / G);
  return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i;
};
const at = (x: number, z: number) => { const c = cell(x, z); return c < 0 ? 0 : grid[c]; };

function markSeg(a: P2, b: P2, rad: number, bit: number) {
  const x0 = Math.min(a[0], b[0]) - rad, x1 = Math.max(a[0], b[0]) + rad;
  const z0 = Math.min(a[1], b[1]) - rad, z1 = Math.max(a[1], b[1]) + rad;
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
  for (let z = Math.floor(z0 / G) * G + G / 2; z <= z1; z += G) {
    for (let x = Math.floor(x0 / G) * G + G / 2; x <= x1; x += G) {
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      if (Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) <= rad) { const c = cell(x, z); if (c >= 0) grid[c] |= bit; }
    }
  }
}
function inPoly(x: number, z: number, p: P2[]) {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function bbox(p: P2[]) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { x0, x1, z0, z1 };
}
function markPoly(p: P2[], bit: number, pad = 0) {
  const b = bbox(p);
  for (let z = Math.floor((b.z0 - pad) / G) * G + G / 2; z <= b.z1 + pad; z += G) {
    for (let x = Math.floor((b.x0 - pad) / G) * G + G / 2; x <= b.x1 + pad; x += G) {
      if (inPoly(x, z, p)) { const c = cell(x, z); if (c >= 0) grid[c] |= bit; }
    }
  }
}
const signedArea = (p: P2[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const centroid = (p: P2[]): P2 => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];

// ---- geometry helpers ----
function paint(g: THREE.BufferGeometry, col: THREE.Color) {
  const n = g.getAttribute('position').count, c = new Float32Array(n * 3);
  for (let j = 0; j < c.length; j += 3) { c[j] = col.r; c[j + 1] = col.g; c[j + 2] = col.b; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  return g;
}

/** Flat polygon at height y, facing up, with world-space UVs (metres). */
function flat(p: P2[], y: number): THREE.BufferGeometry | null {
  const contour = p.map(([x, z]) => new THREE.Vector2(x, z));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  if (!tris.length) return null;
  const pos: number[] = [], uv: number[] = [];
  for (const [a, b, c] of tris) {
    let A = p[a], B = p[b], C = p[c];
    // upward normal: (B-A) x (C-A) must have +y, i.e. (C-A)_x (B-A)_z - (B-A)_x (C-A)_z > 0
    if ((C[0] - A[0]) * (B[1] - A[1]) - (B[0] - A[0]) * (C[1] - A[1]) < 0) [B, C] = [C, B];
    for (const q of [A, B, C]) { pos.push(q[0], y, q[1]); uv.push(q[0], -q[1]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const nrm = new Float32Array(pos.length); for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1;
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}

/**
 * Walls of a footprint (counter-clockwise in x/z, i.e. positive signed area) from y0 to y1.
 * UVs in metres along the wall so the plaster texture's doors and windows keep their real size.
 * inward = true builds the inner face (for parapets seen from the roof).
 */
function walls(p: P2[], y0: number, y1: number, u0 = 0, inward = false) {
  const pos: number[] = [], uv: number[] = [], nrm: number[] = [];
  let u = u0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.05) continue;
    let nx = dz / L, nz = -dx / L; // outward for a CCW footprint
    const quad: [P2, number, number][] = [[a, y0, u], [b, y0, u + L], [b, y1, u + L], [a, y1, u]];
    // triangle order that faces (nx, nz)
    let order = [0, 2, 1, 0, 3, 2];
    if (inward) { nx = -nx; nz = -nz; order = [0, 1, 2, 0, 2, 3]; }
    for (const k of order) { const [q, y, uu] = quad[k]; pos.push(q[0], y, q[1]); uv.push(uu, y); nrm.push(nx, 0, nz); }
    u += L;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  return g;
}

/** Ribbon along a polyline (roads, footways) with round joins, world-space UVs, at height y. */
function ribbon(p: P2[], w: number, y: number) {
  const parts: THREE.BufferGeometry[] = [];
  const r = w / 2;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i], b = p[i + 1];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.05) continue;
    const nx = (-dz / L) * r, nz = (dx / L) * r;
    const q: P2[] = [[a[0] + nx, a[1] + nz], [a[0] - nx, a[1] - nz], [b[0] - nx, b[1] - nz], [b[0] + nx, b[1] + nz]];
    const g = flat(q, y); if (g) parts.push(g);
  }
  // round joins and ends
  const seg = w > 7 ? 12 : 8;
  for (const c of p) {
    const ring: P2[] = [];
    for (let k = 0; k < seg; k++) { const t = (k / seg) * Math.PI * 2; ring.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r]); }
    const g = flat(ring, y); if (g) parts.push(g);
  }
  return parts;
}

const PALETTE = ['#efe6d6', '#e8dcc4', '#f3eee6', '#e2cfae', '#d9c3a0', '#f1e4cf', '#e6d6bd', '#ddd0bd', '#efd9bd', '#f6f3ee', '#e9d6c8', '#dfe2d8', '#e4cba3'];
const ROOFS = ['#d8d1c3', '#cfc6b5', '#dcd5c8', '#c8bfae', '#e0dbd1'];
const AWNINGS = ['#2f6fa8', '#b8432f', '#3c7a63', '#d9a441', '#8a3b6b', '#e8e2d4', '#c2552d'].map((c) => new THREE.Color(c));
const WHITE = new THREE.Color('#f7f3ea');

export interface TownResult {
  cars: Placement[]; lamps: Placement[]; trees: Placement[]; groves: Placement[]; palms: THREE.Vector3[];
  shrubs: Spot[]; grass: Spot[];
  spawn: THREE.Vector3; spawnLook: THREE.Vector3; flag: THREE.Vector3;
  /** true where nothing is built (for placing props) */
  isFree: (x: number, z: number) => boolean;
  /** true inside a building footprint */
  built: (x: number, z: number) => boolean;
}

export function buildRealTown(add: AddFn): TownResult {
  grid.fill(0);
  let seed = 7;
  const rnd = () => hash(seed++ * 1.913);
  const res: TownResult = {
    cars: [], lamps: [], trees: [], groves: [], palms: [], shrubs: [], grass: [],
    spawn: new THREE.Vector3(), spawnLook: new THREE.Vector3(0, 12, 0), flag: new THREE.Vector3(),
    isFree: (x, z) => at(x, z) === 0 && siteS(x, z) > 1.03,
    built: (x, z) => (at(x, z) & BLD) !== 0,
  };
  const buildings = TOWN.buildings as Building[];
  const roads = (TOWN.roads as Road[]).filter((r) => !r.p.every(([x, z]) => siteS(x, z) < PLAZA_S));
  // areas mapped inside the monument (arena footpath, sand) are part of the monument model
  const areas = (TOWN.areas as Area[]).filter((a) => siteS(...centroid(a.p)) > 1.05);

  // ---- reserve: the site, roads, real buildings, open areas ----
  const siteRing: P2[] = [];
  for (let k = 0; k < 96; k++) { const t = (k / 96) * Math.PI * 2; siteRing.push([Math.cos(t) * SITE.a * (PLAZA_S + 0.02), Math.sin(t) * SITE.b * (PLAZA_S + 0.02)]); }
  markPoly(siteRing, KEEP);
  for (const r of roads) for (let i = 0; i < r.p.length - 1; i++) markSeg(r.p[i], r.p[i + 1], r.w / 2 + (r.w >= 6 ? 1.3 : 0.4), ROAD);
  for (const b of buildings) markPoly(b.p, BLD);
  for (const a of areas) if (a.k !== 'farmland' && a.k !== 'school') markPoly(a.p, AREA);
  for (const r of TOWN.rail) for (let i = 0; i < r.p.length - 1; i++) markSeg(r.p[i] as P2, r.p[i + 1] as P2, 5, AREA);

  // spawn: on the esplanade near the ticket kiosk (south-east entrance), clear of buildings
  for (let k = 0; k < 40; k++) {
    const t = 0.7 - k * 0.04, s = 1.16;
    const x = Math.cos(t) * SITE.a * s, z = Math.sin(t) * SITE.b * s;
    let clear = true;
    for (let dz = -5; dz <= 5; dz += 1.5) for (let dx = -5; dx <= 5; dx += 1.5) if (at(x + dx, z + dz) & BLD) clear = false;
    if (clear) { res.spawn.set(x, 0, z); break; }
  }
  res.flag.set(res.spawn.x + 4, 0, res.spawn.z + 3);
  markSeg([res.spawn.x, res.spawn.z], [res.flag.x, res.flag.z], 3, KEEP);

  // ---- ground surfaces ----
  for (const a of areas) {
    const y = a.k === 'pedestrian' ? 0.05 : a.k === 'parking' ? 0.03 : 0.025;
    const g = flat(a.p, y);
    if (!g) continue;
    const c = centroid(a.p), r = Math.hypot(...c);
    switch (a.k) {
      case 'park': add('roof', paint(g, new THREE.Color('#9a9b62')), undefined, false); break;
      case 'pitch': add('roof', paint(g, new THREE.Color('#6f8d48')), undefined, false); break;
      case 'cemetery': add('roof', paint(g, new THREE.Color('#d9ccb0')), undefined, false); break;
      case 'parking': add('asphalt', g, undefined, false); break;
      case 'pedestrian': case 'platform': case 'market': add('paving', g, undefined, false); break;
      case 'archaeology': case 'sand': add('ground', g, undefined, false); break;
      default: break;
    }
    const b = bbox(a.p);
    if (a.k === 'park') {
      // trees through the park, shrubs and grass near the monument
      for (let z = b.z0 + 4; z < b.z1; z += 9) for (let x = b.x0 + 4; x < b.x1; x += 9) {
        const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 4;
        if (!inPoly(px, pz, a.p) || siteS(px, pz) < 1.06) continue;
        if (r < 220 && rnd() < 0.5) res.shrubs.push({ x: px, y: 0.03, z: pz, scale: 1 + rnd() * 0.8, color: rnd() < 0.35 ? (rnd() < 0.5 ? '#c2387a' : '#d0508f') : undefined });
        else if (rnd() < 0.7) res.trees.push({ x: px, z: pz, yaw: rnd() * 6 });
        if (r < 260) for (let k = 0; k < 4; k++) res.grass.push({ x: px + (rnd() - 0.5) * 6, y: 0.03, z: pz + (rnd() - 0.5) * 6, scale: 1 });
      }
    } else if (a.k === 'orchard') {
      // olives are planted wide apart on the dry Sahel plain
      for (let z = b.z0 + 3; z < b.z1; z += 12) for (let x = b.x0 + 3; x < b.x1; x += 12) if (inPoly(x, z, a.p)) res.groves.push({ x, z, yaw: rnd() * 6 });
    } else if (a.k === 'cemetery') {
      // whitewashed tombs in loose rows
      for (let z = b.z0 + 2; z < b.z1; z += 2.6) for (let x = b.x0 + 2; x < b.x1; x += 1.6) {
        if (!inPoly(x, z, a.p) || rnd() < 0.45) continue;
        add('roof', paint(box(0.7, 0.35 + rnd() * 0.3, 1.9, x, 0.2, z), WHITE), undefined, false);
      }
    }
  }

  // roads: asphalt; footways and steps: paving
  for (const r of roads) {
    const foot = r.k === 'footway' || r.k === 'path' || r.k === 'steps' || r.k === 'pedestrian';
    const y = foot ? 0.045 : 0.02 + Math.min(r.w, 12) * 0.001;
    for (const g of ribbon(r.p, r.w, y)) add(foot ? 'paving' : 'asphalt', g, undefined, false);
  }
  // railway: ballast and two rails
  for (const r of TOWN.rail) {
    const p = r.p as P2[];
    for (const g of ribbon(p, 3.4, 0.06)) add('rock', g, undefined, false);
    if (r.k !== 'rail') continue;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 0.1) continue;
      for (const o of [-0.72, 0.72]) {
        const m = new THREE.Matrix4().makeRotationY(-Math.atan2(dz, dx)).setPosition((a[0] + b[0]) / 2 - (dz / L) * o, 0.16, (a[1] + b[1]) / 2 + (dx / L) * o);
        add('townSteel', box(L, 0.15, 0.08), m, false);
      }
    }
  }

  // ---- buildings ----
  const roadNear = (x: number, z: number) => (at(x, z) & ROAD) !== 0;
  const pois = (TOWN.pois as { k: string; p: P2 }[]).filter((q) => q.k === 'cafe' || q.k === 'shop');
  const nearPoi = (x: number, z: number) => pois.some((q) => Math.hypot(q.p[0] - x, q.p[1] - z) < 25);

  function house(p: P2[], opts: { lv?: number; h?: number; kind?: string; id: number }) {
    const c = centroid(p), r = Math.hypot(...c);
    const near = r < 520;
    const far = near ? '' : 'Far';
    const collide = r < 420;
    const hs = hash(opts.id * 0.731 + 0.17);
    // the plaster texture holds three storeys, so taller houses are rare (and capped at three)
    const storeys = Math.min(3, opts.lv ?? (hs < 0.32 ? 1 : hs < 0.8 ? 2 : 3) - (r > 800 && hs > 0.5 ? 1 : 0));
    const h = opts.h ?? storeys * 3.2 + 0.3 + hash(opts.id * 1.31) * 0.4;
    const col = new THREE.Color(PALETTE[Math.floor(hash(opts.id * 2.17) * PALETTE.length)]);
    const roofCol = new THREE.Color(ROOFS[Math.floor(hash(opts.id * 3.7) * ROOFS.length)]);
    const parapet = 0.55;
    const u0 = hash(opts.id * 5.1) * 8;
    add(`plaster${far}` as MatKey, paint(walls(p, 0, h + parapet, u0), col), undefined, collide);
    const roof = flat(p, h);
    if (roof) add(`roof${far}` as MatKey, paint(roof, roofCol), undefined, collide);
    if (r < 900) add(`roof${far}` as MatKey, paint(walls(p, h, h + parapet, 0, true), col.clone().multiplyScalar(0.93)), undefined, false);
    if (!near) return;
    // rooftop: stair room, water tanks, dishes, rebar left for a future storey
    const b = bbox(p), w = b.x1 - b.x0, d = b.z1 - b.z0;
    const inside = (fx: number, fz: number): P2 | null => {
      const x = c[0] + (fx - 0.5) * w * 0.6, z = c[1] + (fz - 0.5) * d * 0.6;
      return inPoly(x, z, p) ? [x, z] : null;
    };
    const q1 = inside(rnd(), rnd());
    if (q1 && rnd() < 0.3 && w > 6 && d > 6) add('plaster', paint(box(2.6, 2.5, 2.8, q1[0], h + 1.25, q1[1]), col), undefined, false);
    const q2 = inside(rnd(), rnd());
    if (q2 && rnd() < 0.55) {
      const tank = cylinder(0.55, 0.55, 1.1, 10, h + 0.25).translate(q2[0], 0, q2[1]);
      add('roof', paint(tank, rnd() < 0.6 ? new THREE.Color('#f1f1ee') : new THREE.Color('#2a2b2d')), undefined, false);
      add('townSteel', box(1.3, 0.25, 1.3, q2[0], h + 0.12, q2[1]), undefined, false);
    }
    const q3 = inside(rnd(), rnd());
    if (q3 && rnd() < 0.35) add('roof', paint(new THREE.CylinderGeometry(0.45, 0.05, 0.18, 14).rotateX(-1.0).translate(q3[0], h + 1.0, q3[1]), new THREE.Color('#e8e8e6')), undefined, false);
    if (rnd() < 0.18) for (const v of p.slice(0, 4)) {
      const x = v[0] + (c[0] - v[0]) * 0.08, z = v[1] + (c[1] - v[1]) * 0.08;
      add('townSteel', box(0.04, 1.3, 0.04, x, h + parapet + 0.6, z), undefined, false);
    }
    // street fronts near the monument and near cafés/shops: awnings and signs over the ground floor
    if (r > 380) return;
    const busy = r < 220 || nearPoi(c[0], c[1]);
    for (let i = 0; i < p.length; i++) {
      const a = p[i], e = p[(i + 1) % p.length], dx = e[0] - a[0], dz = e[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 4) continue;
      const nx = dz / L, nz = -dx / L, mx = (a[0] + e[0]) / 2, mz = (a[1] + e[1]) / 2;
      if (!roadNear(mx + nx * 3, mz + nz * 3) || rnd() > (busy ? 0.7 : 0.3)) continue;
      const m = new THREE.Matrix4().makeRotationY(-Math.atan2(dz, dx)).setPosition(mx + nx * 0.7, 0, mz + nz * 0.7);
      const aw = box(L * 0.75, 0.08, 1.3, 0, 2.75, 0.0);
      add('roof', paint(aw, AWNINGS[Math.floor(rnd() * AWNINGS.length)]), m, false);
      if (rnd() < 0.6) {
        const ms = new THREE.Matrix4().makeRotationY(-Math.atan2(dz, dx)).setPosition(mx + nx * 0.06, 0, mz + nz * 0.06);
        add('roof', paint(box(L * 0.5, 0.6, 0.06, 0, 3.35, 0), new THREE.Color(rnd() < 0.5 ? '#f5f1e6' : '#1f5fa8')), ms, false);
      }
    }
  }

  function mosque(p: P2[], id: number) {
    const c = centroid(p), area = Math.abs(signedArea(p));
    const collide = Math.hypot(...c) < 420;
    const h = 7.5;
    add('plaster', paint(walls(p, 0, h + 0.6, hash(id) * 8), WHITE), undefined, collide);
    const roof = flat(p, h);
    if (roof) add('roof', paint(roof, new THREE.Color('#e9e4da')), undefined, collide);
    add('roof', paint(walls(p, h, h + 0.6, 0, true), WHITE), undefined, false);
    const rd = Math.min(7, Math.sqrt(area) / 4.5);
    add('roof', paint(cylinder(rd, rd, 1.2, 24, h).translate(c[0], 0, c[1]), WHITE), undefined, false);
    add('roof', paint(new THREE.SphereGeometry(rd, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(c[0], h + 1.2, c[1]), WHITE), undefined, false);
    // square Tunisian minaret near the corner farthest from the centre, octagonal upper stage and lantern
    let far = p[0];
    for (const v of p) if (Math.hypot(v[0] - c[0], v[1] - c[1]) > Math.hypot(far[0] - c[0], far[1] - c[1])) far = v;
    const mx = far[0] + (c[0] - far[0]) * 0.18, mz = far[1] + (c[1] - far[1]) * 0.18;
    const stone = new THREE.Color('#e6d3b0');
    const mh = 22 + hash(id * 3) * 8;
    add('plaster', paint(box(4.4, mh, 4.4, mx, mh / 2, mz), stone), undefined, collide);
    add('roof', paint(box(5.2, 0.6, 5.2, mx, mh + 0.3, mz), stone), undefined, false);
    add('plaster', paint(cylinder(1.7, 1.9, 4.2, 8, mh + 0.6).translate(mx, 0, mz), stone), undefined, false);
    add('roof', paint(cylinder(2.2, 2.2, 0.4, 8, mh + 4.8).translate(mx, 0, mz), stone), undefined, false);
    add('roof', paint(new THREE.SphereGeometry(1.4, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2).translate(mx, mh + 5.2, mz), new THREE.Color('#5f8f6a')), undefined, false);
    add('townSteel', cylinder(0.05, 0.05, 1.8, 6, mh + 6.4).translate(mx, 0, mz), undefined, false);
  }

  let idc = 1;
  for (const b of buildings) {
    const id = b.id ?? idc++;
    const p = b.p;
    if (signedArea(p) <= 0) p.reverse();
    const r = Math.hypot(...centroid(p));
    if (b.k === 'mosque') { mosque(p, id); continue; }
    if (b.k === 'ruins') {
      add('rubble', walls(p, 0, 1.4, 0), undefined, false);
      continue;
    }
    if (b.k === 'roof') {
      const g = flat(p, 3.2); if (g) add('roof', paint(g, new THREE.Color('#d7d0c2')), undefined, false);
      continue;
    }
    house(p, {
      id,
      lv: b.lv,
      h: b.k === 'kiosk' ? 3.2 : b.k === 'museum' ? 6.2 : b.k === 'school' ? 7 : b.h && b.h > 2 ? b.h : undefined,
    });
    void r;
  }

  // ---- houses along real streets that have no mapped buildings ----
  const FILL = new Set(['residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'living_street', 'service', 'secondary_link']);
  const density = (r: number) => (r < 700 ? 0.98 : r < 980 ? 0.98 - ((r - 700) / 280) * 0.6 : r < 1120 ? 0.3 : 0);
  const lotFree = (q: P2[]) => {
    const b = bbox(q);
    for (let z = b.z0 + 0.4; z <= b.z1 - 0.4; z += 1.2) for (let x = b.x0 + 0.4; x <= b.x1 - 0.4; x += 1.2) {
      if (!inPoly(x, z, q)) continue;
      const c = cell(x, z);
      if (c < 0 || grid[c]) return false;
    }
    return true;
  };
  const lot = (cx: number, cz: number, ux: number, uz: number, front: number, depth: number): P2[] => {
    const vx = -uz, vz = ux; // across
    const hf = front / 2, hd = depth / 2;
    const q: P2[] = [[cx - ux * hf - vx * hd, cz - uz * hf - vz * hd], [cx + ux * hf - vx * hd, cz + uz * hf - vz * hd], [cx + ux * hf + vx * hd, cz + uz * hf + vz * hd], [cx - ux * hf + vx * hd, cz - uz * hf + vz * hd]];
    return signedArea(q) < 0 ? q.reverse() : q;
  };
  let lots = 0;
  for (const road of roads) {
    if (!FILL.has(road.k)) continue;
    // walk the whole street (curves included) by arc length
    const cum = [0];
    for (let i = 1; i < road.p.length; i++) cum.push(cum[i - 1] + Math.hypot(road.p[i][0] - road.p[i - 1][0], road.p[i][1] - road.p[i - 1][1]));
    const total = cum[cum.length - 1];
    const along = (s: number) => {
      let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      const a = road.p[i - 1], b = road.p[i], L = cum[i] - cum[i - 1] || 1e-6, f = (s - cum[i - 1]) / L;
      return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, ux: (b[0] - a[0]) / L, uz: (b[1] - a[1]) / L };
    };
    if (total < 6) continue;
    {
      for (const side of [1, -1]) {
        let s = 1 + rnd() * 2;
        while (s < total - 3) {
          const front = 6.5 + rnd() * 7, depth = 9 + rnd() * 8;
          const mid = along(s + front / 2);
          const ux = mid.ux, uz = mid.uz, nx = -uz * side, nz = ux * side;
          const off = road.w / 2 + (road.w >= 6 ? 1.6 : 0.6) + depth / 2;
          const cx = mid.x + nx * off, cz = mid.z + nz * off;
          const r = Math.hypot(cx, cz);
          s += front + 0.15;
          if (rnd() > density(r)) continue;
          const q = lot(cx, cz, ux, uz, front, depth);
          if (!lotFree(q)) continue;
          markPoly(q, BLD, 0.3);
          house(q, { id: 100000 + lots++ });
          // more houses behind, until the block is full (El Jem's blocks are packed solid near the centre)
          let back = depth / 2;
          const rows = r < 600 ? 5 : r < 850 ? 3 : 1;
          for (let k = 0; k < rows; k++) {
            if (rnd() > (r < 600 ? 0.92 : 0.6)) break;
            const d2 = 8 + rnd() * 6;
            const o = back + d2 / 2 + 0.2;
            const q2 = lot(cx + nx * o, cz + nz * o, ux, uz, front * (0.85 + rnd() * 0.3), d2);
            if (!lotFree(q2)) break;
            markPoly(q2, BLD, 0.3);
            house(q2, { id: 100000 + lots++ });
            back = o + d2 / 2;
          }
        }
      }
    }
  }

  // ---- street furniture along the real streets ----
  for (const road of roads) {
    const major = road.k === 'primary' || road.k === 'secondary' || road.k === 'tertiary';
    const kerbCars = road.k === 'residential' || road.k === 'tertiary' || road.k === 'unclassified';
    for (let i = 0; i < road.p.length - 1; i++) {
      const a = road.p[i], b = road.p[i + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 3) continue;
      const ux = dx / L, uz = dz / L, yaw = -Math.atan2(dz, dx);
      for (let s = 2; s < L - 2; s += 1) {
        const x = a[0] + ux * s, z = a[1] + uz * s, r = Math.hypot(x, z);
        if (siteS(x, z) < PLAZA_S + 0.05) continue;
        const sideK = hash(i * 13.7 + s * 0.31 + road.w) < 0.5 ? 1 : -1;
        // palms and lamps along the main avenues
        if (major && r < 750 && Math.round(s) % 14 === 0) {
          for (const sd of [1, -1]) {
            const px = x - uz * sd * (road.w / 2 + 1.0), pz = z + ux * sd * (road.w / 2 + 1.0);
            if (!(at(px, pz) & BLD)) res.palms.push(new THREE.Vector3(px, 0, pz));
          }
        }
        if (major && r < 550 && Math.round(s) % 32 === 7) {
          const px = x - uz * sideK * (road.w / 2 + 0.6), pz = z + ux * sideK * (road.w / 2 + 0.6);
          // the lamp arm (local +x) reaches over the road
          if (!(at(px, pz) & BLD)) res.lamps.push({ x: px, z: pz, yaw: Math.atan2(ux * sideK, uz * sideK) });
        }
        // parked cars along the kerb near the centre
        if (kerbCars && r < 480 && Math.round(s * 10) % 65 === 0 && hash(x * 0.7 + z * 1.3) < 0.4) {
          const px = x - uz * sideK * (road.w / 2 - 1.0), pz = z + ux * sideK * (road.w / 2 - 1.0);
          res.cars.push({ x: px, z: pz, yaw });
        }
      }
    }
  }
  for (const row of TOWN.treeRows as P2[][]) {
    for (let i = 0; i < row.length - 1; i++) {
      const a = row[i], b = row[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = 0; s < L; s += 8) res.trees.push({ x: a[0] + ((b[0] - a[0]) * s) / L, z: a[1] + ((b[1] - a[1]) * s) / L, yaw: rnd() * 6 });
    }
  }
  // olive groves in rows on the outskirts, away from streets and houses
  for (let gx = -118; gx <= 118; gx++) {
    for (let gz = -118; gz <= 118; gz++) {
      const x = gx * 13 + (hash(gx * 7 + gz) - 0.5) * 2, z = gz * 13 + (hash(gz * 5 - gx) - 0.5) * 2; // wide Sahel spacing
      const r = Math.hypot(x, z);
      if (r < 950 || r > 1550) continue;
      const patch = hash(Math.floor(x / 90) * 7.7 + Math.floor(z / 90) * 3.1);
      if (patch < 0.35 || at(x, z)) continue;
      res.groves.push({ x, z, yaw: hash(gx * 13.1 + gz) * 6 });
    }
  }
  return res;
}
