/**
 * Kairouan: the Great Mosque of Uqba ibn Nafi, the walled medina and the Aghlabid basins.
 * Outlines and positions from OpenStreetMap, terrain from AWS Terrain Tiles; built on the shared
 * terrain-town builder (medina houses generated along the mapped lanes and inside the blocks).
 * - The Great Mosque, laid out in its mapped outline (about 127 × 74 m) from the published plan:
 *   buttressed outer walls, the three-tier minaret (about 31.5 m) centred on the north-west wall,
 *   the courtyard ringed by arcades, the portico with the Bahu dome, the prayer hall of 17 naves
 *   with its forest of columns, and the ribbed dome over the mihrab.
 * - The medina ramparts with their bastions and crenellations along the mapped walls, and the gates.
 * - The Aghlabid basins (9th century), the Mausoleum of Sidi Sahab, the Mosque of the Three Doors and Bir Barouta.
 * Shapes are simplified. Scene frame: origin 35.6810 N, 10.0985 E, x = east, z = south.
 */
import * as THREE from 'three';
import TOWN from '../../content/kairouan-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { box, cylinder } from '../el-jem/geometry';
import { arcade, frame, frontage as frontageOn, frustum, gateOut as gateOutOf, merlons, ramparts as rampartsOf, ribbedDome, type Poi, type Road } from '../common/islamic';

// ---------------------------------------------------------------------------
// data-derived positions (shared with the site's hotspots)

const POIS = TOWN.pois as Poi[];
const ROADS = TOWN.roads as Road[];
const WALLS = ((TOWN as unknown as { walls?: P2[][] }).walls ?? []).slice().sort((a, b) => b.length - a.length);

/** The medina inside its ramparts (the north-west stretch, now a boulevard, closes the ring). */
export const MEDINA: P2[] = WALLS.flat();

/** Great Mosque frame: u from the north-west wall towards the qibla (south-east), v across from the south-west side. */
const MQ_A: P2 = [428.8, -102.2];                  // west corner of the mapped outline
const MQ_U: P2 = [0.5197, 0.8543];                 // along the long axis, towards the prayer hall
const MQ_V: P2 = [0.8543, -0.5197];                // across
export const MQ_L = 127, MQ_W = 73.6;
export const mq = (u: number, v: number): P2 => [MQ_A[0] + MQ_U[0] * u + MQ_V[0] * v, MQ_A[1] + MQ_U[1] * u + MQ_V[1] * v];
const MID = MQ_W / 2;

const circle = (c: P2, r: number, n: number): P2[] => Array.from({ length: n }, (_, i) => [c[0] + Math.cos((i / n) * Math.PI * 2) * r, c[1] + Math.sin((i / n) * Math.PI * 2) * r] as P2);
/** Inside the Great Mosque's enclosure? */
const inMosque = (p: P2) => {
  const dx = p[0] - MQ_A[0], dz = p[1] - MQ_A[1], u = dx * MQ_U[0] + dz * MQ_U[1], v = dx * MQ_V[0] + dz * MQ_V[1];
  return u > -1 && u < MQ_L + 1 && v > -1 && v < MQ_W + 1;
};
const named = (re: RegExp) => POIS.find((p) => re.test(p.name ?? ''));
const areaCentroid = (p: P2[]): P2 => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const BASINS = (TOWN.areas as { k: string; name?: string; p: P2[] }[]).filter((a) => /aglab/i.test(a.name ?? '')).map((a) => {
  const c = areaCentroid(a.p);
  let r = 0; for (const q of a.p) r += Math.hypot(q[0] - c[0], q[1] - c[1]);
  return { c, r: r / a.p.length, p: a.p };
}).sort((a, b) => b.r - a.r);
export const BIG_BASIN = BASINS[0]?.c ?? [-200, -650] as P2;
export const BIG_BASIN_R = BASINS[0]?.r ?? 60;
export const SIDI_SAHAB: P2 = [-748, -125];

