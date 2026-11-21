/**
 * Shared builder for sites on real terrain (Sidi Bou Said, Carthage…), from scripts/make-village.mjs data:
 * - terrain: AWS Terrain Tiles (SRTM-based heights), with the shoreline from the OpenStreetMap coastline;
 * - streets, building footprints, gardens, cemeteries, pools, piers, open-air cafés: OpenStreetMap (ODbL);
 * - houses on mapped streets without mapped buildings are generated (dense in the old core, villas outside);
 * - lime-washed houses with blue doors, window cages and balconies, flat roofs, bougainvillea, pines, palms;
 * - night: lit windows, wall lanterns, pier lamps, a few warm lights, floodlit minaret, lighthouse beams.
 * Each site passes its data and hooks for its own landmarks. Scene frame: origin = site centre,
 * x = east, z = south, y = metres above sea level.
 */
import * as THREE from 'three';
import type { MatKey, Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { Collector, buildPalms } from '../el-jem/build';
import { buildCars, buildLamps, buildTrees, type Placement } from '../el-jem/city';
import { buildVegetation, type Spot } from '../el-jem/vegetation';
import { box, cylinder, hash } from '../el-jem/geometry';

type P2 = [number, number];
export type { P2 };
export interface Building { id: number; p: P2[]; k?: string; lv?: number; name?: string; holes?: P2[][] }
export interface Road { k: string; w: number; p: P2[]; s?: string; name?: string }
export interface Area { k: string; p: P2[]; name?: string }
export interface Pier { p: P2[]; area?: boolean; w?: number }
/** Output of scripts/make-village.mjs (src/content/<site>-town.json). */
export interface TownData {
  terrain: { half: number; cell: number; n: number; file: string };
  buildings: unknown[]; roads: unknown[]; areas: unknown[]; piers: unknown[];
}

/** What a site gives the builder. */
export interface TownConfig {
  data: TownData;
  /** Radius (m) of the old core around the origin: dense houses, cobbled lanes, lanterns. */
  core: number;
  spawn: { x: number; z: number };
  look: { x: number; z: number; h: number };
  /** Warm night lights: [x, z, height above ground, power, distance]. */
  lights?: [number, number, number, number, number][];
  /** Which mosques get a minaret (default: all but marabouts). */
  minaretFor?: (b: Building) => boolean;
  /** A mapped building the site builds itself; return true to skip the default house. */
  special?: (b: Building, kit: TownKit) => boolean;
  /** Site landmarks, built after the mapped buildings and before the generated houses. */
  extras?: (kit: TownKit) => void;
  /** Generate houses along mapped streets that have no mapped buildings (default true; off for archaeological sites). */
  fill?: boolean;
  /** The old town as a polygon (e.g. a walled medina) instead of the circle of radius `core` around the origin. */
  corePoly?: P2[];
  /** With corePoly: also fill the inside of the blocks with houses, aligned to this bearing (radians). */
  blockYaw?: number;
  /** Bougainvillea and flower pots along the streets (default 1). */
  flowers?: number;
  /**
   * Ground to level under big monuments: the free elevation data is a surface model and includes their roofs.
   * Each polygon is set to the lowest ground around it, blended out over `pad` metres (default 12).
   */
  flatten?: { p: P2[]; pad?: number; level?: 'low' | 'mean' }[];
  /** Coarser terrain mesh for flat sites: keep every Nth height sample (smoothed). Default 1. */
  terrainStep?: number;
  /** Blur the heights over about this many metres (box blur, twice) to drop stripes in the elevation data. */
  smooth?: number;
  /** Detailed garden trees only within this distance of the origin; lighter ones beyond (default: everywhere for villas, 300 m in parks). */
  treeR?: number;
  /** Density of the scrub and pines scattered on open ground (default 1). */
  scrub?: number;
  /** Force the inland horizon (terrain skirt, no sea) when low ground is still far from the coast (default: from the heights). */
  inland?: boolean;
  /** How often house roofs carry a small white dome (default 1 = 7 % of houses). */
  domes?: number;
  /**
   * Openings cut out of the terrain mesh (e.g. the courtyard pits of troglodyte houses and their sunken entrance
   * lanes), planned once the heights are loaded. The site builds what fills them; the ground meets their outline.
   */
  holes?: (groundAt: (x: number, z: number) => number) => P2[][];
  /** Colours of bare soil and of scrub on open ground (default a pale sandy soil and olive-green scrub). */
  palette?: { soil: string; scrub: string };
  /** Which roads are paved (default all but paths and tracks); the others are drawn as packed earth. */
  paved?: (r: Road) => boolean;
  /** Colours of the generated and mapped houses' walls and roofs (default lime-white). */
  houseColors?: { walls: string[]; roofs: string[] };
  /** A city around the old town: generated houses outside it are packed along the streets, 3 to 5 storeys, no gardens. */
  urban?: boolean;
  /** With blockYaw: pack the blocks tighter (smaller lots where a full one does not fit, and a second, offset pass). */
  packTight?: boolean;
}

const BASE = import.meta.env.BASE_URL;
let T: TownData['terrain'] = { half: 0, cell: 4, n: 0, file: '' };
let CORE = 330;               // radius of the old core (cobbled lanes, dense houses); set per site
let CORE_POLY: P2[] | null = null;
const isCore = (x: number, z: number) => (CORE_POLY ? inPoly(x, z, CORE_POLY) : Math.hypot(x, z) < CORE);

// ---------------------------------------------------------------------------
// terrain

// heights in decimetres; kept as floats once loaded, so smoothing and averaging leave no 10 cm terraces
// (on gentle slopes those show as contour-line stripes in the shading)
let H: Float32Array = new Float32Array(0);
const raw = (i: number, j: number) => H[Math.min(T.n - 1, Math.max(0, j)) * T.n + Math.min(T.n - 1, Math.max(0, i))] / 10;
/** Height above sea level (bilinear in the 4 m grid). Under the sea it is the (clamped) sea floor. */
export function groundAt(x: number, z: number) {
  const fx = (x + T.half) / T.cell, fz = (z + T.half) / T.cell;
  const i = Math.floor(fx), j = Math.floor(fz), ax = fx - i, az = fz - j;
  const h = raw(i, j) * (1 - ax) * (1 - az) + raw(i + 1, j) * ax * (1 - az) + raw(i, j + 1) * (1 - ax) * az + raw(i + 1, j + 1) * ax * az;
  return Math.max(h, -9);
}

// ---------------------------------------------------------------------------
// occupancy grid (1.5 m) for placing generated houses and props

const G = 1.5;
let GH = 0, GN = 0;
const ROAD = 1, BLD = 2, AREA = 4, PIER = 8, KEEP = 16;
let grid = new Uint8Array(0);
const cell = (x: number, z: number) => {
  const i = Math.floor((x + GH) / G), j = Math.floor((z + GH) / G);
  return i < 0 || j < 0 || i >= GN || j >= GN ? -1 : j * GN + i;
};
const at = (x: number, z: number) => { const c = cell(x, z); return c < 0 ? 0 : grid[c]; };
function markSeg(a: P2, b: P2, rad: number, bit: number) {
  const x0 = Math.min(a[0], b[0]) - rad, x1 = Math.max(a[0], b[0]) + rad, z0 = Math.min(a[1], b[1]) - rad, z1 = Math.max(a[1], b[1]) + rad;
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
  for (let z = Math.floor(z0 / G) * G + G / 2; z <= z1; z += G) for (let x = Math.floor(x0 / G) * G + G / 2; x <= x1; x += G) {
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
    if (Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) <= rad) { const c = cell(x, z); if (c >= 0) grid[c] |= bit; }
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
const bbox = (p: P2[]) => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { x0, x1, z0, z1 };
};
/** Bounding box clipped to the terrain (mapped areas such as a river can reach kilometres beyond it). */
const bboxIn = (p: P2[]) => { const b = bbox(p), h = GH; return { x0: Math.max(b.x0, -h), x1: Math.min(b.x1, h), z0: Math.max(b.z0, -h), z1: Math.min(b.z1, h) }; };
function markPoly(p: P2[], bit: number, pad = 0) {
  const b = bboxIn(p);
  for (let z = Math.floor((b.z0 - pad) / G) * G + G / 2; z <= b.z1 + pad; z += G) for (let x = Math.floor((b.x0 - pad) / G) * G + G / 2; x <= b.x1 + pad; x += G) {
    if (inPoly(x, z, p)) { const c = cell(x, z); if (c >= 0) grid[c] |= bit; }
  }
}
const signedArea = (p: P2[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const centroid = (p: P2[]): P2 => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];

// ---------------------------------------------------------------------------
// geometry helpers

function paint(g: THREE.BufferGeometry, col: THREE.Color) {
  const n = g.getAttribute('position').count, c = new Float32Array(n * 3);
  for (let j = 0; j < c.length; j += 3) { c[j] = col.r; c[j + 1] = col.g; c[j + 2] = col.b; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  return g;
}
/** Flat polygon at height y facing up, world-space UVs. */
function flat(p: P2[], y: number | ((x: number, z: number) => number)): THREE.BufferGeometry | null {
  const tris = THREE.ShapeUtils.triangulateShape(p.map(([x, z]) => new THREE.Vector2(x, z)), []);
  if (!tris.length) return null;
  const Y = typeof y === 'number' ? () => y : y;
  const pos: number[] = [], uv: number[] = [];
  for (const [a, b, c] of tris) {
    let A = p[a], B = p[b], C = p[c];
    if ((C[0] - A[0]) * (B[1] - A[1]) - (B[0] - A[0]) * (C[1] - A[1]) < 0) [B, C] = [C, B];
    for (const q of [A, B, C]) { pos.push(q[0], Y(q[0], q[1]), q[1]); uv.push(q[0], -q[1]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
/** Walls of a CCW footprint between y0 and y1, UVs in metres; v is measured from vBase (a height, or per wall). */
function walls(p: P2[], y0: number, y1: number, u0 = 0, vBase: number | ((a: P2, b: P2) => number) = y0, inward = false) {
  const pos: number[] = [], uv: number[] = [], nrm: number[] = [];
  let u = u0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.05) continue;
    let nx = dz / L, nz = -dx / L;
    const vb = typeof vBase === 'number' ? vBase : vBase(a, b);
    const quad: [P2, number, number][] = [[a, y0, u], [b, y0, u + L], [b, y1, u + L], [a, y1, u]];
    let order = [0, 2, 1, 0, 3, 2];
    if (inward) { nx = -nx; nz = -nz; order = [0, 1, 2, 0, 2, 3]; }
    for (const k of order) { const [q, y, uu] = quad[k]; pos.push(q[0], y, q[1]); uv.push(uu, y - vb); nrm.push(nx, 0, nz); }
    u += L;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  return g;
}
/** Ribbon draped on the terrain along a polyline (lanes, roads), with round joins. */
function drapedRibbon(p: P2[], w: number, lift: number) {
  const pos: number[] = [], uv: number[] = [];
  const r = w / 2;
  const push = (x: number, z: number) => { pos.push(x, groundAt(x, z) + lift, z); uv.push(x, -z); };
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i], b = p[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.05) continue;
    const nx = (-dz / L) * r, nz = (dx / L) * r;
    const n = Math.max(1, Math.ceil(L / 2.5));
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n;
      const x0 = a[0] + dx * t0, z0 = a[1] + dz * t0, x1 = a[0] + dx * t1, z1 = a[1] + dz * t1;
      // two triangles facing up
      push(x0 + nx, z0 + nz); push(x1 - nx, z1 - nz); push(x0 - nx, z0 - nz);
      push(x0 + nx, z0 + nz); push(x1 + nx, z1 + nz); push(x1 - nx, z1 - nz);
    }
  }
  for (const c of p) {
    const seg = 8;
    for (let k = 0; k < seg; k++) {
      const t0 = (k / seg) * Math.PI * 2, t1 = ((k + 1) / seg) * Math.PI * 2;
      push(c[0], c[1]); push(c[0] + Math.cos(t1) * r, c[1] + Math.sin(t1) * r); push(c[0] + Math.cos(t0) * r, c[1] + Math.sin(t0) * r);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

const ROOF = ['#f4f2ec', '#efede6', '#f2efe7', '#e9e6de'];
const WALL = ['#ffffff', '#fbfaf7', '#f7f6f1', '#fdfcf8', '#f3f2ee'];
const BLUE = new THREE.Color('#1d68b0');
const MAGENTA = ['#c2387a', '#d0508f', '#b52f6e', '#e06aa0'];

// ---------------------------------------------------------------------------

export async function buildTerrainTown(materials: Materials, site: SiteDef | undefined, cfg: TownConfig): Promise<BuildResult> {
  T = { ...cfg.data.terrain }; // (a copy: the step below must not change the shared data)
  CORE = cfg.core;
  CORE_POLY = cfg.corePoly ?? null;
  const FLOWERS = cfg.flowers ?? 1;
  GH = T.half; GN = Math.ceil((2 * GH) / G);
  grid = new Uint8Array(GN * GN);
  const res = await fetch(BASE + T.file);
  H = Float32Array.from(new Int16Array(await res.arrayBuffer()));
  if (cfg.smooth) {
    const n = T.n, r = Math.max(1, Math.round(cfg.smooth / T.cell / 2));
    let A = Float32Array.from(H), B = new Float32Array(n * n);
    for (let pass = 0; pass < 4; pass++) {          // x, z, x, z
      const alongX = pass % 2 === 0;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        let sum = 0, cnt = 0;
        for (let d = -r; d <= r; d++) {
          const ii = alongX ? i + d : i, jj = alongX ? j : j + d;
          if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue;
          sum += A[jj * n + ii]; cnt++;
        }
        B[j * n + i] = sum / cnt;
      }
      [A, B] = [B, A];
    }
    H = A;
  }
  const step = Math.max(1, Math.round(cfg.terrainStep ?? 1));
  if (step > 1) {
    // average each coarse sample over its neighbourhood: fewer triangles, and less noise from the elevation data
    const n0 = T.n, n1 = Math.floor((n0 - 1) / step) + 1, H1 = new Float32Array(n1 * n1), r = Math.floor(step / 2);
    for (let j = 0; j < n1; j++) for (let i = 0; i < n1; i++) {
      let sum = 0, cnt = 0;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        const jj = j * step + dj, ii = i * step + di;
        if (jj < 0 || ii < 0 || jj >= n0 || ii >= n0) continue;
        sum += H[jj * n0 + ii]; cnt++;
      }
      H1[j * n1 + i] = sum / cnt;
    }
    H = H1; T.n = n1; T.cell *= step;
  }
  for (const { p, pad = 12, level = 'low' } of cfg.flatten ?? []) {
    const segDist = (x: number, z: number) => {
      let d = Infinity;
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
        d = Math.min(d, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z));
      }
      return d;
    };
    // the lowest ground on a ring just outside the polygon
    let target = Infinity;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s2 = 0; s2 < L; s2 += 3) {
        const x = a[0] + ((b[0] - a[0]) * s2) / L, z = a[1] + ((b[1] - a[1]) * s2) / L;
        for (const [ox, oz] of [[pad, 0], [-pad, 0], [0, pad], [0, -pad]]) if (!inPoly(x + ox, z + oz, p)) target = Math.min(target, groundAt(x + ox, z + oz));
      }
    }
    if (level === 'mean') {
      // the mean ground inside (for a building on a hilltop, which should not sit in a dug-out hollow)
      const b0 = bbox(p); let sum = 0, cnt = 0;
      for (let z = b0.z0; z <= b0.z1; z += 2) for (let x = b0.x0; x <= b0.x1; x += 2) if (inPoly(x, z, p)) { sum += groundAt(x, z); cnt++; }
      if (cnt) target = sum / cnt;
    }
    if (!isFinite(target)) continue;
    const b = bbox(p);
    const i0 = Math.max(0, Math.floor((b.x0 - pad + T.half) / T.cell)), i1 = Math.min(T.n - 1, Math.ceil((b.x1 + pad + T.half) / T.cell));
    const j0 = Math.max(0, Math.floor((b.z0 - pad + T.half) / T.cell)), j1 = Math.min(T.n - 1, Math.ceil((b.z1 + pad + T.half) / T.cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = -T.half + i * T.cell, z = -T.half + j * T.cell;
      const d = inPoly(x, z, p) ? 0 : segDist(x, z);
      if (d > pad) continue;
      const t = d / pad, w = t * t * (3 - 2 * t), k = j * T.n + i;
      H[k] = (target + (H[k] / 10 - target) * w) * 10;
    }
  }
  const C = new Collector();
  let seed = 11;
  const rnd = () => hash(seed++ * 1.913);
  const buildings = cfg.data.buildings as Building[];
  const roads = cfg.data.roads as Road[];
  const areas = cfg.data.areas as Area[];
  const piers = cfg.data.piers as Pier[];
  const lanterns: Placement[] = [];
  let minaretAt: THREE.Vector3 | null = null, minaretH = 0, lighthouseAt: THREE.Vector3 | null = null;
  const props = { palms: [] as THREE.Vector3[], trees: [] as Placement[], groves: [] as Placement[], cars: [] as Placement[], lamps: [] as Placement[], shrubs: [] as Spot[], grass: [] as Spot[] };

  // ---- reserve ----
  // hotspot viewpoints stay open: no generated house or tree on them
  for (const hs of site?.hotspots ?? []) {
    const v = hs.view;
    if (hs.rooftop) continue;
    if (!Array.isArray(v) && 'x' in v) markSeg([v.x, v.z], [v.x, v.z], hs.fixedView ? 14 : 9, KEEP);
  }
  for (const r of roads) for (let i = 0; i < r.p.length - 1; i++) markSeg(r.p[i], r.p[i + 1], r.w / 2 + (r.w >= 5 ? 1 : 0.4), ROAD);
  for (const b of buildings) markPoly(b.p, BLD);
  for (const a of areas) if (a.k !== 'garden') markPoly(a.p, AREA);
  for (const p of piers) {
    if (p.area) markPoly(p.p, PIER);
    else for (let i = 0; i < p.p.length - 1; i++) markSeg(p.p[i], p.p[i + 1], (p.w ?? 4) / 2, PIER);
  }

  let minH = Infinity;
  for (let i = 0; i < H.length; i++) if (H[i] < minH) minH = H[i];
  const inland = cfg.inland ?? minH / 10 > 20; // no ground at sea level anywhere in the data

  // ---- terrain mesh, coloured by land cover ----
  const cover = new Uint8Array(T.n * T.n); // 0 soil/scrub, 1 garden, 2 wood, 3 cemetery, 4 beach, 5 parking, 6 pitch
  const coverOf: Record<string, number> = { garden: 1, wood: 2, cemetery: 3, beach: 4, parking: 5, pitch: 6, archaeology: 7, ruins: 7 };
  for (const a of areas) {
    const k = coverOf[a.k]; if (!k) continue;
    const b = bboxIn(a.p);
    for (let z = b.z0; z <= b.z1 + T.cell; z += T.cell) for (let x = b.x0; x <= b.x1 + T.cell; x += T.cell) {
      if (!inPoly(x, z, a.p)) continue;
      const i = Math.round((x + T.half) / T.cell), j = Math.round((z + T.half) / T.cell);
      if (i >= 0 && j >= 0 && i < T.n && j < T.n) cover[j * T.n + i] = k;
    }
  }
  // ---- holes: the grid cells each hole touches are taken out and re-triangulated around the hole outlines ----
  // (one patch per connected group of cells, so the triangles stay small and follow the ground)
  const holes = (cfg.holes?.(groundAt) ?? []).filter((h) => h.length >= 3);
  const patches: { loop: number[]; holes: P2[][] }[] = [];
  const cut = new Uint8Array(T.n * T.n); // quads (by their lower-left vertex) replaced by a patch
  {
    const n = T.n, nq = n - 1, Q = new Int32Array(nq * nq).fill(-1); // quad -> hole index
    const distTo = (x: number, z: number, h: P2[]) => {
      if (inPoly(x, z, h)) return 0;
      let d = Infinity;
      for (let i = 0; i < h.length; i++) {
        const a = h[i], b = h[(i + 1) % h.length], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
        d = Math.min(d, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z));
      }
      return d;
    };
    const reach = T.cell * 0.71 + 1.0;
    holes.forEach((h, hi) => {
      const b = bbox(h);
      const i0 = Math.floor((b.x0 - reach + T.half) / T.cell), i1 = Math.floor((b.x1 + reach + T.half) / T.cell);
      const j0 = Math.floor((b.z0 - reach + T.half) / T.cell), j1 = Math.floor((b.z1 + reach + T.half) / T.cell);
      if (i0 < 1 || j0 < 1 || i1 > nq - 2 || j1 > nq - 2) return; // at the edge of the data: skip
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        if (distTo(-T.half + (i + 0.5) * T.cell, -T.half + (j + 0.5) * T.cell, h) < reach) Q[j * nq + i] = Q[j * nq + i] >= 0 ? Q[j * nq + i] : hi;
      }
    });
    const on = (i: number, j: number) => i >= 0 && j >= 0 && i < nq && j < nq && Q[j * nq + i] >= 0;
    // no cells touching only at a corner, and no ground left enclosed: each group then has one simple outline
    for (let changed = true; changed;) {
      changed = false;
      for (let j = 0; j < nq - 1; j++) for (let i = 0; i < nq - 1; i++) {
        const a = on(i, j), b = on(i + 1, j), c = on(i, j + 1), d = on(i + 1, j + 1);
        if ((a && d && !b && !c) || (b && c && !a && !d)) {
          const fill = Q[j * nq + i] >= 0 ? Q[j * nq + i] : Q[j * nq + i + 1];
          for (const [ii, jj] of [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]]) if (!on(ii, jj)) Q[jj * nq + ii] = fill;
          changed = true;
        }
      }
      const outside = new Uint8Array(nq * nq), stack: number[] = [];
      for (let k = 0; k < nq; k++) for (const q of [k, (nq - 1) * nq + k, k * nq, k * nq + nq - 1]) if (Q[q] < 0 && !outside[q]) { outside[q] = 1; stack.push(q); }
      while (stack.length) {
        const q = stack.pop()!, i = q % nq, j = (q - i) / nq;
        for (const [ii, jj] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
          if (ii < 0 || jj < 0 || ii >= nq || jj >= nq) continue;
          const r = jj * nq + ii;
          if (Q[r] < 0 && !outside[r]) { outside[r] = 1; stack.push(r); }
        }
      }
      for (let q = 0; q < nq * nq; q++) if (Q[q] < 0 && !outside[q]) {
        Q[q] = [Q[q - 1], Q[q + 1], Q[q - nq], Q[q + nq]].find((v) => v !== undefined && v >= 0) ?? 0;
        changed = true;
      }
    }
    // connected groups of cells; the holes whose cells fall in each
    const comp = new Int32Array(nq * nq).fill(-1);
    const groups: number[][] = [];
    for (let q0 = 0; q0 < nq * nq; q0++) {
      if (Q[q0] < 0 || comp[q0] >= 0) continue;
      const g: number[] = [], stack = [q0];
      comp[q0] = groups.length;
      while (stack.length) {
        const q = stack.pop()!, i = q % nq, j = (q - i) / nq;
        g.push(q);
        for (const [ii, jj] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
          if (!on(ii, jj)) continue;
          const r = jj * nq + ii;
          if (comp[r] < 0) { comp[r] = groups.length; stack.push(r); }
        }
      }
      groups.push(g);
    }
    const holesOf: P2[][][] = groups.map(() => []);
    for (const h of holes) {
      const i = Math.floor((h[0][0] + T.half) / T.cell), j = Math.floor((h[0][1] + T.half) / T.cell);
      if (i < 0 || j < 0 || i >= nq || j >= nq || comp[j * nq + i] < 0) continue;
      holesOf[comp[j * nq + i]].push(h);
    }
    groups.forEach((g, gi) => {
      // boundary edges of the group, chained into its outline (grid vertex ids)
      const next = new Map<number, number>();
      for (const q of g) {
        const i = q % nq, j = (q - i) / nq, v00 = j * n + i, v10 = v00 + 1, v01 = v00 + n, v11 = v01 + 1;
        if (!(on(i, j - 1) && comp[(j - 1) * nq + i] === gi)) next.set(v00, v10);
        if (!(on(i + 1, j) && comp[j * nq + i + 1] === gi)) next.set(v10, v11);
        if (!(on(i, j + 1) && comp[(j + 1) * nq + i] === gi)) next.set(v11, v01);
        if (!(on(i - 1, j) && comp[j * nq + i - 1] === gi)) next.set(v01, v00);
      }
      const startV = next.keys().next().value as number;
      const loop: number[] = [startV];
      for (let v = next.get(startV)!; v !== startV && loop.length <= next.size; v = next.get(v)!) loop.push(v);
      if (loop.length !== next.size) return; // not one simple outline: keep the plain grid here
      for (const q of g) cut[(q - (q % nq)) / nq * n + (q % nq)] = 1;
      patches.push({ loop, holes: holesOf[gi] });
    });
  }
  let extraV = 0;
  for (const r of patches) for (const h of r.holes) extraV += h.length;
  {
    const n = T.n, NV = n * n + extraV, pos = new Float32Array(NV * 3), col = new Float32Array(NV * 3), uv = new Float32Array(NV * 2);
    const soil = new THREE.Color(cfg.palette?.soil ?? '#ddcca6'), scrub = new THREE.Color(cfg.palette?.scrub ?? '#a9ab78'), sand = new THREE.Color('#ecdcb8'), lane = new THREE.Color('#d9d1bf');
    const COV = [null, new THREE.Color('#8d9a5c'), new THREE.Color('#6f7f48'), new THREE.Color('#ddd3bd'), sand, new THREE.Color('#9c9a95'), new THREE.Color('#6f8f45'), new THREE.Color('#cdb88f')];
    const c = new THREE.Color();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = -T.half + i * T.cell, z = -T.half + j * T.cell, h = Math.max(raw(i, j), -9);
      const k = j * n + i;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      uv[k * 2] = x; uv[k * 2 + 1] = -z;
      const cov = cover[k];
      if (cov) c.copy(COV[cov]!);
      else if (h < 2.2) c.copy(sand);
      else {
        const veg = 0.5 + 0.5 * Math.sin(x * 0.021 + Math.sin(z * 0.017) * 2) * Math.cos(z * 0.019 - x * 0.007);
        c.copy(soil).lerp(scrub, Math.min(1, veg * 0.9));
        if (isCore(x, z)) c.copy(lane); // the old village is paved between the houses
      }
      const n2 = 0.92 + hash(i * 3.1 + j * 7.7) * 0.12;
      col[k * 3] = c.r * n2; col[k * 3 + 1] = c.g * n2; col[k * 3 + 2] = c.b * n2;
    }
    const idx: number[] = [];
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, d = a + n, e = d + 1;
      if (Math.max(pos[a * 3 + 1], pos[b * 3 + 1], pos[d * 3 + 1], pos[e * 3 + 1]) < -2) continue; // deep sea: hidden under the water
      if (cut[a]) continue;
      idx.push(a, d, b, b, d, e);
    }
    // each patch: its outline of grid vertices (shared with the mesh around it) with the holes in it
    let nv = n * n;
    for (const r of patches) {
      const outline = r.loop;
      const ids = [...outline];
      for (const h of r.holes) for (const [x, z] of h) {
        const ni = Math.min(n - 1, Math.max(0, Math.round((x + T.half) / T.cell))), nj = Math.min(n - 1, Math.max(0, Math.round((z + T.half) / T.cell)));
        pos[nv * 3] = x; pos[nv * 3 + 1] = groundAt(x, z); pos[nv * 3 + 2] = z;
        uv[nv * 2] = x; uv[nv * 2 + 1] = -z;
        for (let q = 0; q < 3; q++) col[nv * 3 + q] = col[(nj * n + ni) * 3 + q];
        ids.push(nv++);
      }
      const v2 = (k: number) => new THREE.Vector2(pos[k * 3], pos[k * 3 + 2]);
      const tris = THREE.ShapeUtils.triangulateShape(outline.map(v2), r.holes.map((h) => h.map(([x, z]) => new THREE.Vector2(x, z))));
      for (const [ta, tb, tc] of tris) {
        const A = ids[ta], B = ids[tb], Cc = ids[tc];
        const up = (pos[B * 3 + 2] - pos[A * 3 + 2]) * (pos[Cc * 3] - pos[A * 3]) - (pos[B * 3] - pos[A * 3]) * (pos[Cc * 3 + 2] - pos[A * 3 + 2]);
        if (up > 0) idx.push(A, B, Cc); else idx.push(A, Cc, B);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    C.add('terrain', g);

    // inland: no sea. A coarse skirt carries the edge of the terrain out to the horizon, easing towards
    // the mean edge height, so there is no cliff or false shoreline at the end of the data.
    if (inland) {
      const ring: number[] = [];
      for (let i = 0; i < n - 1; i++) ring.push(i);                       // north edge, west to east
      for (let j = 0; j < n - 1; j++) ring.push(j * n + n - 1);           // east edge
      for (let i = n - 1; i > 0; i--) ring.push((n - 1) * n + i);         // south edge
      for (let j = n - 1; j > 0; j--) ring.push(j * n);                   // west edge
      const step = 4, edge = ring.filter((_, q) => q % step === 0), B = edge.length;
      let mean = 0; for (const k of edge) mean += pos[k * 3 + 1]; mean /= B;
      const F = [1, 1.6, 2.6, 4.5, 8, 14], field = new THREE.Color('#9e9a6a');
      const sp = new Float32Array(B * F.length * 3), sc = new Float32Array(B * F.length * 3), su = new Float32Array(B * F.length * 2);
      edge.forEach((k, b) => {
        const x = pos[k * 3], h = pos[k * 3 + 1], z = pos[k * 3 + 2], m = Math.max(Math.abs(x), Math.abs(z));
        F.forEach((f, r) => {
          const t = Math.min(1, (f - 1) / 5), o = (r * B + b);
          const wave = r ? Math.sin(x * f * 0.0021 + z * f * 0.0013) * 18 * t : 0;
          sp[o * 3] = (x / m) * T.half * f; sp[o * 3 + 1] = h + (mean - h) * t + wave; sp[o * 3 + 2] = (z / m) * T.half * f;
          su[o * 2] = sp[o * 3]; su[o * 2 + 1] = -sp[o * 3 + 2];
          c.setRGB(col[k * 3], col[k * 3 + 1], col[k * 3 + 2]).lerp(field, t);
          sc[o * 3] = c.r; sc[o * 3 + 1] = c.g; sc[o * 3 + 2] = c.b;
        });
      });
      const si: number[] = [];
      for (let r = 0; r < F.length - 1; r++) for (let b = 0; b < B; b++) {
        const a = r * B + b, b2 = r * B + ((b + 1) % B), d = a + B, e = b2 + B;
        // keep the faces pointing up whatever the ring direction
        const ux = sp[b2 * 3] - sp[a * 3], uz = sp[b2 * 3 + 2] - sp[a * 3 + 2], vx = sp[d * 3] - sp[a * 3], vz = sp[d * 3 + 2] - sp[a * 3 + 2];
        if (uz * vx - ux * vz > 0) si.push(a, b2, d, b2, e, d); else si.push(a, d, b2, b2, d, e);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
      sg.setAttribute('uv', new THREE.BufferAttribute(su, 2));
      sg.setIndex(si);
      sg.computeVertexNormals();
      C.add('terrain', sg, undefined, false);
    }
  }

  // ---- sea (coastal sites only) ----
  if (!inland) {
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), materials.get('water') as THREE.MeshStandardMaterial);
    sea.position.y = 0;
    sea.receiveShadow = true;
    sea.name = 'sea';
    C.extra.push(sea);
  }

  // ---- lanes and roads ----
  for (const r of roads) {
    const mid = r.p[Math.floor(r.p.length / 2)];
    const inCore = isCore(mid[0], mid[1]);
    const cobbled = r.s === 'sett' || r.s === 'paving_stones' || r.s === 'cobblestone' || ((r.k === 'pedestrian' || r.k === 'footway' || r.k === 'steps') && inCore) || (r.k === 'residential' && inCore);
    const lift = r.w >= 7 ? 0.1 : 0.08;
    const paved = cfg.paved ? cfg.paved(r) : !(r.k === 'path' || r.k === 'track');
    C.add(cobbled ? 'paving' : paved ? 'asphalt' : 'ground', drapedRibbon(r.p, r.w, lift), undefined, false);
  }

  // ---- marina piers and boats ----
  const boats: { x: number; z: number; yaw: number; len: number }[] = [];
  for (const p of piers) {
    if (p.area) {
      const top = flat(p.p, 1.2); if (top) C.add('paving', top);
      C.add('block', walls(p.p, -1.5, 1.2, 0));
      continue;
    }
    const w = p.w ?? 4;
    for (let i = 0; i < p.p.length - 1; i++) {
      const a = p.p[i], b = p.p[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 0.5) continue;
      const m = new THREE.Matrix4().makeRotationY(-Math.atan2(dz, dx)).setPosition((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
      C.add('paving', box(L + w, 0.5, w, 0, 0.95, 0), m);
      C.add('block', box(L + w, 2, w - 0.1, 0, -0.3, 0), m, false);
      // lamp posts along the pier
      for (let s = 4; s < L; s += 16) props.lamps.push({ x: a[0] + (dx / L) * s - (dz / L) * (w / 2 - 0.4), y: 1.2, z: a[1] + (dz / L) * s + (dx / L) * (w / 2 - 0.4), yaw: -Math.atan2(dz, dx) + Math.PI / 2 });
      // boats moored along both sides
      for (let s = 3; s < L - 3; s += 4.2) {
        for (const side of [1, -1]) {
          if (rnd() > 0.62) continue;
          const len = 6 + rnd() * 5;
          const ox = (-dz / L) * side * (w / 2 + 1.6 + len * 0.0), oz = (dx / L) * side * (w / 2 + 1.6);
          boats.push({ x: a[0] + (dx / L) * s + ox, z: a[1] + (dz / L) * s + oz, yaw: -Math.atan2(dz, dx) + Math.PI / 2 + (rnd() - 0.5) * 0.08, len });
        }
      }
    }
  }
  C.extra.push(buildBoats(boats));

  // ---- buildings ----
  const roadNear = (x: number, z: number) => (at(x, z) & ROAD) !== 0;
  function footprintGround(p: P2[]) {
    let lo = Infinity, hi = -Infinity;
    const c = centroid(p);
    for (const q of [...p, c]) { const h = groundAt(q[0], q[1]); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    return { lo, hi };
  }
  function house(p: P2[], id: number, opts: { lv?: number; h?: number; white?: boolean; kind?: string } = {}) {
    const c = centroid(p), r = Math.hypot(...c);
    const { lo, hi } = footprintGround(p);
    if (hi < 0.3) return; // in the sea
    const core = isCore(c[0], c[1]);
    const near = r < 520 || core;
    const far = near ? '' : 'Far';
    const hs = hash(id * 0.731 + 0.17);
    const storeys = opts.lv ?? (core ? (hs < 0.45 ? 1 : 2) : cfg.urban ? 3 + Math.floor(hs * 2.99) : hs < 0.6 ? 1 : 2);
    const top = hi + (opts.h ?? storeys * 3.2 + 0.4 + hash(id * 1.31) * 0.3);
    const base = lo - 0.6;
    const WALLS = cfg.houseColors?.walls ?? WALL, ROOFS = cfg.houseColors?.roofs ?? ROOF;
    const wallCol = new THREE.Color(WALLS[Math.floor(hash(id * 2.17) * WALLS.length)]);
    const parapet = 0.6;
    // each wall's doors sit on the ground in front of that wall
    const streetLevel = (a: P2, e: P2) => { const L = Math.hypot(e[0] - a[0], e[1] - a[1]) || 1; return Math.min(top - 2.6, groundAt((a[0] + e[0]) / 2 + ((e[1] - a[1]) / L) * 1.2, (a[1] + e[1]) / 2 - ((e[0] - a[0]) / L) * 1.2)); };
    C.add(`whitewash${far}` as MatKey, paint(walls(p, base, top + parapet, hash(id * 5.1) * 9, streetLevel), wallCol), undefined, near);
    const roof = flat(p, top);
    if (roof) C.add(`roof${far}` as MatKey, paint(roof, new THREE.Color(ROOFS[Math.floor(hash(id * 3.7) * ROOFS.length)])), undefined, near);
    if (near) C.add('roof', paint(walls(p, top, top + parapet, 0, top, true), wallCol.clone().multiplyScalar(0.96)), undefined, false);
    if (!near) return;
    const b = bbox(p), w = b.x1 - b.x0, d = b.z1 - b.z0;
    // a small white dome on some roofs
    if (rnd() < 0.07 * (cfg.domes ?? 1) && w > 6 && d > 6 && inPoly(c[0], c[1], p)) {
      const rd = Math.min(w, d) * 0.18;
      C.add('roof', paint(cylinder(rd, rd, 0.6, 16, top).translate(c[0], 0, c[1]), WHITE), undefined, false);
      C.add('roof', paint(new THREE.SphereGeometry(rd, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(c[0], top + 0.6, c[1]), WHITE), undefined, false);
    }
    // street fronts: blue wooden balconies, bougainvillea, blue railings on roof terraces
    for (let i = 0; i < p.length; i++) {
      const a = p[i], e = p[(i + 1) % p.length], dx = e[0] - a[0], dz = e[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 3.5) continue;
      const nx = dz / L, nz = -dx / L, mx = (a[0] + e[0]) / 2, mz = (a[1] + e[1]) / 2;
      if (!roadNear(mx + nx * 2.5, mz + nz * 2.5)) continue;
      const gy = groundAt(mx + nx * 1.5, mz + nz * 1.5);
      const rot = new THREE.Matrix4().makeRotationY(-Math.atan2(dz, dx));
      if (storeys >= 2 && rnd() < (core ? 0.35 : 0.15) && top - gy > 5.5) {
        // enclosed blue balcony (moucharabieh) on brackets
        const off = (rnd() - 0.5) * (L - 3);
        const m = rot.clone().setPosition(mx + (dx / L) * off + nx * 0.45, gy + 3.9, mz + (dz / L) * off + nz * 0.45);
        C.add('roof', paint(box(1.7, 1.9, 0.75, 0, 0, 0), BLUE), m, false);
        C.add('roof', paint(box(1.9, 0.18, 0.95, 0, 1.0, 0), new THREE.Color('#164f87')), m, false);
        C.add('roof', paint(box(1.9, 0.14, 0.95, 0, -0.99, 0), new THREE.Color('#164f87')), m, false);
      }
      if (rnd() < (core ? 0.3 : 0.18) * FLOWERS) {
        const off = (rnd() - 0.5) * (L - 1);
        const sx = mx + (dx / L) * off + nx * 0.9, sz = mz + (dz / L) * off + nz * 0.9;
        props.shrubs.push({ x: sx, y: groundAt(sx, sz), z: sz, scale: 1.6 + rnd() * 1.4, color: MAGENTA[Math.floor(rnd() * MAGENTA.length)] });
      }
      // wall lanterns along the lanes of the old village
      if (core && rnd() < 0.22 && top - gy > 3.4) {
        const off = (rnd() - 0.5) * (L - 1.5);
        lanterns.push({ x: mx + (dx / L) * off + nx * 0.2, y: gy + 2.85, z: mz + (dz / L) * off + nz * 0.2, yaw: -Math.atan2(dz, dx) });
      }
    }
  }

  const WHITE = new THREE.Color('#fbfaf6');
  function minaret(p: P2[], id: number) {
    const c = centroid(p);
    let far = p[0];
    for (const v of p) if (Math.hypot(v[0] - c[0], v[1] - c[1]) > Math.hypot(far[0] - c[0], far[1] - c[1])) far = v;
    const mx = far[0] + (c[0] - far[0]) * 0.22, mz = far[1] + (c[1] - far[1]) * 0.22;
    const g0 = groundAt(mx, mz) - 0.5, mh = 17 + hash(id) * 2;
    minaretAt = new THREE.Vector3(mx, g0, mz); minaretH = mh;
    C.add('whitewash', paint(box(3.0, mh, 3.0, mx, g0 + mh / 2, mz), WHITE));
    C.add('roof', paint(box(3.6, 0.45, 3.6, mx, g0 + mh + 0.22, mz), WHITE), undefined, false);
    // lantern with dark arched openings, green-tiled cap and the crescent finial
    C.add('roof', paint(box(2.3, 2.6, 2.3, mx, g0 + mh + 1.75, mz), WHITE), undefined, false);
    for (const [ox, oz] of [[1.16, 0], [-1.16, 0], [0, 1.16], [0, -1.16]]) C.add('roof', paint(box(ox ? 0.04 : 1.0, 1.5, oz ? 0.04 : 1.0, mx + ox, g0 + mh + 1.9, mz + oz), new THREE.Color('#2b2f33')), undefined, false);
    C.add('roof', paint(box(2.7, 0.3, 2.7, mx, g0 + mh + 3.15, mz), WHITE), undefined, false);
    C.add('roof', paint(new THREE.ConeGeometry(1.7, 1.6, 4).rotateY(Math.PI / 4).translate(mx, g0 + mh + 4.1, mz), new THREE.Color('#3f7a52')), undefined, false);
    C.add('townSteel', cylinder(0.05, 0.05, 1.4, 6, g0 + mh + 4.8).translate(mx, 0, mz), undefined, false);
  }

  const kit: TownKit = {
    C, materials, rnd, props, buildings, roads, areas, WHITE,
    groundAt, at, markPoly, markSeg, inPoly, bbox, centroid, signedArea, paint, flat, walls, footprintGround, house,
    flags: { ROAD, BLD, AREA, PIER, KEEP },
  };

  let fid = 1;
  for (const b of buildings) {
    const id = b.id ?? fid++;
    const p = b.p;
    if (signedArea(p) <= 0) p.reverse();
    const c = centroid(p);
    if (cfg.special?.(b, kit)) continue;   // site-specific buildings first (e.g. a historic tower mapped as a lighthouse)
    if (b.k === 'lighthouse') {
      // as in photos: a short white tower with a black band and gallery, on a stone-walled base among the pines
      const { lo, hi } = footprintGround(p);
      const base = hi + 4.5, rad = 2.1;
      C.add('block', walls(p, lo - 0.5, base, 0));
      { const top = flat(p, base); if (top) C.add('roof', paint(top, new THREE.Color('#e9e4d8'))); }
      C.add('whitewash', paint(cylinder(rad, rad * 1.05, 4.2, 20, base).translate(c[0], 0, c[1]), WHITE));
      C.add('roof', paint(cylinder(rad * 1.02, rad * 1.02, 0.9, 20, base + 3.0).translate(c[0], 0, c[1]), new THREE.Color('#1c1f22')), undefined, false);
      C.add('roof', paint(cylinder(rad * 1.35, rad * 1.35, 0.25, 20, base + 4.2).translate(c[0], 0, c[1]), new THREE.Color('#1c1f22')), undefined, false);
      lighthouseAt = new THREE.Vector3(c[0], base + 5.2, c[1]); // lantern, lit at night (below)
      C.add('roof', paint(new THREE.SphereGeometry(rad * 0.66, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(c[0], base + 5.95, c[1]), new THREE.Color('#1c1f22')), undefined, false);
      continue;
    }
    if (b.k === 'palace') {
      // Ennejma Ezzahra: white palace with green-tiled pyramid roofs over its main halls
      house(p, id, { lv: 2, h: 8.5 });
      const { hi } = footprintGround(p);
      for (let k = 0; k < 3; k++) {
        const q: P2 = [c[0] + (hash(id + k) - 0.5) * 14, c[1] + (hash(id * 2 + k) - 0.5) * 14];
        if (!inPoly(q[0], q[1], p)) continue;
        C.add('roof', paint(new THREE.ConeGeometry(3.6, 2.6, 4).rotateY(Math.PI / 4).translate(q[0], hi + 8.9 + 1.3, q[1]), new THREE.Color('#3d7f5a')), undefined, false);
      }
      continue;
    }
    house(p, id, { lv: b.lv, h: b.k === 'mosque' ? 6.5 : undefined });
    const marabout = /Marabout|Ghimrini|zaou/i.test(b.name || '');
    if (b.k === 'mosque' && !marabout && (cfg.minaretFor?.(b) ?? true)) minaret(p, id);
    if (b.k === 'mosque' && marabout) {
      const { hi } = footprintGround(p);
      C.add('roof', paint(new THREE.SphereGeometry(2.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(c[0], hi + 4.2, c[1]), WHITE), undefined, false);
    }
  }

  // ---- open-air cafés: white terraces stepping down the slope (the Café des Délices above the marina) ----
  const STRIPES = [new THREE.Color('#1d68b0'), new THREE.Color('#f7f6f2')];
  function terraces(p: P2[]) {
    if (signedArea(p) <= 0) p.reverse();
    // downhill direction across the café, from its highest to its lowest corner
    let hiP = p[0], loP = p[0];
    for (const v of p) { if (groundAt(v[0], v[1]) > groundAt(hiP[0], hiP[1])) hiP = v; if (groundAt(v[0], v[1]) < groundAt(loP[0], loP[1])) loP = v; }
    const drop = groundAt(hiP[0], hiP[1]) - groundAt(loP[0], loP[1]);
    let dx = loP[0] - hiP[0], dz = loP[1] - hiP[1];
    const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    const sOf = (q: P2) => q[0] * dx + q[1] * dz;
    const sMin = Math.min(...p.map(sOf)), sMax = Math.max(...p.map(sOf));
    const K = Math.max(2, Math.min(5, Math.round(drop / 1.5)));
    const band = (sMax - sMin) / K;
    // keep the part of a polygon with lo <= s <= hi (two half-plane clips)
    const clip = (poly: P2[], keep: (q: P2) => number) => {
      const out: P2[] = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], fa = keep(a), fb = keep(b);
        if (fa >= 0) out.push(a);
        if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      }
      return out;
    };
    const white = new THREE.Color('#f6f5f0'), floorCol = new THREE.Color('#ebe7dd'), cap = new THREE.Color('#1d68b0');
    let prevY = Infinity;
    for (let k = 0; k < K; k++) {
      const a = sMin + k * band, b = a + band;
      const poly = clip(clip(p, (q) => sOf(q) - a + 1e-6), (q) => b - sOf(q) + 1e-6);
      if (poly.length < 3) continue;
      const hiG = Math.max(...poly.map(([x, z]) => groundAt(x, z)));
      const loG = Math.min(...poly.map(([x, z]) => groundAt(x, z)));
      const y = Math.min(prevY - 1.1, hiG + 0.15);
      // floor and retaining walls (plain lime-wash, no doors)
      const floor = flat(poly, y); if (floor) C.add('roof', paint(floor, floorCol));
      C.add('roof', paint(walls(poly, loG - 1, y, 0), white));
      // parapets with a blue cap along the café walls and the drop to the next level; a gap for the steps
      const stairEdge = { len: 0, a: [0, 0] as P2, b: [0, 0] as P2 };
      for (let i = 0; i < poly.length; i++) {
        const e0 = poly[i], e1 = poly[(i + 1) % poly.length];
        const s0 = sOf(e0), s1 = sOf(e1);
        if (Math.abs(s0 - a) < 0.05 && Math.abs(s1 - a) < 0.05) continue; // uphill cut: the level above's drop
        const L = Math.hypot(e1[0] - e0[0], e1[1] - e0[1]);
        if (L < 0.5) continue;
        const downCut = Math.abs(s0 - b) < 0.05 && Math.abs(s1 - b) < 0.05 && k < K - 1;
        let from = 0;
        if (downCut && L > 4) { from = 2.2; if (L > stairEdge.len) Object.assign(stairEdge, { len: L, a: e0, b: e1 }); }
        const ux = (e1[0] - e0[0]) / L, uz = (e1[1] - e0[1]) / L, len = L - from;
        const m = new THREE.Matrix4().makeRotationY(-Math.atan2(uz, ux)).setPosition(e0[0] + ux * (from + len / 2), y, e0[1] + uz * (from + len / 2));
        C.add('roof', paint(box(len, 0.85, 0.32, 0, 0.425, 0), white), m);
        C.add('roof', paint(box(len, 0.07, 0.38, 0, 0.885, 0), cap), m, false);
        // blue-and-white striped benches along the inside of the parapet
        if (rnd() < 0.8) for (let s = 0.3; s < len - 0.6; s += 0.62) {
          const mb = new THREE.Matrix4().makeRotationY(-Math.atan2(uz, ux)).setPosition(e0[0] + ux * (from + s + 0.3) - uz * 0.45, y, e0[1] + uz * (from + s + 0.3) + ux * 0.45);
          C.add('roof', paint(box(0.6, 0.42, 0.5, 0, 0.21, 0), STRIPES[Math.floor(s / 0.62) % 2]), mb, false);
        }
      }
      // steps down to the next level through the gap
      if (stairEdge.len > 0) {
        const nextY = Math.max(y - 1.6, groundAt(stairEdge.a[0], stairEdge.a[1]) - 1);
        const n = Math.max(3, Math.ceil((y - nextY) / 0.2)), rise = (y - nextY) / n;
        const L = stairEdge.len, ux = (stairEdge.b[0] - stairEdge.a[0]) / L, uz = (stairEdge.b[1] - stairEdge.a[1]) / L;
        const cx = stairEdge.a[0] + ux * 1.1, cz = stairEdge.a[1] + uz * 1.1;
        for (let i = 0; i < n; i++) {
          const top = y - (i + 1) * rise;
          const m = new THREE.Matrix4().makeRotationY(-Math.atan2(dz, dx)).setPosition(cx + dx * (0.15 + i * 0.3), 0, cz + dz * (0.15 + i * 0.3));
          C.add('roof', paint(box(0.32, top - nextY + 0.6, 1.8, 0, nextY - 0.6 + (top - nextY + 0.6) / 2, 0), i % 2 ? white : floorCol), m);
        }
      }
      // tables, chairs and blue umbrellas
      const bb = bbox(poly);
      for (let z = bb.z0 + 2; z < bb.z1 - 1; z += 3.4) for (let x = bb.x0 + 2; x < bb.x1 - 1; x += 3.4) {
        const tx = x + (rnd() - 0.5) * 0.8, tz = z + (rnd() - 0.5) * 0.8;
        if (!inPoly(tx, tz, poly) || at(tx, tz) & BLD) continue;
        if ([[1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4]].some(([ox, oz]) => !inPoly(tx + ox, tz + oz, poly))) continue;
        C.add('roof', paint(cylinder(0.38, 0.38, 0.05, 12, y + 0.72).translate(tx, 0, tz), white), undefined, false);
        C.add('townSteel', cylinder(0.04, 0.05, 0.72, 6, y).translate(tx, 0, tz), undefined, false);
        for (const [ox, oz] of [[0.7, 0], [-0.7, 0]]) {
          C.add('roof', paint(box(0.42, 0.45, 0.42, tx + ox, y + 0.225, tz + oz), cap), undefined, false);
          C.add('roof', paint(box(0.06, 0.45, 0.42, tx + ox * 1.3, y + 0.67, tz + oz), cap), undefined, false);
        }
        if (rnd() < 0.7) {
          C.add('townSteel', cylinder(0.03, 0.03, 2.3, 6, y).translate(tx, 0, tz), undefined, false);
          C.add('roof', paint(new THREE.ConeGeometry(1.35, 0.5, 8).translate(tx, y + 2.45, tz), rnd() < 0.75 ? cap : white), undefined, false);
        } else if (rnd() < 0.4) props.palms.push(new THREE.Vector3(tx, y, tz));
      }
      prevY = y;
    }
    // the café's little white domed pavilion
    for (const bld of buildings) {
      const c = centroid(bld.p);
      if (!inPoly(c[0], c[1], p)) continue;
      const { hi } = footprintGround(bld.p);
      C.add('roof', paint(new THREE.SphereGeometry(2.2, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2).translate(c[0], hi + 3.7, c[1]), WHITE), undefined, false);
      C.add('roof', paint(cylinder(2.2, 2.2, 0.5, 18, hi + 3.2).translate(c[0], 0, c[1]), WHITE), undefined, false);
    }
    markPoly(p, KEEP);
  }
  for (const a of areas) if (a.k === 'terrace') terraces(a.p);

  cfg.extras?.(kit);

  // ---- generated houses along mapped streets without mapped buildings ----
  const FILL = new Set(['residential', 'unclassified', 'tertiary', 'service', 'pedestrian', 'living_street', 'secondary']);
  const density = (x: number, z: number) => (isCore(x, z) ? 0.9 : cfg.urban ? 0.8 : Math.hypot(x, z) < 600 ? 0.55 : 0.35);
  const lotFree = (q: P2[]) => {
    const b = bbox(q);
    for (let z = b.z0 + 0.4; z <= b.z1 - 0.4; z += 1.2) for (let x = b.x0 + 0.4; x <= b.x1 - 0.4; x += 1.2) {
      if (!inPoly(x, z, q)) continue;
      const c = cell(x, z);
      if (c < 0 || grid[c] || groundAt(x, z) < 1.2) return false;
    }
    return true;
  };
  const lot = (cx: number, cz: number, ux: number, uz: number, front: number, depth: number): P2[] => {
    const vx = -uz, vz = ux, hf = front / 2, hd = depth / 2;
    const q: P2[] = [[cx - ux * hf - vx * hd, cz - uz * hf - vz * hd], [cx + ux * hf - vx * hd, cz + uz * hf - vz * hd], [cx + ux * hf + vx * hd, cz + uz * hf + vz * hd], [cx - ux * hf + vx * hd, cz - uz * hf + vz * hd]];
    return signedArea(q) < 0 ? q.reverse() : q;
  };
  let lots = 0;
  for (const road of roads) {
    if (cfg.fill === false || !FILL.has(road.k)) continue;
    const cum = [0];
    for (let i = 1; i < road.p.length; i++) cum.push(cum[i - 1] + Math.hypot(road.p[i][0] - road.p[i - 1][0], road.p[i][1] - road.p[i - 1][1]));
    const total = cum[cum.length - 1];
    if (total < 6) continue;
    const along = (s: number) => {
      let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      const a = road.p[i - 1], b = road.p[i], L = cum[i] - cum[i - 1] || 1e-6, f = (s - cum[i - 1]) / L;
      return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, ux: (b[0] - a[0]) / L, uz: (b[1] - a[1]) / L };
    };
    for (const side of [1, -1]) {
      let s = 1 + rnd() * 3;
      while (s < total - 3) {
        const core = isCore(along(s).x, along(s).z) || !!cfg.urban; // (a city: packed wall to wall like the old core)
        const front = core ? 6 + rnd() * 6 : 9 + rnd() * 8, depth = core ? 8 + rnd() * 6 : 9 + rnd() * 7;
        const mid = along(s + front / 2);
        const nx = -mid.uz * side, nz = mid.ux * side;
        const off = road.w / 2 + (core ? 0.4 : 3 + rnd() * 5) + depth / 2;
        const cx = mid.x + nx * off, cz = mid.z + nz * off;
        s += front + (core ? 0.15 : 4 + rnd() * 10);
        if (rnd() > density(cx, cz)) continue;
        let q = lot(cx, cz, mid.ux, mid.uz, front, depth);
        if (cfg.packTight && core) {
          // packed: run deep (courtyard houses back to back), shortening the lot until it fits
          q = [];
          for (const dd of [20, 15, 11, 8, 5.5]) {
            const o2 = road.w / 2 + 0.4 + dd / 2, t = lot(mid.x + nx * o2, mid.z + nz * o2, mid.ux, mid.uz, front, dd);
            if (lotFree(t)) { q = t; break; }
          }
          if (!q.length) continue;
        } else if (!lotFree(q)) continue;
        markPoly(q, BLD, core ? (cfg.packTight ? 0.1 : 0.3) : 2);
        house(q, 500000 + lots++);
        // villas outside the old village: a garden with a palm or a pine
        if (!core && rnd() < 0.55) {
          const gx = cx + nx * (depth / 2 + 3), gz = cz + nz * (depth / 2 + 3);
          if (!(at(gx, gz) & (BLD | ROAD))) (rnd() < 0.5 ? props.palms.push(new THREE.Vector3(gx, groundAt(gx, gz), gz)) : (Math.hypot(gx, gz) < (cfg.treeR ?? Infinity) ? props.trees : props.groves).push({ x: gx, z: gz, y: groundAt(gx, gz), yaw: rnd() * 6 }));
        }
      }
    }
  }

  // ---- inside the blocks of a walled medina: courtyard houses packed wall to wall ----
  if (CORE_POLY && cfg.blockYaw !== undefined && cfg.fill !== false) {
    const ux = Math.cos(cfg.blockYaw), uz = Math.sin(cfg.blockYaw), b = bbox(CORE_POLY);
    const cx0 = (b.x0 + b.x1) / 2, cz0 = (b.z0 + b.z1) / 2, R = Math.hypot(b.x1 - b.x0, b.z1 - b.z0) / 2;
    for (let v = -R; v < R; v += 11) for (let u = -R; u < R; u += 11) {
      const f0 = 8 + rnd() * 3, d0 = 8 + rnd() * 3;
      const front = cfg.packTight ? 10.9 : f0, depth = cfg.packTight ? 10.9 : d0;   // (packed: wall to wall)
      const cx = cx0 + ux * u - uz * v, cz = cz0 + uz * u + ux * v;
      if (!isCore(cx, cz)) continue;
      let q = lot(cx, cz, ux, uz, front, depth);
      if (!lotFree(q)) {
        if (!cfg.packTight) continue;
        q = lot(cx, cz, ux, uz, front * 0.62, depth * 0.62);
        if (!lotFree(q)) continue;
      }
      markPoly(q, BLD, cfg.packTight ? 0 : 0.2);
      house(q, 500000 + lots++);
    }
    // the gaps left between the lanes' houses and the blocks: small houses on a grid offset by half a lot
    if (cfg.packTight) for (let v = -R + 5.5; v < R; v += 5.5) for (let u = -R + 5.5; u < R; u += 5.5) {
      const cx = cx0 + ux * u - uz * v, cz = cz0 + uz * u + ux * v;
      if (!isCore(cx, cz)) continue;
      const q = lot(cx, cz, ux, uz, 5.2, 5.2);
      if (!lotFree(q)) continue;
      markPoly(q, BLD, 0.2);
      house(q, 500000 + lots++);
    }
  }

  // ---- vegetation on the open slopes, gardens, cemetery tombs ----
  for (const a of areas) {
    const b = bboxIn(a.p);
    if (a.k === 'garden' || a.k === 'wood') {
      const step = a.k === 'wood' ? 7 : 11;
      // palms only in small gardens; parks and woods on the slopes are Aleppo pines
      const smallGarden = a.k === 'garden' && (b.x1 - b.x0) * (b.z1 - b.z0) < 2500;
      for (let z = b.z0 + 3; z < b.z1; z += step) for (let x = b.x0 + 3; x < b.x1; x += step) {
        const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 4;
        if (!inPoly(px, pz, a.p) || at(px, pz) & (BLD | KEEP)) continue;
        const y = groundAt(px, pz);
        if (y < 0.5) continue;
        const rr = Math.hypot(px, pz);
        if (smallGarden && rr < 500 && rnd() < 0.3) props.palms.push(new THREE.Vector3(px, y, pz));
        else (rr < Math.min(300, cfg.treeR ?? 300) ? props.trees : props.groves).push({ x: px, z: pz, y, yaw: rnd() * 6 });
      }
    } else if (a.k === 'cemetery') {
      // big cemeteries get fewer, more spaced tombs (about 3,000 at most per cemetery)
      const f = Math.max(1, Math.sqrt((Math.abs(signedArea(a.p)) / (1.5 * 2.4)) * 0.6 / 3000));
      for (let z = b.z0 + 1.5; z < b.z1; z += 2.4 * f) for (let x = b.x0 + 1.5; x < b.x1; x += 1.5 * f) {
        if (!inPoly(x, z, a.p) || rnd() < 0.4 || at(x, z) & (KEEP | ROAD | BLD)) continue;
        const y = groundAt(x, z);
        C.add('roof', paint(box(0.7, 0.4 + rnd() * 0.3, 1.8, x, y + 0.15, z), WHITE), undefined, false);
      }
    } else if (a.k === 'pool') {
      const lo = Math.min(...a.p.map(([x, z]) => groundAt(x, z)));
      const g = flat(a.p, lo + 0.05);
      if (g) { const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#4fb3d1', roughness: 0.1 })); C.extra.push(m); }
    }
  }
  // Aleppo pines and scrub scattered on the hillside outside the village
  for (let z = -T.half + 6; z < T.half; z += 13) for (let x = -T.half + 6; x < T.half; x += 13) {
    const px = x + (hash(x * 0.37 + z) - 0.5) * 10, pz = z + (hash(z * 0.53 - x) - 0.5) * 10;
    const r = Math.hypot(px, pz), y = groundAt(px, pz);
    if (y < 3 || at(px, pz) || r < 120) continue; // (KEEP keeps viewpoints clear)
    const patch = 0.5 + 0.5 * Math.sin(px * 0.021 + Math.sin(pz * 0.017) * 2) * Math.cos(pz * 0.019 - px * 0.007);
    if (hash(px * 1.7 + pz * 0.3) > patch * 0.75 * (cfg.scrub ?? 1)) continue;
    props.groves.push({ x: px, z: pz, y, yaw: hash(px) * 6 }); // light model: pines and scrub seen from afar
  }
  // palms along the road down to the marina and by the beach
  for (const r of roads) {
    if (r.k !== 'secondary' && r.k !== 'tertiary') continue;
    for (let i = 0; i < r.p.length - 1; i++) {
      const a = r.p[i], b = r.p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = 6; s < L; s += 22) {
        const x = a[0] + ((b[0] - a[0]) * s) / L, z = a[1] + ((b[1] - a[1]) * s) / L, y = groundAt(x, z);
        if (y > 25 || y < 0.8 || Math.hypot(x, z) > 700) continue;
        const nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, o = r.w / 2 + 1.2;
        if (!(at(x + nx * o, z + nz * o) & BLD)) props.palms.push(new THREE.Vector3(x + nx * o, groundAt(x + nx * o, z + nz * o), z + nz * o));
        if (Math.hypot(x, z) < 650 && hash(x + z) < 0.35) props.cars.push({ x: x - nx * (r.w / 2 - 1.1), z: z - nz * (r.w / 2 - 1.1), y: groundAt(x, z) + 0.05, yaw: -Math.atan2(b[1] - a[1], b[0] - a[0]) });
      }
    }
  }

  const palms = buildPalms(materials, props.palms); palms.name = 'palms'; C.extra.push(palms);
  C.extra.push(buildVegetation(props.grass, props.shrubs, []));
  const lamps = buildLamps(props.lamps);
  const cars = buildCars(props.cars), trees = buildTrees(props.trees, props.groves);
  cars.name = 'cars'; lamps.group.name = 'lamps'; trees.name = 'trees';
  C.extra.push(cars, lamps.group, trees);

  const { group, collider, townCollider } = C.finish(materials);

  const spawn = new THREE.Vector3(cfg.spawn.x, groundAt(cfg.spawn.x, cfg.spawn.z), cfg.spawn.z);
  const look = new THREE.Vector3(cfg.look.x, groundAt(cfg.look.x, cfg.look.z) + cfg.look.h, cfg.look.z);

  // ---- night ----
  const nightLights: THREE.Light[] = [];
  const lamp = (x: number, z: number, h: number, power: number, dist: number) => {
    const L = new THREE.PointLight('#ffbf73', 0, dist, 2);
    L.position.set(x, groundAt(x, z) + h, z);
    L.userData.nightIntensity = power;
    group.add(L); nightLights.push(L);
  };
  // a few real lights where people gather; the rest of the glow comes from lanterns and windows
  for (const l of cfg.lights ?? []) lamp(...l);
  // (set inside the building functions above)
  const mAt = minaretAt as THREE.Vector3 | null, lAt = lighthouseAt as THREE.Vector3 | null;
  if (mAt) {
    const S = new THREE.SpotLight('#fff1d6', 0, 45, 0.32, 0.6, 1.4);
    S.position.set(mAt.x + 7, mAt.y + 1.5, mAt.z + 7);
    S.target.position.set(mAt.x, mAt.y + minaretH * 0.75, mAt.z);
    S.userData.nightIntensity = 900;
    group.add(S, S.target); nightLights.push(S);
  }
  // wall lanterns: a small bracket and a glowing glass box
  {
    const glass = new THREE.BoxGeometry(0.22, 0.34, 0.22).translate(0, 0, 0.32);
    const bracket = new THREE.BoxGeometry(0.05, 0.05, 0.3).translate(0, 0.2, 0.15);
    const gm = new THREE.InstancedMesh(glass, lamps.headMaterial, lanterns.length);
    const bm = new THREE.InstancedMesh(bracket, materials.get('steel'), lanterns.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
    lanterns.forEach((l, i) => { m.compose(new THREE.Vector3(l.x, l.y ?? 0, l.z), q.setFromAxisAngle(up, l.yaw - Math.PI / 2), one); gm.setMatrixAt(i, m); bm.setMatrixAt(i, m); });
    gm.name = bm.name = 'lanterns';
    group.add(gm, bm);
  }
  // lighthouse: glowing lantern and a slowly turning pair of beams
  const beam = new THREE.Group();
  // additive light that fades to nothing along the beam (vertex colours go from bright at the lamp to black)
  const beamMat = new THREE.MeshBasicMaterial({ color: '#fff4d0', vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const lanternMat = new THREE.MeshStandardMaterial({ color: '#f4f1e6', roughness: 0.2, emissive: '#fff0c8', emissiveIntensity: 0, transparent: true, opacity: 0.85 });
  if (lAt) {
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.5, 16), lanternMat);
    lantern.position.copy(lAt);
    group.add(lantern);
    for (const sgn of [1, -1]) {
      const g = new THREE.ConeGeometry(16, 260, 24, 8, true).translate(0, -130, 0);
      const pos = g.getAttribute('position'), col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) { const f = Math.pow(1 - Math.min(1, -pos.getY(i) / 260), 1.6); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = f; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const cone = new THREE.Mesh(g.rotateZ(sgn * Math.PI / 2), beamMat);
      beam.add(cone);
    }
    beam.position.copy(lAt);
    group.add(beam);
  }
  const wallMat = materials.get('whitewash') as THREE.MeshStandardMaterial;

  const normalMap = (materials.get('water') as THREE.MeshStandardMaterial).normalMap;
  return {
    group, collider, townCollider,
    nightLights,
    lampMaterial: lamps.headMaterial,
    spawn: { pos: spawn, look },
    groundAt,
    canStand: (x, z) => groundAt(x, z) > 0.35 || (at(x, z) & PIER) !== 0,
    update: (dt) => {
      if (normalMap) { normalMap.offset.x += dt * 0.004; normalMap.offset.y += dt * 0.0025; }
      // night factor follows the lamps (the viewer sets their glow from the sun height)
      const night = Math.min(1, lamps.headMaterial.emissiveIntensity / 4);
      wallMat.emissiveIntensity = 0.9 * night;
      lanternMat.emissiveIntensity = 3 * night;
      beamMat.opacity = 0.35 * night;
      beam.visible = night > 0.05;
      beam.rotation.y += dt * 0.6;
    },
  };
}

/** Helpers a site's hooks use to add its own landmarks. */
export interface TownKit {
  C: Collector;
  materials: Materials;
  rnd: () => number;
  props: { palms: THREE.Vector3[]; trees: Placement[]; groves: Placement[]; cars: Placement[]; lamps: Placement[]; shrubs: Spot[]; grass: Spot[] };
  buildings: Building[]; roads: Road[]; areas: Area[];
  WHITE: THREE.Color;
  groundAt: (x: number, z: number) => number;
  at: (x: number, z: number) => number;
  markPoly: (p: P2[], bit: number, pad?: number) => void;
  markSeg: (a: P2, b: P2, rad: number, bit: number) => void;
  inPoly: (x: number, z: number, p: P2[]) => boolean;
  bbox: (p: P2[]) => { x0: number; x1: number; z0: number; z1: number };
  centroid: (p: P2[]) => P2;
  signedArea: (p: P2[]) => number;
  paint: (g: THREE.BufferGeometry, col: THREE.Color) => THREE.BufferGeometry;
  flat: (p: P2[], y: number | ((x: number, z: number) => number)) => THREE.BufferGeometry | null;
  walls: (p: P2[], y0: number, y1: number, u0?: number, vBase?: number | ((a: P2, b: P2) => number), inward?: boolean) => THREE.BufferGeometry;
  footprintGround: (p: P2[]) => { lo: number; hi: number };
  house: (p: P2[], id: number, opts?: { lv?: number; h?: number }) => void;
  flags: { ROAD: number; BLD: number; AREA: number; PIER: number; KEEP: number };
}

/** Simple moored boats: white hull with a coloured band, small cabin. */
function buildBoats(spots: { x: number; z: number; yaw: number; len: number }[]) {
  const hull = new THREE.BoxGeometry(1, 1.1, 2.4, 4, 1, 1);
  const pos = hull.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const bow = Math.max(0, x - 0.2) / 0.3; // taper the front 30 %
    pos.setZ(i, pos.getZ(i) * (1 - bow * 0.85) * (y < 0 ? 0.7 : 1));
  }
  hull.translate(0, 0.35, 0);
  hull.computeVertexNormals();
  const cabin = new THREE.BoxGeometry(0.3, 0.9, 1.5).translate(-0.08, 1.3, 0);
  const g = new THREE.Group();
  const hullMesh = new THREE.InstancedMesh(hull, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }), spots.length);
  const cabMesh = new THREE.InstancedMesh(cabin, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }), spots.length);
  const cols = ['#f7f7f5', '#1d68b0', '#f2f0ea', '#c23b2f', '#f7f7f5', '#2f7a63'].map((c) => new THREE.Color(c));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  spots.forEach((s, i) => {
    m.compose(new THREE.Vector3(s.x, 0, s.z), q.setFromAxisAngle(up, s.yaw + Math.PI / 2), new THREE.Vector3(s.len, 1, 1));
    hullMesh.setMatrixAt(i, m); cabMesh.setMatrixAt(i, m);
    hullMesh.setColorAt(i, cols[Math.floor(hash(i * 3.3) * cols.length)]);
  });
  for (const x of [hullMesh, cabMesh]) { x.castShadow = true; x.receiveShadow = true; g.add(x); }
  g.name = 'boats';
  return g;
}
