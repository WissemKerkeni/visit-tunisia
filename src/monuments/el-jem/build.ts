import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { MatKey, Materials } from '../../viewer/materials';
import {
  ARENA, RING_W, archPanel, axes, bayBoundaries, bayMatrix, box, clipAbove, cylinder, hash, noise1,
  rect, ringPoint, sweep, type Profile,
} from './geometry';
import { buildVegetation, type Spot } from './vegetation';
import { buildCars, buildLamps, buildTrees } from './city';
import { buildRealTown, PLAZA_S, type TownResult } from './town';

// ---------------------------------------------------------------------------
// Layout constants (metres / ring parameter s)

const N_BAYS = 64;
const S_INNER = 0.87;                       // inner arcade ring centre line
const INNER_HALF = 0.65 / RING_W;
const FACADE_HALF = 0.8 / RING_W;
const S_MASS = S_INNER - INNER_HALF + 0.002; // outer limit of the cavea mass
const S_CORR_IN = S_INNER + INNER_HALF - 0.004;
const S_CORR_OUT = 1 - FACADE_HALF + 0.002;
const S_CORR_MID = (S_CORR_IN + S_CORR_OUT) / 2;
const PODIUM_H = 3.6;
const GATE_HALF = 0.115;                   // half-width of the axial gate passages (radians)
const GATE_CEIL = 6.6;

const STOREYS = [
  { y: 0, h: 10.5, open: 3.9, spring: 5.6, innerOpen: 3.4, innerSpring: 5.2 },
  { y: 10.5, h: 10.0, open: 3.7, spring: 5.1, innerOpen: 3.2, innerSpring: 4.8 },
  { y: 20.5, h: 9.5, open: 3.5, spring: 5.0, innerOpen: 3.0, innerSpring: 4.6 },
];
const ATTIC_H = 5.5;

// Ruin pattern
const BREACH_T = Math.PI - 0.42;
/** t ranges (0..2π) where the seats have been restored; elsewhere they are eroded. */
const RESTORED_SEATS: [number, number][] = [[0.35, 1.9], [4.0, 5.3]];
const ATTIC_RANGE: [number, number] = [-0.95, 0.45];
// Stairs between galleries (t ranges)
const STAIR_A: [number, number] = [1.78, 2.02]; // ground -> gallery 2
const STAIR_B: [number, number] = [-1.42, -1.18]; // gallery 2 -> gallery 3

export type { BuildResult } from '../../sites/types';
import type { BuildResult } from '../../sites/types';

const TOWN_KEYS = new Set<string>(['plaster', 'roof', 'plasterFar', 'roofFar', 'townSteel', 'plazaBlock', 'paving']);

export class Collector {
  parts = new Map<MatKey, THREE.BufferGeometry[]>();
  collide: THREE.BufferGeometry[] = [];
  collideTown: THREE.BufferGeometry[] = [];
  extra: THREE.Object3D[] = [];

  add(mat: MatKey, g: THREE.BufferGeometry, m?: THREE.Matrix4, collide = true) {
    let geo = g.index ? g.toNonIndexed() : g;
    if (m) geo = geo.clone().applyMatrix4(m);
    for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(name)) geo.deleteAttribute(name);
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();
    if (!geo.getAttribute('uv')) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2));
    const colored = mat.startsWith('plaster') || mat.startsWith('roof') || mat.startsWith('whitewash') || mat.startsWith('wall:') || mat === 'woodwork' || mat === 'terrain';
    if (colored && !geo.getAttribute('color')) {
      const c = new Float32Array(geo.getAttribute('position').count * 3).fill(1);
      geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    }
    if (!colored && geo.getAttribute('color')) geo.deleteAttribute('color');
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat)!.push(geo);
    if (collide) {
      const c = new THREE.BufferGeometry();
      c.setAttribute('position', geo.getAttribute('position').clone());
      (TOWN_KEYS.has(mat) ? this.collideTown : this.collide).push(c);
    }
  }

  finish(materials: Materials): { group: THREE.Group; collider: THREE.BufferGeometry; townCollider: THREE.BufferGeometry | null } {
    const group = new THREE.Group();
    for (const [key, geos] of this.parts) {
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, materials.get(key));
      // flat ground layers (paving, draped roads and tracks) never cast a visible shadow
      mesh.castShadow = key !== 'glass' && !key.endsWith('Far') && key !== 'paving' && key !== 'asphalt' && key !== 'ground';
      mesh.receiveShadow = key !== 'glass';
      mesh.name = key;
      if (key === 'glass') mesh.renderOrder = 2;
      group.add(mesh);
    }
    this.extra.forEach((o) => group.add(o));
    const collider = mergeGeometries(this.collide, false)!;
    const townCollider = this.collideTown.length ? mergeGeometries(this.collideTown, false) : null;
    return { group, collider, townCollider };
  }
}

const inRange = (t: number, [a, b]: [number, number]) => {
  const n = (x: number) => Math.atan2(Math.sin(x), Math.cos(x));
  const tt = n(t), aa = n(a), bb = n(b);
  return aa <= bb ? tt >= aa && tt <= bb : tt >= aa || tt <= bb;
};
const angDist = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// ---------------------------------------------------------------------------