const frontage = (p: P2, depth: number) => frontageOn(ROADS, p, depth);
export const THREE_DOORS = frontage(named(/Trois Portes|الثلاثة/)?.p ?? [385, 407], 9);
export const BIR_BAROUTA = frontage(named(/Barr?ou?ta/i)?.p ?? [205, 557], 11);
export const GATES = POIS.filter((p) => p.k === 'gate');
export const BAB_CHOUHADA = GATES.find((g) => /Chouhada/i.test(g.name ?? ''))?.p ?? [244.7, 713.1] as P2;
/** Unit vector through a gate, pointing out of the medina. */
export const gateOut = (p: P2) => gateOutOf(WALLS, MEDINA, p);
const ramparts = (k: TownKit) => rampartsOf(k, { walls: WALLS, poly: MEDINA, gates: GATES, roads: ROADS, bigGate: /Chouhada|Tunis/i });

// ---------------------------------------------------------------------------

const PLASTER = new THREE.Color('#d3bf98');   // limewashed arcades
const MARBLE = new THREE.Color('#ece6da');
const COURT = new THREE.Color('#c9c1b0');
const DARK = new THREE.Color('#2a2420');
const WOOD = new THREE.Color('#5a3a22');
const GREEN = new THREE.Color('#3f7a52');

export function buildKairouan(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  BASIN_WATER = null; // a fresh material per visit (the viewer disposes its materials on leaving)
  const spawn = mq(39, -26), look = mq(14, MID);
  const court = mq(46, MID), chouhada = BAB_CHOUHADA;
  return buildTerrainTown(materials, site, {
    data: TOWN as unknown as TownData,
    core: 0,
    corePoly: MEDINA,
    blockYaw: Math.atan2(MQ_U[1], MQ_U[0]),
    flowers: 0.25,
    terrainStep: 2,                                   // the plain is flat: an 8 m terrain grid is enough
    treeR: 200,
    scrub: 0.5,
    flatten: [
      { p: [mq(-4, -8), mq(-4, MQ_W + 4), mq(MQ_L + 4, MQ_W + 4), mq(MQ_L + 4, -8)], pad: 14 },
      ...BASINS.map((b) => ({ p: circle(b.c, b.r + 2.5, 32), pad: 10 })),
    ],
    spawn: { x: spawn[0], z: spawn[1] },
    look: { x: look[0], z: look[1], h: 22 },
    lights: [
      [court[0], court[1], 6, 140, 60],                                   // mosque courtyard
      [mq(16, MID)[0], mq(16, MID)[1], 3, 120, 45],                       // minaret, lit from the court
      [chouhada[0], chouhada[1], 5, 60, 30],
      [BIR_BAROUTA.street[0], BIR_BAROUTA.street[1], 4, 30, 20],
      [THREE_DOORS.street[0], THREE_DOORS.street[1], 4, 30, 20],
    ],
    special: (b: Building, k: TownKit) => {
      const name = b.name ?? '';
      if (/Grande Mosqu/i.test(name)) { greatMosque(k); return true; }
      if (/Sahab/i.test(name)) { sidiSahab(b, k); return true; }
      if (/^Bab /i.test(name)) return true;           // built with the ramparts
      if (inMosque(k.centroid(b.p))) return true;     // rooms mapped inside the mosque: part of its plan
      return false;
    },
    extras: (k) => {
      ramparts(k);
      for (const b of BASINS) basin(k, b.c, b.r, b === BASINS[0]);
      threeDoors(k);
      birBarouta(k);
    },
  });
}

// ---------------------------------------------------------------------------
// helpers

/** A matrix in the mosque frame (box x across the mosque, z along it). */
function mqM(u: number, v: number, y: number) {
  const [x, z] = mq(u, v);
  return frame(x, y, z, MQ_V);
}
// in frame(): z = d × up, which for d = V is U: boxes have x across the mosque and z along it.

// ---------------------------------------------------------------------------
// the Great Mosque