export function buildElJem(materials: Materials): BuildResult {
  const C = new Collector();
  const bounds = bayBoundaries(N_BAYS, 1);

  // Bay classification
  const bays = bounds.slice(0, N_BAYS).map((t0, i) => {
    const t1 = bounds[i + 1];
    const tc = (t0 + t1) / 2;
    const breach = angDist(tc, BREACH_T) < 0.24;
    const breachEdge = breach && angDist(tc, BREACH_T) > 0.14;
    const attic = inRange(tc, ATTIC_RANGE);
    const n = noise1(i * 0.37, 1);
    return {
      i, t0, t1, tc, breach, breachEdge, attic,
      facade3: attic ? 'full' : n < 0.42 ? 'ruined' : 'full',
      inner3: attic ? 'full' : noise1(i * 0.31, 2) < 0.25 ? 'missing' : noise1(i * 0.31, 3) < 0.55 ? 'ruined' : 'full',
    };
  });

  // ---- Outer facade ----
  const facadeRef = bayMatrix(bounds[0], bounds[1], 1, 0, 1).width;
  const facadeGeo = STOREYS.map((st, k) => {
    const full = facadeBay(facadeRef, st.h, st.open, st.spring, k, false);
    const ruined = facadeBay(facadeRef, st.h, st.open, st.spring, k, true);
    return { full, ruined };
  });
  const atticGeo = atticBay(facadeRef);

  for (const b of bays) {
    for (let k = 0; k < 3; k++) {
      if (b.breach && (k > 0 || !b.breachEdge)) continue;
      const st = STOREYS[k];
      const { matrix } = bayMatrix(b.t0, b.t1, 1, st.y, facadeRef);
      const g = k === 2 && b.facade3 === 'ruined' ? facadeGeo[k].ruined : facadeGeo[k].full;
      C.add('facade', g, matrix);
    }
    if (b.attic) {
      const { matrix } = bayMatrix(b.t0, b.t1, 1, 30, facadeRef);
      C.add('attic', atticGeo, matrix);
    }
  }

  // ---- Inner arcade ring ----
  const innerRef = bayMatrix(bounds[0], bounds[1], S_INNER, 0, 1).width;
  const innerGeo = STOREYS.map((st, k) => ({
    full: innerBay(innerRef, st.h, st.innerOpen, st.innerSpring, k, false),
    ruined: innerBay(innerRef, st.h, st.innerOpen, st.innerSpring, k, true),
  }));
  for (const b of bays) {
    for (let k = 0; k < 3; k++) {
      if (b.breach && k > 0) continue;
      if (k === 2 && b.inner3 === 'missing') continue;
      const st = STOREYS[k];
      const { matrix } = bayMatrix(b.t0, b.t1, S_INNER, st.y, innerRef);
      C.add('facade', k === 2 && b.inner3 === 'ruined' ? innerGeo[k].ruined : innerGeo[k].full, matrix);
    }
  }

  // ---- Gallery slabs with barrel vaults ----
  const vaultProfile = (yTop: number, ySpring: number): Profile => {
    const pts: Profile = [new THREE.Vector2(S_CORR_IN, yTop), new THREE.Vector2(S_CORR_IN, ySpring)];
    const R = ((S_CORR_OUT - S_CORR_IN) / 2);
    for (let i = 1; i < 12; i++) {
      const a = Math.PI - (Math.PI * i) / 12;
      pts.push(new THREE.Vector2(S_CORR_MID + R * Math.cos(a), ySpring + R * RING_W * Math.sin(a)));
    }
    pts.push(new THREE.Vector2(S_CORR_OUT, ySpring), new THREE.Vector2(S_CORR_OUT, yTop));
    return pts;
  };
  const corrW = (S_CORR_OUT - S_CORR_IN) * RING_W;
  const slabs = [
    { yTop: 10.5, spring: 9.7 - corrW / 2, stair: STAIR_A },
    { yTop: 20.5, spring: 19.7 - corrW / 2, stair: STAIR_B },
  ];
  const breachRange: [number, number] = [BREACH_T - 0.2, BREACH_T + 0.2];
  for (const sl of slabs) {
    const ranges = splitRanges([-Math.PI, Math.PI], [sl.stair, breachRange]);
    for (const r of ranges) C.add('facade', sweep(vaultProfile(sl.yTop, sl.spring), r[0], r[1]));
    // over the stair, keep only the inner half of the floor (flat), the outer half is the stairwell
    C.add('facade', sweep(rect(S_CORR_IN, S_CORR_MID, sl.yTop - 0.8, sl.yTop), sl.stair[0], sl.stair[1]));
  }

  // ---- Stairs (outer half of the corridor) ----
  buildStair(C, STAIR_A, 0, 10.5);
  buildStair(C, STAIR_B, 10.5, 20.5);

  // ---- Cavea: seats and the ruined upper mass ----
  const seatProfile = makeSeatProfile();
  const rubbleProfileAt = (t: number): Profile => makeRubbleProfile(t);
  const normalRanges: [number, number][] = [[GATE_HALF, Math.PI - GATE_HALF], [Math.PI + GATE_HALF, 2 * Math.PI - GATE_HALF]];
  const ruinedSeatAt = (t: number) => makeSeatProfile(t);
  for (const [a, b] of normalRanges) {
    // restored sectors keep clean rows; elsewhere the rows are eroded and broken
    const cuts = [a, ...RESTORED_SEATS.flat().filter((x) => x > a && x < b), b].sort((x, y) => x - y);
    for (let k = 0; k < cuts.length - 1; k++) {
      const lo = cuts[k], hi = cuts[k + 1], mid = (lo + hi) / 2;
      const caps = { capStart: true, capEnd: true };
      if (RESTORED_SEATS.some(([r0, r1]) => mid > r0 && mid < r1)) C.add('block', sweep(seatProfile, lo, hi, caps));
      else C.add('rubble', sweep(ruinedSeatAt(lo), lo, hi, { ...caps, profileAt: ruinedSeatAt }));
    }
    C.add('rubble', sweep(rubbleProfileAt(a), a, b, { profileAt: rubbleProfileAt, capStart: true, capEnd: true }));
    // parapet on the podium
    C.add('block', sweep(rect(0.002, 0.016, PODIUM_H, PODIUM_H + 0.95), a, b));
  }
  for (const c of [0, Math.PI]) {
    const a = c - GATE_HALF, b = c + GATE_HALF;
    C.add('block', sweep(clipAbove(seatProfile, GATE_CEIL), a, b));
    const clipR = (t: number) => clipAbove(makeRubbleProfile(t), GATE_CEIL);
    C.add('rubble', sweep(clipR(a), a, b, { profileAt: clipR }));
  }

  // ---- Podium wall around the arena (with small doors) ----
  const pb = bayBoundaries(32, 0.012);
  const podRef = bayMatrix(pb[0], pb[1], 0.012, 0, 1).width;
  // panels stop 5 cm short; a continuous curved coping strip closes the gap between the flat
  // panels and the curved walkway behind them
  const podDoor = archPanel({ width: podRef, height: PODIUM_H - 0.05, depth: 1.0, opening: 1.3, spring: 1.55 });
  const podSolid = archPanel({ width: podRef, height: PODIUM_H - 0.05, depth: 1.0 });
  for (const [a, b] of normalRanges) C.add('block', sweep(rect(-0.004, 0.03, PODIUM_H - 0.05, PODIUM_H), a, b));
  const podGate = archPanel({ width: podRef, height: GATE_CEIL + 0.6, depth: 1.2, opening: 4.4, spring: 3.9 });
  for (let i = 0; i < 32; i++) {
    const { matrix } = bayMatrix(pb[i], pb[i + 1], 0.012, 0, podRef);
    C.add('block', i === 0 || i === 16 ? podGate : i % 2 ? podDoor : podSolid, matrix);
  }

  // ---- Arena floor with the slot over the underground galleries ----
  buildArena(C);
  buildHypogeum(C);

  // ---- Ground, town, palms, ruins dressing ----
  buildGround(C);
  // the real town (OpenStreetMap streets and footprints), see town.ts
  const city = buildRealTown((m, g, mx, collide) => C.add(m, g, mx, collide));
  buildPlaza(C, city);
  buildRubble(C);
  buildBlocks(C);
  buildStage(C);
  for (let i = 0; i < 40 && city.palms.length < 4000; i++) {
    const p = ringPoint(hash(i * 9.1) * Math.PI * 2, 1.07 + hash(i * 4.4) * 0.12, 0);
    if (!city.built(p.x, p.z)) city.palms.push(p);
  }
  const palms = buildPalms(materials, city.palms); palms.name = 'palms'; C.extra.push(palms);
  const veg = vegetationSpots((x, z) => !city.built(x, z));
  C.extra.push(buildVegetation([...veg.grass, ...city.grass], [...veg.shrubs, ...city.shrubs], veg.olives));
  const lamps = buildLamps(city.lamps);
  const cars = buildCars(city.cars), trees = buildTrees(city.trees, city.groves); cars.name = 'cars'; lamps.group.name = 'lamps'; trees.name = 'trees';
  C.extra.push(cars, lamps.group, trees);

  const { group, collider, townCollider } = C.finish(materials);

  // Lights used at night (festival floodlights + underground lamps)
  const nightLights: THREE.Light[] = [];
  for (const [x, z, tx, tz] of [[-10, -4, -55, -45], [10, 4, 55, 45], [-10, 4, -55, 45], [10, -4, 55, -45], [0, -7, 0, -58], [0, 7, 0, 58]]) {
    const L = new THREE.SpotLight('#ffb36b', 0, 160, 0.42, 0.7, 1.2);
    L.position.set(x, 1.5, z);
    L.target.position.set(tx, 24, tz);
    group.add(L, L.target);
    nightLights.push(L);
  }
  for (const x of [-16, -4, 10, 22, 34, 42]) {
    const P = new THREE.PointLight('#ffc98a', 6, 11, 2);
    P.position.set(x, -1.6, 0);
    group.add(P);
  }

  return {
    group, collider, townCollider, nightLights, lampMaterial: lamps.headMaterial,
    spawn: { pos: city.spawn, look: city.spawnLook },
  };
}