function greatMosque(k: TownKit) {
  const { C, paint } = k;
  const outline = [mq(0, 0), mq(0, MQ_W), mq(MQ_L, MQ_W), mq(MQ_L, 0)];
  const { lo, hi } = k.footprintGround(outline);
  const base = lo - 0.6, F = hi + 0.35;           // floor of the enclosure
  const add = (mat: Parameters<typeof C.add>[0], g: THREE.BufferGeometry, u: number, v: number, y: number, collide = true) => C.add(mat, g, mqM(u, v, y), collide);
  // box in mosque coordinates: [u0,u1] × [v0,v1] × [y0,y1]
  const slab = (mat: Parameters<typeof C.add>[0], u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, col?: THREE.Color, collide = true) => {
    const g = box(v1 - v0, y1 - y0, u1 - u0, 0, 0, 0);
    add(mat, col ? paint(g, col) : g, (u0 + u1) / 2, (v0 + v1) / 2, (y0 + y1) / 2, collide);
  };
  /** an arcade from (u0,v0) to (u1,v1) at floor level */
  const arcadeAt = (u0: number, v0: number, u1: number, v1: number, h: number, bays: number, opts?: Parameters<typeof arcade>[3]) => {
    const a = mq(u0, v0), b = mq(u1, v1), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    C.add('roof', paint(arcade(len, h, bays, opts), PLASTER), frame(a[0], F, a[1], [b[0] - a[0], b[1] - a[1]]));
  };
  const column = (u: number, v: number, h: number, r = 0.24) => {
    add('roof', paint(cylinder(r * 0.9, r, h - 0.5, 10), MARBLE), u, v, F);
    add('roof', paint(box(r * 3, 0.5, r * 3, 0, 0.25, 0), MARBLE), u, v, F + h - 0.5, false);
  };

  const T = 2.2, H = 9.5;                         // outer walls
  // floor platform and the outer walls (an entrance in the south-west wall, opposite the minaret's side door)
  slab('paving', T, MQ_L - T, T, MQ_W - T, base, F);
  slab('block', 0, T, 0, MQ_W, base, F + H);                         // north-west wall (minaret side)
  slab('block', MQ_L - T, MQ_L, 0, MQ_W, base, F + H);               // qibla wall
  slab('block', T, 36, 0, T, base, F + H);                            // south-west wall, with a gate at u 36..42
  slab('block', 42, MQ_L - T, 0, T, base, F + H);
  slab('block', 36, 42, 0, T, F + 5.6, F + H);
  slab('block', T, MQ_L - T, MQ_W - T, MQ_W, base, F + H);           // north-east wall
  // merlons along the wall tops
  for (const [u0, v0, u1, v1] of [[0, 0, 0, MQ_W], [MQ_L, 0, MQ_L, MQ_W], [0, 0, MQ_L, 0], [0, MQ_W, MQ_L, MQ_W]]) {
    const a = mq(u0, v0), b = mq(u1, v1), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    merlons(k, frame(a[0], F + H, a[1], [b[0] - a[0], b[1] - a[1]]), len);
  }
  // massive buttresses along the outside, heavier at the corners
  for (let u = 8; u < MQ_L - 4; u += 9) for (const [v, s] of [[-1.0, 1], [MQ_W + 1.0, 1]] as const) {
    if (u > 33 && u < 45 && v < 0) continue;     // keep the gate clear
    slab('block', u - 1.3, u + 1.3, v - 1.0 * s, v + 1.0 * s, base, F + H - 1.4);
    add('block', new THREE.CylinderGeometry(0.01, 1.84, 1.4, 4, 1).rotateY(Math.PI / 4).translate(0, 0.7, 0), u, v, F + H - 1.4, false);
  }
  for (let v = 8; v < MQ_W - 4; v += 10) slab('block', MQ_L, MQ_L + 2, v - 1.3, v + 1.3, base, F + H - 1.4);
  for (const [u, v] of [[0, 0], [0, MQ_W], [MQ_L, 0], [MQ_L, MQ_W]]) slab('block', u - 2.6, u + 2.6, v - 2.6, v + 2.6, base, F + H + 1.2);
  // the gate: a domed porch with a horseshoe arch (like Bab Lalla Rihana)
  {
    const a = mq(33, -2.5), b = mq(45, -2.5);
    C.add('block', arcade(12, 12, 1, { pier: 6, spring: 3.4, thick: 5 }), frame(a[0], base, a[1], [b[0] - a[0], b[1] - a[1]]));
    add('block', cylinder(2.6, 2.6, 1.2, 8), 39, -2.5, base + 12, false);
    add('block', ribbedDome(2.6, 16), 39, -2.5, base + 13.2, false);
    merlons(k, frame(a[0], base + 12, a[1], [b[0] - a[0], b[1] - a[1]]), 12);
  }

  // ---- the minaret: three tiers, about 31.5 m, centred on the north-west wall ----
  {
    const u = 5.35, v = MID, S = 10.7;
    add('block', frustum(S, S * 0.9, F + 19 - base), u, v, base);
    // small windows up the court face and the sides
    for (let i = 0; i < 4; i++) for (const [du, dv, w, d] of [[S * 0.47 - i * 0.07, 0, 0.7, 0.12], [0, S * 0.47 - i * 0.07, 0.12, 0.7], [0, -S * 0.47 + i * 0.07, 0.12, 0.7]]) {
      const y = F + 3 + i * 4;
      add('roof', paint(box(d === 0.12 ? 0.7 : 0.12, 1.4, d === 0.12 ? 0.12 : 0.7, 0, 0.7, 0), DARK), u + du, v + dv, y, false);
      void w;
    }
    add('roof', paint(box(1.6, 2.6, 0.2, 0, 1.3, 0), WOOD), u + S * 0.5 + 0.05, v, F, false); // door to the court
    const S1 = S * 0.9;
    for (const side of [0, 1, 2, 3]) {
      const ang = (side * Math.PI) / 2, cu = Math.cos(ang), cv = Math.sin(ang);
      const a = [u + cu * S1 / 2 - cv * S1 / 2, v + cv * S1 / 2 + cu * S1 / 2], b = [u + cu * S1 / 2 + cv * S1 / 2, v + cv * S1 / 2 - cu * S1 / 2];
      const pa = mq(a[0], a[1]), pb = mq(b[0], b[1]);
      merlons(k, frame(pa[0], F + 19, pa[1], [pb[0] - pa[0], pb[1] - pa[1]]), S1);
    }
    add('block', frustum(7.6, 7.3, 5.4), u, v, F + 19);
    const S2 = 7.3;
    for (const side of [0, 1, 2, 3]) {
      const ang = (side * Math.PI) / 2, cu = Math.cos(ang), cv = Math.sin(ang);
      const pa = mq(u + cu * S2 / 2 - cv * S2 / 2, v + cv * S2 / 2 + cu * S2 / 2), pb = mq(u + cu * S2 / 2 + cv * S2 / 2, v + cv * S2 / 2 - cu * S2 / 2);
      merlons(k, frame(pa[0], F + 24.4, pa[1], [pb[0] - pa[0], pb[1] - pa[1]]), S2);
    }
    for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) add('roof', paint(box(du ? 0.9 : 0.12, 1.8, dv ? 0.9 : 0.12, 0, 0.9, 0), DARK), u + du * 3.7, v + dv * 3.7, F + 21, false);
    add('block', frustum(4.6, 4.4, 3.4), u, v, F + 24.4);
    for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) add('roof', paint(box(du ? 1.0 : 0.12, 1.9, dv ? 1.0 : 0.12, 0, 0.95, 0), DARK), u + du * 2.25, v + dv * 2.25, F + 25, false);
    add('block', cylinder(2.1, 2.1, 0.5, 16), u, v, F + 27.8, false);
    add('block', ribbedDome(2.05, 16), u, v, F + 28.3, false);
    add('townSteel', cylinder(0.05, 0.06, 1.5, 6), u, v, F + 30.2, false);
    for (const y of [0.4, 0.75, 1.05]) add('townSteel', new THREE.SphereGeometry(0.16, 8, 6), u, v, F + 30.2 + y, false);
  }

  // ---- courtyard galleries: arcades on the court side, a second row of columns, flat roofs ----
  const CU0 = 12, CU1 = 80, CV0 = 12, CV1 = MQ_W - 12, GH = 7;
  slab('roof', T, CU0, T, MQ_W - T, F + GH, F + GH + 0.7, PLASTER);                // north-west gallery roof
  slab('roof', CU0, 86, T, CV0, F + GH, F + GH + 0.7, PLASTER);                    // side galleries
  slab('roof', CU0, 86, CV1, MQ_W - T, F + GH, F + GH + 0.7, PLASTER);
  arcadeAt(CU0, CV0, CU0, CV1, GH, 12);
  arcadeAt(CU0, CV0, CU1, CV0, GH, 16);
  arcadeAt(CU1, CV1, CU0, CV1, GH, 16);
  for (let i = 0; i <= 12; i++) column(CU0 - 0.6, CV0 + ((CV1 - CV0) * i) / 12, GH - 1.6);
  for (let i = 0; i <= 16; i++) { const u = CU0 + ((CU1 - CU0) * i) / 16; column(u, CV0 - 0.6, GH - 1.6); column(u, CV1 + 0.6, GH - 1.6); }
  for (let i = 1; i < 12; i++) { const v = CV0 + ((CV1 - CV0) * i) / 12; if (Math.abs(v - MID) > 6.5) column(7, v, GH); }          // the middle rows of the double galleries
  for (let i = 1; i < 16; i++) { const u = CU0 + ((CU1 - CU0) * i) / 16; column(u, 7, GH); column(u, MQ_W - 7, GH); }

  // ---- courtyard: marble paving falling gently to the centre, well-heads over the cistern, the sundial ----
  slab('roof', CU0, CU1, CV0, CV1, F, F + 0.08, COURT, false);
  for (let i = 1; i < 8; i++) slab('roof', CU0 + (i * (CU1 - CU0)) / 8 - 0.06, CU0 + (i * (CU1 - CU0)) / 8 + 0.06, CV0, CV1, F + 0.08, F + 0.1, new THREE.Color('#b3aa98'), false);
  for (const [u, v] of [[40, MID - 6], [40, MID + 6], [56, MID], [30, MID]]) {
    add('roof', paint(cylinder(0.55, 0.6, 0.85, 14), MARBLE), u, v, F);
    add('roof', paint(cylinder(0.36, 0.36, 0.05, 12), DARK), u, v, F + 0.85, false);
  }
  add('roof', paint(box(0.5, 1.1, 0.5, 0, 0.55, 0), MARBLE), 72, MID + 9, F);
  add('roof', paint(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 18).rotateX(0.6), MARBLE), 72, MID + 9, F + 1.25, false);

  // ---- prayer hall: portico with the Bahu dome, 17 naves, column forest, raised central nave and transept ----
  const P0 = 86, P1 = MQ_L - T, HH = 9;
  const nave = (MQ_W - 2 * T) / 17, wideNave = nave * 1.6;
  // nave boundaries across the hall (the central nave is wider)
  const vs: number[] = [];
  { const rest = (MQ_W - 2 * T - wideNave) / 16; let v = T; vs.push(v); for (let i = 0; i < 17; i++) { v += i === 8 ? wideNave : rest; vs.push(v); } }
  // portico facing the court (u 80..86): arches matching the naves, the central one taller under the dome
  slab('roof', CU1, P0, T, MQ_W - T, F + GH + 0.6, F + GH + 1.3, PLASTER);
  for (let i = 0; i < 17; i++) {
    const v0 = vs[i] + 0.35, v1 = vs[i + 1] - 0.35, central = i === 8;
    const h = central ? 11 : GH + 0.6;
    const a = mq(CU1, v0), b = mq(CU1, v1), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    C.add('roof', paint(arcade(len, h, 1, { pier: central ? 1.6 : 0.5, spring: central ? 6 : 4.4, thick: 0.9 }), PLASTER), frame(a[0], F, a[1], [b[0] - a[0], b[1] - a[1]]));
    if (central) {
      slab('roof', CU1 - 0.45, P0, v0, v1, F + 11, F + 11.6, PLASTER);
      add('roof', paint(cylinder(2.7, 2.7, 1.8, 8), PLASTER), (CU1 + P0) / 2 + 0.5, MID, F + 11.6, false);
      add('roof', paint(ribbedDome(2.7, 24), PLASTER), (CU1 + P0) / 2 + 0.5, MID, F + 13.4, false);   // the Bahu dome
    }
    column(CU1, vs[i], GH - 1.4, 0.28);
  }
  column(CU1, vs[17], GH - 1.4, 0.28);
  // the hall's court wall, pierced by 17 doors
  for (let i = 0; i < 17; i++) {
    const a = mq(P0, vs[i]), b = mq(P0, vs[i + 1]), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    C.add('roof', paint(arcade(len, HH, 1, { pier: 0.9, spring: 4.2, thick: 0.8 }), PLASTER), frame(a[0], F, a[1], [b[0] - a[0], b[1] - a[1]]));
    // carved wooden doors, folded open
    add('roof', paint(box(0.12, 4.4, 1.0, 0, 2.2, 0), WOOD), P0 + 0.7, vs[i] + 0.9, F, false);
    add('roof', paint(box(0.12, 4.4, 1.0, 0, 2.2, 0), WOOD), P0 + 0.7, vs[i + 1] - 0.9, F, false);
  }
  // arcades along the naves, on columns, perpendicular to the qibla wall
  const bays = 8, bayL = (P1 - 4 - P0) / bays;
  for (let i = 1; i < 17; i++) {
    const a = mq(P0 + 0.4, vs[i]), b = mq(P1 - 4, vs[i]);
    C.add('roof', paint(arcade(Math.hypot(b[0] - a[0], b[1] - a[1]), HH - 0.2, bays, { pier: 0.55, spring: 4.6, thick: 0.55 }), PLASTER), frame(a[0], F, a[1], [b[0] - a[0], b[1] - a[1]]), false);
    for (let j = 1; j < bays; j++) column(P0 + 0.4 + j * bayL, vs[i], 4.2, 0.22);
  }
  // the transept along the qibla wall: an arcade across the naves
  { const a = mq(P1 - 4, T), b = mq(P1 - 4, MQ_W - T); C.add('roof', paint(arcade(Math.hypot(b[0] - a[0], b[1] - a[1]), HH - 0.2, 17, { pier: 0.55, spring: 4.6, thick: 0.6 }), PLASTER), frame(a[0], F, a[1], [b[0] - a[0], b[1] - a[1]]), false); }
  // roofs: flat over the naves, raised over the central nave and the transept
  slab('roof', P0, P1, T, MQ_W - T, F + HH, F + HH + 0.8, PLASTER);
  slab('roof', P0, P1, vs[8] - 0.4, vs[9] + 0.4, F + HH + 0.8, F + HH + 3.2, PLASTER);
  slab('roof', P1 - 4.5, P1, T, MQ_W - T, F + HH + 0.8, F + HH + 2.4, PLASTER);
  slab('roof', P0 + 0.5, P1, T, MQ_W - T, F, F + 0.04, new THREE.Color('#743a2d'), false);
  // the mihrab niche and the minbar
  add('roof', paint(box(2.2, 4.8, 0.6, 0, 2.4, 0), new THREE.Color('#5b4636')), P1 - 0.25, MID, F, false);
  add('roof', paint(cylinder(1.0, 1.0, 0.5, 12), new THREE.Color('#b08a3e')), P1 - 0.4, MID, F + 4.8, false);
  for (let s = 0; s < 8; s++) add('roof', paint(box(1.2, 0.4 * (s + 1), 0.45, 0, 0.2 * (s + 1), 0), WOOD), P1 - 0.9 - s * 0.45, MID + 2.4, F, false);
  // the mihrab dome: square base, octagonal drum with windows, ribbed dome
  {
    const u = P1 - 3, v = MID;
    slab('roof', u - 4, u + 3, v - 3.6, v + 3.6, F + HH + 3.2, F + HH + 4.6, PLASTER);
    add('roof', paint(cylinder(3.3, 3.5, 2.6, 8), PLASTER), u, v, F + HH + 4.6, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; add('roof', paint(box(0.12, 1.1, 0.7, 0, 0.55, 0).rotateY(-a), DARK), u + Math.cos(a) * 3.3, v + Math.sin(a) * 3.3, F + HH + 5.4, false); }
    add('roof', paint(ribbedDome(3.3, 24), PLASTER), u, v, F + HH + 7.2, false);
    add('townSteel', cylinder(0.05, 0.06, 1.2, 6), u, v, F + HH + 10.4, false);
  }
  // inside, brass lamps hang in the central nave
  for (let j = 0; j < 6; j++) add('townSteel', cylinder(0.5, 0.25, 0.4, 10), P0 + 4 + j * 5.8, MID, F + 5.2, false);
  // streets all round the mosque, and the open square on its west side
  k.markPoly([mq(-9, -30), mq(-9, MQ_W + 9), mq(MQ_L + 8, MQ_W + 9), mq(MQ_L + 8, -30)], k.flags.KEEP);
}