// ---------------------------------------------------------------------------
// Parts

function facadeBay(w: number, h: number, open: number, spring: number, k: number, ruined: boolean) {
  const depth = 1.6;
  const parts: THREE.BufferGeometry[] = [archPanel({ width: w, height: h, depth, opening: open, spring, jagged: ruined ? 3.2 : 0, seed: k })];
  const entab = 1.1;
  const colH = h - entab;
  const r = k === 2 ? 0.38 : 0.44;
  const z = -depth / 2 - r * 0.35;
  // engaged half-column on the pier (bay boundary)
  if (!ruined || k < 2) {
    parts.push(
      cylinder(r + 0.16, r + 0.2, 0.5, 14).translate(-w / 2, 0, z),
      cylinder(r - 0.03, r, colH - 1.3, 14, 0.5).translate(-w / 2, 0, z),
      cylinder(r + 0.18, r - 0.03, 0.6, 14, colH - 0.8).translate(-w / 2, 0, z),
      box(2 * r + 0.55, 0.22, 2 * r + 0.55, -w / 2, colH - 0.09, z),
      // entablature / cornice band
      box(w, entab, depth + 0.5, 0, h - entab / 2, -0.25),
      box(w, 0.2, depth + 0.7, 0, h - 0.1, -0.35),
    );
  } else {
    parts.push(cylinder(r - 0.03, r, colH * 0.55, 14, 0.5).translate(-w / 2, 0, z));
  }
  // impost moulding at the springing of the arch
  parts.push(box((w - open) / 2, 0.28, depth + 0.14, -w / 2 + (w - open) / 4, spring, 0));
  parts.push(box((w - open) / 2, 0.28, depth + 0.14, w / 2 - (w - open) / 4, spring, 0));
  // low parapet in the upper arches
  if (k > 0) parts.push(box(open, 1.0, depth * 0.55, 0, 0.5, 0));
  return mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
}