// ---------------------------------------------------------------------------
// Aghlabid basins, Sidi Sahab, the Mosque of the Three Doors, Bir Barouta

/** Still, greenish water as in photos of the basins (the shared sea material is too blue). */
let BASIN_WATER: THREE.Material | null = null;
function basinWater(k: TownKit) {
  if (!BASIN_WATER) {
    const m = (k.materials.get('water') as THREE.MeshStandardMaterial).clone();
    m.color.set('#3c5f52'); m.roughness = 0.18; m.envMapIntensity = 0.25;
    BASIN_WATER = m;
  }
  return BASIN_WATER;
}

/** A round basin with buttressed walls (the large one has 48 buttresses and a central pier for a pavilion). */
function basin(k: TownKit, c: P2, r: number, big: boolean) {
  const { C } = k;
  const N = big ? 64 : 32;
  const ring: P2[] = [];
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; ring.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
  const { lo, hi } = k.footprintGround(ring);
  const water = hi + 0.25, top = hi + 1.3;
  const wm = new THREE.Mesh(new THREE.CircleGeometry(r - 0.5, N).rotateX(-Math.PI / 2).translate(c[0], water, c[1]), basinWater(k));
  wm.receiveShadow = true;
  C.extra.push(wm);
  for (let i = 0; i < N; i++) {
    const a = ring[i], b = ring[(i + 1) % N], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    C.add('block', box(L + 0.1, top - lo + 2.2, 1.1, 0, (top - lo + 2.2) / 2, 0), frame(mx, lo - 2.2, mz, [b[0] - a[0], b[1] - a[1]]));
    // rounded buttresses inside and out
    if (i % (big ? 1 : 2) === 0) for (const s of [1, -1]) {
      const ox = (a[0] - c[0]) / r, oz = (a[1] - c[1]) / r;
      C.add('block', cylinder(0.75, 0.75, top - lo + 1.6, 10).translate(a[0] + ox * s * 0.6, lo - 1.6, a[1] + oz * s * 0.6), undefined, s > 0);
    }
  }
  if (big) {
    C.add('block', box(4.5, 3.4, 4.5, c[0], water - 1.6 + 1.7, c[1]));        // pier of the pavilion
    C.add('block', box(5, 0.3, 5, c[0], water + 1.95, c[1]), undefined, false);
  }
  k.markPoly(ring, k.flags.KEEP, 4);
}