function innerBay(w: number, h: number, open: number, spring: number, k: number, ruined: boolean) {
  const depth = 1.3;
  const parts: THREE.BufferGeometry[] = [archPanel({ width: w, height: h, depth, opening: open, spring, jagged: ruined ? 3.6 : 0, seed: k + 10 })];
  if (!ruined) parts.push(box(w, 0.5, depth + 0.3, 0, h - 0.25, 0));
  if (k === 2) parts.push(box(open, 1.0, depth * 0.6, 0, 0.5, 0));
  return mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
}

function atticBay(w: number) {
  const depth = 1.4;
  return mergeGeometries([
    archPanel({ width: w, height: ATTIC_H, depth, window: { w: 1.0, h: 1.5, y: 2.0 } }),
    box(0.9, ATTIC_H - 0.6, 0.35, -w / 2, (ATTIC_H - 0.6) / 2, -depth / 2 - 0.17),
    box(w, 0.6, depth + 0.6, 0, ATTIC_H - 0.3, -0.3),
  ].map((p) => (p.index ? p.toNonIndexed() : p)))!;
}

function splitRanges(full: [number, number], holes: [number, number][]): [number, number][] {
  let out: [number, number][] = [full];
  for (const [h0, h1] of holes) {
    const next: [number, number][] = [];
    for (const [a, b] of out) {
      if (h1 <= a || h0 >= b) { next.push([a, b]); continue; }
      if (h0 > a) next.push([a, h0]);
      if (h1 < b) next.push([h1, b]);
    }
    out = next;
  }
  return out;
}

function buildStair(C: Collector, [t0, t1]: [number, number], y0: number, y1: number) {
  const steps = Math.round((y1 - y0) / 0.35);
  const rise = (y1 - y0) / steps;
  for (let i = 0; i < steps; i++) {
    const a = t0 + ((t1 - t0) * i) / steps, b = t0 + ((t1 - t0) * (i + 1)) / steps;
    C.add('block', sweep(rect(S_CORR_MID, S_CORR_OUT, y0, y0 + rise * (i + 1)), a, b, { segments: 1, capStart: true, capEnd: true }));
  }
  // low side wall between the stair and the flat half of the corridor
  C.add('block', sweep(rect(S_CORR_MID - 0.006, S_CORR_MID, y0, y1 + 1.0), t0, t1));
}

/** Seat rows. With `ruinedAt` set (a t value) the rows are eroded: heights sink progressively, no nosings. */
function makeSeatProfile(ruinedAt?: number): Profile {
  const tread = 0.8 / RING_W;
  const rise = 0.42;
  const rows = 21;
  const sP = 0.024, s0 = 0.055;
  const p: Profile = [new THREE.Vector2(sP, 0), new THREE.Vector2(sP, PODIUM_H), new THREE.Vector2(s0, PODIUM_H)];
  const ruined = ruinedAt !== undefined;
  const lip = ruined ? 0 : 0.11 / RING_W, lipH = 0.13;
  let erosion = 0;
  for (let i = 0; i < rows; i++) {
    const s = s0 + i * tread;
    if (ruined) {
      // erosion only grows with the row index, so an upward step is never taller than a normal row
      const t = ruinedAt!;
      const grow = noise1(t * 7 + i * 0.9, 5) * 0.55 + (hash(i * 13.1 + Math.round(t * 60)) - 0.5) * 0.12;
      erosion = Math.min((i + 1) * rise, erosion + Math.max(0, grow - 0.12) * (0.4 + i / rows));
    }
    const y = PODIUM_H + (i + 1) * rise - erosion;
    // riser, then a small overhanging nosing so each row casts a shadow line
    p.push(new THREE.Vector2(s, y - lipH), new THREE.Vector2(s - lip, y - lipH), new THREE.Vector2(s - lip, y), new THREE.Vector2(s + tread, y));
  }
  const sEnd = s0 + rows * tread;
  p.push(new THREE.Vector2(sEnd, 0));
  return p;
}
const SEAT_END = 0.055 + 21 * (0.8 / RING_W);
const SEAT_TOP = PODIUM_H + 21 * 0.42;