/** The Mausoleum of Sidi Sahab ("of the Barber"): white courts and domes, a tiled square minaret. */
function sidiSahab(b: Building, k: TownKit) {
  const { C, paint, WHITE } = k;
  k.house(b.p, 777001, { lv: 1, h: 5.5 });
  const { hi } = k.footprintGround(b.p);
  const c = k.centroid(b.p);
  // domes over the tomb chamber and the prayer room
  const spots: P2[] = [c, [c[0] + 9, c[1] + 6], [c[0] - 8, c[1] - 7]];
  spots.forEach((q, i) => {
    if (!k.inPoly(q[0], q[1], b.p)) return;
    const r = i === 0 ? 3.6 : 2.6;
    C.add('roof', paint(cylinder(r, r, 1.6, 16, hi + 5.5).translate(q[0], 0, q[1]), WHITE), undefined, false);
    C.add('roof', paint(new THREE.SphereGeometry(r, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2).translate(q[0], hi + 7.1, q[1]), WHITE), undefined, false);
  });
  // the minaret by the entrance, with green tiles under its lantern
  const p = b.p[0], mx = p[0] + (c[0] - p[0]) * 0.12, mz = p[1] + (c[1] - p[1]) * 0.12, g = k.groundAt(mx, mz) - 0.5, mh = 15;
  C.add('whitewash', paint(box(3.4, mh, 3.4, mx, g + mh / 2, mz), new THREE.Color('#efe6d2')));
  C.add('roof', paint(box(3.5, 1.6, 3.5, mx, g + mh - 1.6, mz), new THREE.Color('#3f7a8a')), undefined, false);
  C.add('roof', paint(box(2.4, 2.6, 2.4, mx, g + mh + 1.3, mz), new THREE.Color('#efe6d2')), undefined, false);
  C.add('roof', paint(new THREE.ConeGeometry(1.9, 1.7, 4).rotateY(Math.PI / 4).translate(mx, g + mh + 3.45, mz), GREEN), undefined, false);
}