function makeRubbleProfile(t: number): Profile {
  const n = 12;
  const p: Profile = [new THREE.Vector2(SEAT_END - 0.002, 0)];
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const s = SEAT_END - 0.002 + (S_MASS - SEAT_END + 0.002) * f;
    const base = SEAT_TOP - 0.25 + (10.85 - (SEAT_TOP - 0.25)) * f;
    const wob = k === 0 || k === n ? 0 : (noise1(t * 9 + k * 1.7, 4) - 0.5) * 1.0 + (hash(k * 7.7 + Math.round(t * 40)) - 0.5) * 0.25;
    p.push(new THREE.Vector2(s, base + wob));
  }
  p.push(new THREE.Vector2(S_MASS, 0));
  return p;
}

function ellipsePoints(a: number, b: number, n = 128) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2; pts.push(new THREE.Vector2(a * Math.cos(t), b * Math.sin(t))); }
  return pts;
}

/** Shape in the (x, -z) plane → horizontal geometry at height y (extruded downward by depth, or flat if depth = 0). */
function horizontal(shape: THREE.Shape, y: number, depth: number) {
  const g = depth > 0 ? new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 }) : new THREE.ShapeGeometry(shape, 8);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y - depth, 0);
  return g;
}

const SLOT = { hw1: 1.2, hw2: 0.8, X: 24, Z: 12 };

function buildArena(C: Collector) {
  const shape = new THREE.Shape(ellipsePoints(ARENA.a, ARENA.b));
  const { hw1, hw2, X, Z } = SLOT;
  const hole = new THREE.Path([
    [-X, -hw1], [-hw2, -hw1], [-hw2, -Z], [hw2, -Z], [hw2, -hw1], [X, -hw1],
    [X, hw1], [hw2, hw1], [hw2, Z], [-hw2, Z], [-hw2, hw1], [-X, hw1],
  ].map(([x, y]) => new THREE.Vector2(x, y)));
  shape.holes.push(hole);
  C.add('sand', horizontal(shape, 0, 0.5));

  // glass roof over the slot + steel frame
  C.add('glass', box(2 * X, 0.04, 2 * hw1, 0, -0.03, 0));
  C.add('glass', box(2 * hw2, 0.04, Z - hw1, 0, -0.03, (Z + hw1) / 2));
  C.add('glass', box(2 * hw2, 0.04, Z - hw1, 0, -0.03, -(Z + hw1) / 2));
  for (let x = -X; x <= X + 0.01; x += 1.6) C.add('steel', box(0.07, 0.12, 2 * hw1, x, 0, 0), undefined, false);
  for (const z of [-hw1, hw1]) C.add('steel', box(2 * X, 0.12, 0.08, 0, 0, z), undefined, false);
  for (let z = hw1; z <= Z + 0.01; z += 1.6) for (const sz of [1, -1]) C.add('steel', box(2 * hw2, 0.12, 0.07, 0, 0, sz * z), undefined, false);
}

function buildHypogeum(C: Collector) {
  const F = -5, H = 4.5, cy = F + H / 2;
  // floors
  C.add('block', box(84, 0.4, 12.8, 16.5, F - 0.2, 0));
  C.add('block', box(4.4, 0.4, 29.2, 0, F - 0.2, 0));
  // main gallery side arcades and cells
  const bayW = 3.2;
  const panel = archPanel({ width: bayW, height: H, depth: 0.7, opening: 2.0, spring: 2.5 });
  for (let k = 0; k < 15; k++) {
    const x = -24 + bayW * (k + 0.5);
    if (k !== 7) for (const z of [-2.35, 2.35]) C.add('facade', panel, new THREE.Matrix4().makeTranslation(x, F, z));
  }
  for (let k = 0; k <= 15; k++) {
    const x = -24 + bayW * k;
    for (const z of [-4.2, 4.2]) C.add('facade', box(0.6, H, 3.0, x, cy, z));
  }
  for (const z of [-6.05, 6.05]) {
    C.add('facade', box(22.4, H, 0.7, -12.8, cy, z));
    C.add('facade', box(22.4, H, 0.7, 12.8, cy, z));
  }
  C.add('facade', box(0.7, H, 13.5, -24.35, cy, 0));
  for (const z of [-4.1, 4.1]) C.add('facade', box(0.7, H, 4.6, 24.35, cy, z));
  // transverse gallery
  for (const x of [-1.9, 1.9]) for (const z of [-10.2, 10.2]) C.add('facade', box(0.6, H, 7.6, x, cy, z));
  for (const z of [-14.3, 14.3]) C.add('facade', box(4.4, H, 0.6, 0, cy, z));

  // barrel-vaulted tunnel towards the east gate
  const tunnelLen = 22, x0 = 24, spring = F + 2.6;
  for (const z of [-2.1, 2.1]) C.add('facade', box(tunnelLen, 2.6, 0.6, x0 + tunnelLen / 2, F + 1.3, z));
  const ann = new THREE.Shape();
  ann.moveTo(2.25, 0); ann.absarc(0, 0, 2.25, 0, Math.PI, false); ann.lineTo(-1.8, 0); ann.absarc(0, 0, 1.8, Math.PI, 0, true); ann.closePath();
  const vault = new THREE.ExtrudeGeometry(ann, { depth: tunnelLen, bevelEnabled: false, curveSegments: 18 });
  vault.rotateY(Math.PI / 2);
  vault.translate(x0, spring, 0);
  C.add('facade', vault);

  // stair up to the east gate passage
  const sx0 = 46, steps = 12, rise = 5 / steps;
  for (let k = 0; k < steps; k++) C.add('block', box(1.0, rise * (k + 1), 3.6, sx0 + 0.5 + k, F + (rise * (k + 1)) / 2, 0));
  for (const z of [-2.05, 2.05]) C.add('facade', box(12, 5, 0.5, sx0 + 6, -2.5, z));
  // railings around the stairwell
  for (const z of [-2.05, 2.05]) C.add('block', box(12, 1.0, 0.3, sx0 + 6, 0.5, z));
  C.add('block', box(0.3, 1.0, 4.4, sx0 - 0.15, 0.5, 0));
}

/** Sandy ground inside the monument's footprint; town pavement and farmland outside it. */
function buildGround(C: Collector) {
  const [fx, fz] = axes(1.012);
  const inner = new THREE.Shape(ellipsePoints(fx, fz, 160));
  inner.holes.push(new THREE.Path(ellipsePoints(ARENA.a, ARENA.b).reverse()));
  inner.holes.push(new THREE.Path([[46, -1.8], [58, -1.8], [58, 1.8], [46, 1.8]].map(([x, y]) => new THREE.Vector2(x, y)).reverse()));
  const gi = new THREE.ShapeGeometry(inner, 64);
  gi.rotateX(-Math.PI / 2);
  C.add('ground', gi);

  const town = new THREE.Shape();
  town.absarc(0, 0, 1180, 0, Math.PI * 2, false);
  town.holes.push(new THREE.Path(ellipsePoints(fx, fz, 160).reverse()));
  const gt = new THREE.ShapeGeometry(town, 96);
  gt.rotateX(-Math.PI / 2);
  C.add('urban', gt);

  const fields = new THREE.Shape();
  fields.absarc(0, 0, 2600, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, 1180, 0, Math.PI * 2, true);
  fields.holes.push(hole);
  const gf = new THREE.ShapeGeometry(fields, 96);
  gf.rotateX(-Math.PI / 2);
  C.add('fields', gf, undefined, false);
}

/**
 * Paved esplanade around the monument inside the site fence (low stone base + iron railing),
 * as in visitor photos. The streets, gardens and buildings beyond it come from OpenStreetMap (town.ts).
 */
function buildPlaza(C: Collector, city: TownResult) {
  const [ax0, bz0] = axes(1.012), [ax1, bz1] = axes(PLAZA_S);
  const shape = new THREE.Shape(ellipsePoints(ax1, bz1, 160));
  shape.holes.push(new THREE.Path(ellipsePoints(ax0, bz0, 160).reverse()));
  const g = new THREE.ShapeGeometry(shape, 8);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0.03, 0);
  C.add('paving', g);

  // fence: openings at the entrance (by the ticket kiosk) and on the axes; none through buildings
  const sf = PLAZA_S - 0.006;
  const entrance = Math.atan2(city.spawn.z / bz1, city.spawn.x / ax1);
  const gaps: [number, number][] = [[entrance - 0.09, entrance + 0.09], [-0.04, 0.04], [Math.PI / 2 - 0.04, Math.PI / 2 + 0.04], [Math.PI - 0.04, Math.PI + 0.04], [-Math.PI / 2 - 0.04, -Math.PI / 2 + 0.04]];
  const N = 360;
  let run: number | null = null;
  const flush = (end: number) => {
    if (run === null) return;
    const a = run, b = end;
    if (b - a > 0.004) {
      C.add('plazaBlock', sweep(rect(sf - 0.005, sf + 0.005, 0, 0.5), a, b));
      C.add('plazaBlock', sweep(rect(sf - 0.007, sf + 0.007, 0.5, 0.58), a, b));
      C.add('fence', sweep(rect(sf - 0.0002, sf + 0.0002, 0.58, 2.1), a, b));
    }
    run = null;
  };
  for (let i = 0; i <= N; i++) {
    const t = -Math.PI + (i / N) * Math.PI * 2;
    const p = ringPoint(t, sf, 0);
    const open = city.built(p.x, p.z) || gaps.some(([a, b]) => t > a && t < b);
    if (open || i === N) flush(t); else if (run === null) run = t;
  }

  const flag = tunisianFlag(2.4);
  flag.position.set(city.flag.x, 10.1, city.flag.z);
  C.add('townSteel', cylinder(0.06, 0.08, 11, 8, 0).translate(city.flag.x, 0, city.flag.z), undefined, false);
  C.extra.push(flag);
}

/**
 * Flag of Tunisia (2:3): red field, white disc of 1/3 the length, red crescent and star.
 * Drawn from the official construction (flag 120 × 80: disc r 20, crescent r 15 cut by r 12 at +4,
 * star centred at +4 with radius 9, one point toward the hoist). Hoist at the local origin, flying along +z.
 */