function threeDoors(k: TownKit) {
  const { C, paint } = k;
  const { c, n } = THREE_DOORS, d: P2 = [-n[1], n[0]];
  const W = 11, D = 9, H = 8.2, g = k.groundAt(c[0], c[1]);
  const q: P2[] = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]].map(([a, b]) => [c[0] + d[0] * a + n[0] * b, c[1] + d[1] * a + n[1] * b] as P2);
  k.markPoly(q, k.flags.BLD, 0.5);
  C.add('block', box(W, H + 0.6, D - 0.8, 0, (H + 0.6) / 2, 0), frame(c[0] - n[0] * 0.4, g - 0.6, c[1] - n[1] * 0.4, d));
  // the 9th-century façade: three horseshoe arches with dark doors, bands of Kufic inscriptions above
  const fx = c[0] + n[0] * (D / 2 - 0.35), fz = c[1] + n[1] * (D / 2 - 0.35);
  C.add('block', arcade(W, H + 0.6, 3, { pier: 1.2, spring: 3.3, thick: 0.7 }), frame(fx - d[0] * W / 2, g - 0.6, fz - d[1] * W / 2, d));
  for (let i = 0; i < 3; i++) {
    const ox = (i - 1) * (W / 3);
    C.add('roof', paint(box(2.2, 3.6, 0.1, 0, 1.8, 0), WOOD), frame(fx + d[0] * ox - n[0] * 0.28, g - 0.6, fz + d[1] * ox - n[1] * 0.28, d), false);
  }
  for (const y of [5.7, 6.6, 7.4]) C.add('roof', paint(box(W - 0.4, 0.42, 0.12, 0, 0, 0), new THREE.Color(y > 7 ? '#8c7450' : '#a38658')), frame(fx + n[0] * 0.36, g - 0.6 + y, fz + n[1] * 0.36, d), false);
  merlons(k, frame(fx - d[0] * W / 2 + n[0] * 0.1, g + H, fz - d[1] * W / 2 + n[1] * 0.1, d), W);
  // the small minaret at the back corner
  const mx = c[0] - n[0] * (D / 2 - 1.8) + d[0] * (W / 2 - 1.8), mz = c[1] - n[1] * (D / 2 - 1.8) + d[1] * (W / 2 - 1.8);
  C.add('block', box(3.2, 6, 3.2, 0, 3, 0), frame(mx, g + H, mz, d));
  C.add('block', ribbedDome(1.4, 12), frame(mx, g + H + 6, mz, d), false);
}

function birBarouta(k: TownKit) {
  const { C, paint, WHITE } = k;
  const { c, n } = BIR_BAROUTA, d: P2 = [-n[1], n[0]];
  const W = 12, D = 11;
  const q: P2[] = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]].map(([a, b]) => [c[0] + d[0] * a + n[0] * b, c[1] + d[1] * a + n[1] * b] as P2);
  if (k.signedArea(q) < 0) q.reverse();
  k.markPoly(q, k.flags.BLD, 0.5);
  k.house(q, 777002, { lv: 2, h: 7.2 });
  const { hi } = k.footprintGround(q);
  C.add('roof', paint(cylinder(3.2, 3.2, 1.2, 18, hi + 7.2).translate(c[0], 0, c[1]), WHITE), undefined, false);
  C.add('roof', paint(new THREE.SphereGeometry(3.2, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2).translate(c[0], hi + 8.4, c[1]), WHITE), undefined, false);
}