function tunisianFlag(length: number): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 600; c.height = 400;
  const g = c.getContext('2d')!;
  g.setTransform(5, 0, 0, 5, 300, 200);
  const red = '#e70013';
  g.fillStyle = red; g.fillRect(-60, -40, 120, 80);
  const disc = (x: number, r: number, col: string) => { g.fillStyle = col; g.beginPath(); g.arc(x, 0, r, 0, Math.PI * 2); g.fill(); };
  disc(0, 20, '#fff');
  disc(0, 15, red);
  disc(4, 12, '#fff');
  g.fillStyle = red; g.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i * 4 * Math.PI) / 5; // pentagram, first point toward the hoist
    const x = 4 + 9 * Math.cos(a), y = 9 * Math.sin(a);
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath(); g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const h = length * (2 / 3);
  const geo = new THREE.PlaneGeometry(length, h, 24, 8);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + length / 2) / length; // 0 at the hoist, 1 at the fly
    // cloth in a light breeze: ripples grow toward the fly, the free end droops a little
    pos.setZ(i, Math.sin(u * 7.5 + pos.getY(i) * 0.6) * 0.09 * u);
    pos.setY(i, pos.getY(i) - 0.12 * u * u);
  }
  geo.computeVertexNormals();
  geo.translate(length / 2, 0, 0);
  geo.rotateY(-Math.PI / 2); // +x (fly) → +z
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.85 }));
  mesh.castShadow = true;
  mesh.name = 'flag';
  return mesh;
}

/** Fallen ashlar blocks: on the ruined upper cavea, at the foot of the walls, around the breach. */
function buildBlocks(C: Collector) {
  let seed = 404;
  const rnd = () => hash(seed++ * 1.771);
  const put = (p: THREE.Vector3, size = 1, tilt = 0.25) => {
    const w = (0.8 + rnd() * 0.8) * size, h = (0.42 + rnd() * 0.35) * size, d = (0.55 + rnd() * 0.4) * size;
    const onSide = rnd() < 0.15;
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(p.x, p.y + (onSide ? w : h) * 0.42, p.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * tilt, rnd() * 6.28, onSide ? Math.PI / 2 : (rnd() - 0.5) * tilt)),
      new THREE.Vector3(1, 1, 1));
    C.add('facade', box(w, h, d), m);
  };
  const awayFromGates = (t: number) => angDist(t, 0) > GATE_HALF + 0.05 && angDist(t, Math.PI) > GATE_HALF + 0.05;
  // ruined upper cavea
  for (let i = 0; i < 160; i++) {
    const t = rnd() * Math.PI * 2;
    if (!awayFromGates(t)) continue;
    const s = SEAT_END + 0.03 + rnd() * (S_MASS - SEAT_END - 0.06);
    const p = ringPoint(t, s, rubbleTopAt(t, s) - 0.12);
    put(p, 0.9 + rnd() * 0.4, 0.5);
  }
  // around the outside, in loose clusters
  for (let c = 0; c < 28; c++) {
    const t = rnd() * Math.PI * 2, s = 1.04 + rnd() * 0.3;
    if (angDist(t, 0) < 0.12) continue;
    for (let k = 0; k < 3 + Math.floor(rnd() * 5); k++) put(ringPoint(t + (rnd() - 0.5) * 0.04, s + (rnd() - 0.5) * 0.04, 0.03));
  }
  // around the breach
  for (let i = 0; i < 70; i++) put(ringPoint(BREACH_T + (rnd() - 0.5) * 0.45, 1.01 + rnd() * 0.1, 0.03), 1.1, 0.7);
  // along the inner wall of the ground corridor
  for (let i = 0; i < 30; i++) {
    const t = rnd() * Math.PI * 2;
    if (inRange(t, [STAIR_A[0] - 0.05, STAIR_A[1] + 0.05]) || !awayFromGates(t)) continue;
    put(ringPoint(t, S_CORR_IN + 0.012, 0), 0.8);
  }
}

function rubbleTopAt(t: number, s: number) {
  const p = makeRubbleProfile(t);
  for (let k = 1; k < p.length - 2; k++) {
    const a = p[k], b = p[k + 1];
    if (s >= a.x && s <= b.x) return a.y + ((s - a.x) / (b.x - a.x)) * (b.y - a.y);
  }
  return p[1].y;
}

/** Positions for grass, shrubs and olive trees. */
function vegetationSpots(free: (x: number, z: number) => boolean): { grass: Spot[]; shrubs: Spot[]; olives: Spot[] } {
  let seed = 909;
  const rnd = () => hash(seed++ * 2.913);
  const grass: Spot[] = [], shrubs: Spot[] = [], olives: Spot[] = [];
  // tufts at the foot of the outer wall and along the plaza wall
  for (let i = 0; i < 1400; i++) {
    const t = rnd() * Math.PI * 2;
    const band = rnd();
    const s = band < 0.6 ? 1.02 + rnd() * 0.03 : PLAZA_S - 0.012 + rnd() * 0.008;
    const p = ringPoint(t, s, 0.03);
    if (free(p.x, p.z)) grass.push({ x: p.x, y: p.y, z: p.z, scale: band < 0.6 ? 0.8 : 1.0 });
  }
  // tufts growing on the ruined cavea and in the cracks of the eroded seats
  for (let i = 0; i < 900; i++) {
    const t = rnd() * Math.PI * 2;
    const s = SEAT_END + 0.01 + rnd() * (S_MASS - SEAT_END - 0.02);
    grass.push({ x: ringPoint(t, s, 0).x, y: rubbleTopAt(t, s) - 0.05, z: ringPoint(t, s, 0).z, scale: 0.9 });
  }
  // a few shrubs at the foot of the walls and along the site fence
  for (let i = 0; i < 90; i++) {
    const t = rnd() * Math.PI * 2;
    const p = ringPoint(t, rnd() < 0.6 ? 1.02 + rnd() * 0.02 : PLAZA_S - 0.01, 0.03);
    if (free(p.x, p.z)) shrubs.push({ x: p.x, y: p.y, z: p.z, scale: 0.6 });
  }
  // garden beds with bougainvillea and green shrubs on the west side of the site
  for (let i = 0; i < 160; i++) {
    const t = Math.PI + (rnd() - 0.5) * 1.5, s = 1.08 + rnd() * (PLAZA_S - 1.1);
    if (angDist(t, BREACH_T) < 0.12 && s < 1.2) continue;
    const p = ringPoint(t, s, 0.03);
    if (free(p.x, p.z)) shrubs.push({ x: p.x, y: p.y, z: p.z, scale: 1.1 + rnd() * 0.8, color: rnd() < 0.45 ? (rnd() < 0.5 ? '#c2387a' : '#d0508f') : undefined });
  }
  return { grass, shrubs, olives };
}

function buildRubble(C: Collector) {
  let seed = 11;
  const rnd = () => hash(seed++ * 2.371);
  const stone = new THREE.DodecahedronGeometry(1, 0);
  const place = (t: number, s: number, count: number, spread: number, maxY: number) => {
    for (let i = 0; i < count; i++) {
      const tt = t + (rnd() - 0.5) * spread;
      const ss = s + (rnd() - 0.5) * 0.08;
      const p = ringPoint(tt, ss, 0);
      const sc = 0.4 + rnd() * 1.1;
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(p.x, rnd() * maxY, p.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3)),
        new THREE.Vector3(sc * (1 + rnd()), sc * 0.7, sc * (1 + rnd())),
      );
      C.add('rock', stone, m);
    }
  };
  place(BREACH_T, 1.04, 70, 0.42, 1.4);
  place(BREACH_T, S_CORR_MID, 25, 0.32, 0.8);
  // scattered column drums and blocks around the monument
  for (let i = 0; i < 26; i++) {
    const t = rnd() * Math.PI * 2;
    const p = ringPoint(t, 1.12 + rnd() * 0.25, 0);
    if (Math.abs(p.z) < 6 && p.x > 0) continue;
    const m = new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0.4, p.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, rnd() * 3, 0)), new THREE.Vector3(1, 1, 1));
    C.add('block', rnd() < 0.5 ? cylinder(0.42, 0.42, 1.1 + rnd(), 14, -0.6) : box(1.4, 0.8, 0.9, 0, 0, 0), m);
  }
}

function buildStage(C: Collector) {
  C.add('stage', box(9, 1.2, 10, -22, 0.6, 0));
  for (const [x, z] of [[-26, -4.8], [-26, 4.8], [-18, -4.8], [-18, 4.8]]) C.add('steel', box(0.35, 8, 0.35, x, 4, z));
  for (const z of [-4.8, 4.8]) C.add('steel', box(8.4, 0.4, 0.4, -22, 8, z), undefined, false);
  for (const x of [-26, -18]) C.add('steel', box(0.4, 0.4, 10, x, 8, 0), undefined, false);
}

export function buildPalms(materials: Materials, spots: THREE.Vector3[]) {
  let seed = 31;
  const rnd = () => hash(seed++ * 3.17);
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 1, 7).translate(0, 0.5, 0);
  const frond = new THREE.PlaneGeometry(0.9, 4.2, 1, 4);
  frond.translate(0, 2.1, 0);
  const posA = frond.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < posA.count; i++) { const y = posA.getY(i); posA.setZ(i, -0.08 * y * y); posA.setX(i, posA.getX(i) * (1 - y / 4.6)); }
  frond.computeVertexNormals();
  const crownParts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 11; k++) {
    const f = frond.clone();
    f.rotateX(-0.9 - (k % 2) * 0.35);
    f.rotateY((k / 11) * Math.PI * 2);
    crownParts.push(f);
  }
  const crownGeo = mergeGeometries(crownParts)!;
  const trunks = new THREE.InstancedMesh(trunkGeo, materials.get('palmTrunk'), spots.length);
  const crowns = new THREE.InstancedMesh(crownGeo, materials.get('palmLeaf'), spots.length);
  spots.forEach((p, i) => {
    const h = 7 + rnd() * 6;
    const lean = new THREE.Euler((rnd() - 0.5) * 0.12, rnd() * 6, (rnd() - 0.5) * 0.12);
    const q = new THREE.Quaternion().setFromEuler(lean);
    trunks.setMatrixAt(i, new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, h, 1)));
    const top = new THREE.Vector3(0, h, 0).applyQuaternion(q).add(p);
    crowns.setMatrixAt(i, new THREE.Matrix4().compose(top, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * 6, 0)), new THREE.Vector3(1, 1, 1)));
  });
  for (const m of [trunks, crowns]) { m.castShadow = true; m.receiveShadow = true; }
  const g = new THREE.Group();
  g.add(trunks, crowns);
  return g;
}
