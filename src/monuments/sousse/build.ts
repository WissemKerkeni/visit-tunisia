/**
 * Sousse: the walled medina above the harbour, the Ribat, the Great Mosque and the Kasbah.
 * Outlines and positions from OpenStreetMap, terrain and coastline from AWS Terrain Tiles and OSM; built on the
 * shared terrain-town builder (medina houses mapped or generated along the lanes and inside the blocks) and the
 * shared Islamic pieces (../common/islamic.ts):
 * - the Ribat (late 8th century, completed 821), a square fort laid out on its mapped outline: round corner and
 *   side towers, the projecting gate, two storeys of cells round the courtyard, and the round watchtower (nador)
 *   on its square base, about 27 m;
 * - the Great Mosque (850-851), fortress-like with crenellated walls and round corner towers, the courtyard
 *   with its arcades and inscription band, and the prayer hall with its domes;
 * - the Kasbah on the high south-west corner with the Khalef al-Fata tower (859), about 30 m, now a lighthouse;
 * - the Kalaout el-Koubba with its zigzag-ribbed dome, the ramparts and the gates.
 * Shapes are simplified. Scene frame: origin 35.8252 N, 10.6375 E, x = east, z = south.
 */
import * as THREE from 'three';
import TOWN from '../../content/sousse-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { arcade, frame, frustum, inPolygon, merlonRing, merlons, nearestRoad, ramparts, ribbedDome, wallRing, type Poi, type Road } from '../common/islamic';
import { box, cylinder } from '../el-jem/geometry';

const POIS = TOWN.pois as Poi[];
const ROADS = TOWN.roads as Road[];
const BUILDINGS = TOWN.buildings as Building[];
const WALLS = (TOWN as unknown as { walls?: P2[][] }).walls ?? [];
const centroidOf = (p: P2[]): P2 => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const named = (re: RegExp) => BUILDINGS.find((b) => re.test(b.name ?? ''));

/** The medina inside its ramparts. */
export const MEDINA: P2[] = wallRing(WALLS);
const KASBAH_P = named(/^Kasbah$/)?.p ?? [];
const inKasbah = (x: number, z: number) => KASBAH_P.length > 2 && inPolygon(KASBAH_P, x, z);

/** Gates: the mapped gate points and the gate buildings. */
export const GATES: Poi[] = [
  ...POIS.filter((p) => p.k === 'gate'),
  ...BUILDINGS.filter((b) => /^Bab /i.test(b.name ?? '')).map((b) => ({ k: 'gate', p: centroidOf(b.p), name: b.name })),
];
export const BAB_GHARBI = GATES.find((g) => /Gharbi/i.test(g.name ?? ''))?.p ?? [-241, 74] as P2;

/** The Ribat, axis-aligned in the scene frame: x 92..133, z -293.5 (north) .. -251.5 (south). */
export const RIBAT = { x0: 92, x1: 133, z0: -293.5, z1: -251.5, ring: 6.5 };
export const NADOR: P2 = [130.2, -254.3];
export const RIBAT_COURT: P2 = [(RIBAT.x0 + RIBAT.x1) / 2, (RIBAT.z0 + RIBAT.z1) / 2];

/** Great Mosque frame: u from the north wall towards the qibla, v across from the west. */
const MQ_A: P2 = [168, -206.7];
const MQ_U: P2 = [0.288, 0.958];
const MQ_V: P2 = [0.955, -0.297];
export const MQ_L = 57.7, MQ_W = 51.5;
export const mq = (u: number, v: number): P2 => [MQ_A[0] + MQ_U[0] * u + MQ_V[0] * v, MQ_A[1] + MQ_U[1] * u + MQ_V[1] * v];
const inMosque = (p: P2) => {
  const dx = p[0] - MQ_A[0], dz = p[1] - MQ_A[1], u = dx * MQ_U[0] + dz * MQ_U[1], v = dx * MQ_V[0] + dz * MQ_V[1];
  return u > -1 && u < MQ_L + 1 && v > -1 && v < MQ_W + 1;
};

export const KHALEF = centroidOf(named(/Phare/)?.p ?? [[-179, 352]]);
export const KASBAH_C = KASBAH_P.length ? centroidOf(KASBAH_P) : [-172, 320] as P2;
export const KOBBA = centroidOf(named(/Kobba/)?.p ?? [[58, 13]]);
export const MUSEUM = centroidOf(named(/Archaeological Museum/)?.p ?? [[-186, 227]]);
export const SOUK: P2 = [-130, 60];
/** The lane beside the Kalaout el-Koubba. */
export const KOBBA_STREET = nearestRoad(ROADS, KOBBA).q;

const MARBLE = new THREE.Color('#ece6da');
const DARK = new THREE.Color('#2a2420');
const WOOD = new THREE.Color('#5a3a22');
const PAVE = new THREE.Color('#cbbd9f');

export function buildSousse(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  const court = mq(17, MQ_W / 2);
  return buildTerrainTown(materials, site, {
    data: TOWN as unknown as TownData,
    core: 0,
    corePoly: MEDINA,
    blockYaw: 0,
    flowers: 0.5,
    treeR: 250,
    flatten: [
      { p: [mq(-3, -3), mq(-3, MQ_W + 3), mq(MQ_L + 3, MQ_W + 3), mq(MQ_L + 3, -3)], pad: 10 },
      { p: [[RIBAT.x0 - 3, RIBAT.z0 - 3], [RIBAT.x1 + 3, RIBAT.z0 - 3], [RIBAT.x1 + 3, RIBAT.z1 + 4], [RIBAT.x0 - 3, RIBAT.z1 + 4]], pad: 10 },
    ],
    spawn: { x: 152, z: -238 },                 // the square between the Ribat and the Great Mosque
    look: { x: NADOR[0], z: NADOR[1], h: 20 },
    lights: [
      [RIBAT_COURT[0], RIBAT_COURT[1], 6, 90, 40],
      [court[0], court[1], 5, 80, 35],
      [152, -238, 5, 60, 30],
      [KOBBA[0], KOBBA[1], 6, 40, 25],
    ],
    special: (b: Building, k: TownKit) => {
      const name = b.name ?? '';
      if (/Grande Mosqu/i.test(name)) { greatMosque(k); return true; }
      if (/Ribat of Susa|^Ribat$|رباط/i.test(name)) { ribat(k); return true; }
      if (/^Kasbah$/i.test(name)) { kasbah(b, k); return true; }
      if (/Phare/i.test(name)) { khalefTower(b, k); return true; }
      if (/Kobba/i.test(name)) { koubba(b, k); return true; }
      if (/^Bab /i.test(name)) return true;          // built with the ramparts
      const c = k.centroid(b.p);
      if (inMosque(c)) return true;                   // rooms mapped inside the mosque: part of its plan
      if (c[0] > RIBAT.x0 - 1 && c[0] < RIBAT.x1 + 1 && c[1] > RIBAT.z0 - 1 && c[1] < RIBAT.z1 + 1) return true;
      return false;
    },
    extras: (k) => {
      ramparts(k, { walls: WALLS, poly: MEDINA, gates: GATES, roads: ROADS, height: 8.5, bigGate: /Gharbi|Jedid|Jdid/i, skip: (x, z) => inKasbah(x, z) });
      // the square between the Ribat and the mosque stays open
      k.markPoly([[134, -300], [170, -300], [175, -215], [134, -245]], k.flags.KEEP);
    },
  });
}

// ---------------------------------------------------------------------------
// the Ribat

function ribat(k: TownKit) {
  const { C, paint } = k;
  const { x0, x1, z0, z1, ring } = RIBAT;
  const outline: P2[] = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const { lo, hi } = k.footprintGround(outline);
  const base = lo - 0.7, F = hi + 0.2, H = 8.5;
  const slab = (mat: 'block' | 'paving' | 'roof', ax: number, bx: number, az: number, bz: number, y0: number, y1: number, col?: THREE.Color, collide = true) => {
    const g = box(bx - ax, y1 - y0, bz - az, (ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2);
    C.add(mat, col ? paint(g, col) : g, undefined, collide);
  };
  // floor of the courtyard, and the four ranges of cells (two storeys) with a flat terrace on top
  slab('paving', x0 + ring, x1 - ring, z0 + ring, z1 - ring, base, F);
  slab('block', x0, x1, z0, z0 + ring, base, F + H);                        // north range
  slab('block', x0, x0 + ring, z0 + ring, z1 - ring, base, F + H);          // west
  slab('block', x1 - ring, x1, z0 + ring, z1 - ring, base, F + H);          // east
  const gx0 = 111.3, gx1 = 114.7;                                           // the gate passage through the south range
  slab('block', x0, gx0, z1 - ring, z1, base, F + H);
  slab('block', gx1, x1, z1 - ring, z1, base, F + H);
  slab('block', gx0, gx1, z1 - ring, z1, F + 4.2, F + H);
  slab('paving', gx0, gx1, z1 - ring, z1 + 3, base, F);
  // merlons along the outer edges of the terrace
  merlons(k, frame(x0, F + H, z0 + 0.25, [1, 0]), x1 - x0);
  merlons(k, frame(x1, F + H, z1 - 0.25, [-1, 0]), x1 - x0);
  merlons(k, frame(x0 + 0.25, F + H, z1, [0, -1]), z1 - z0);
  merlons(k, frame(x1 - 0.25, F + H, z0, [0, 1]), z1 - z0);
  // round towers at the corners and the middle of the sides (the south-east corner carries the nador)
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, (z0 + z1) / 2], [x1, (z0 + z1) / 2], [x0, z1]]) {
    C.add('block', cylinder(2.3, 2.4, F + H + 1.2 - base, 16, base).translate(x, 0, z));
    C.add('block', cylinder(2.55, 2.55, 0.5, 16, F + H + 1.2).translate(x, 0, z), undefined, false);
  }
  // courtyard: a portico of arches in front of the ground-floor cells, small windows of the upper cells
  const cx0 = x0 + ring, cx1 = x1 - ring, cz0 = z0 + ring, cz1 = z1 - ring;
  const sides: [P2, P2][] = [[[cx0, cz0 + 0.4], [cx1, cz0 + 0.4]], [[cx1 - 0.4, cz0], [cx1 - 0.4, cz1]], [[cx1, cz1 - 0.4], [cx0, cz1 - 0.4]], [[cx0 + 0.4, cz1], [cx0 + 0.4, cz0]]];
  for (const [a, b] of sides) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dir: P2 = [b[0] - a[0], b[1] - a[1]];
    C.add('block', arcade(L, 4.3, Math.round(L / 3.2), { pier: 0.9, spring: 2.5, thick: 0.8 }), frame(a[0], F, a[1], dir));
    const nx = -dir[1] / L, nz = dir[0] / L; // towards the court for these clockwise sides
    for (let t = 1.6; t < L - 1; t += 3.2) {
      const px = a[0] + (dir[0] / L) * t - nx * 0.42, pz = a[1] + (dir[1] / L) * t - nz * 0.42;
      C.add('roof', paint(box(0.6, 0.9, 0.12, 0, 0, 0), DARK), frame(px, F + 6.1, pz, dir), false);
    }
  }
  // the nador: a round watchtower on a square base, with a stair of about 73 steps inside
  {
    const [x, z] = NADOR;
    C.add('block', box(6.2, F + H + 1.2 - base, 6.2, x, (base + F + H + 1.2) / 2, z));
    C.add('block', cylinder(2.55, 2.75, 16.5, 20, F + H + 1.2).translate(x, 0, z));
    // arrow slits up the tower
    for (let y = F + 12; y < F + 25; y += 3.4) for (const a of [0.4, 2.0, 3.6, 5.2]) {
      C.add('roof', paint(box(0.12, 0.8, 0.3, 0, 0, 0).rotateY(-a).translate(x + Math.cos(a) * 2.68, y, z + Math.sin(a) * 2.68), DARK), undefined, false);
    }
    const top = F + H + 1.2 + 16.5;
    C.add('block', cylinder(2.9, 2.9, 0.45, 20, top).translate(x, 0, z), undefined, false);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; C.add('block', box(0.8, 0.9, 0.5, 0, 0.45, 0).rotateY(-a).translate(x + Math.cos(a) * 2.6, top + 0.45, z + Math.sin(a) * 2.6), undefined, false); }
  }
  // the projecting gate, with antique columns either side of the door
  {
    const gx = (gx0 + gx1) / 2;
    C.add('block', arcade(8, 7, 1, { pier: 4.6, spring: 2.6, thick: 2.8 }), frame(gx - 4, base, z1 + 1.4, [1, 0]));
    merlons(k, frame(gx - 4, base + 7, z1 + 2.55, [1, 0]), 8);
    for (const s of [-1, 1]) C.add('roof', paint(cylinder(0.22, 0.25, 3.4, 10, F).translate(gx + s * 2.2, 0, z1 + 2.95), MARBLE));
    C.add('roof', paint(box(1.4, 3.2, 0.12, gx - 0.75, F + 1.6, z1 - ring + 0.5), WOOD), undefined, false);
  }
  k.markPoly([[x0 - 4, z0 - 4], [x1 + 4, z0 - 4], [x1 + 4, z1 + 6], [x0 - 4, z1 + 6]], k.flags.KEEP);
}

// ---------------------------------------------------------------------------
// the Great Mosque

function greatMosque(k: TownKit) {
  const { C, paint } = k;
  const outline = [mq(0, 0), mq(0, MQ_W), mq(MQ_L, MQ_W), mq(MQ_L, 0)];
  const { lo, hi } = k.footprintGround(outline);
  const base = lo - 0.6, F = hi + 0.3, H = 8.2, T = 2;
  const M = (u: number, v: number, y: number) => { const [x, z] = mq(u, v); return frame(x, y, z, MQ_V); };
  const slab = (mat: 'block' | 'paving' | 'roof', u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, col?: THREE.Color, collide = true) => {
    const g = box(v1 - v0, y1 - y0, u1 - u0, 0, 0, 0);
    C.add(mat, col ? paint(g, col) : g, M((u0 + u1) / 2, (v0 + v1) / 2, (y0 + y1) / 2), collide);
  };
  const arcadeAt = (u0: number, v0: number, u1: number, v1: number, h: number, bays: number, opts?: Parameters<typeof arcade>[3]) => {
    const a = mq(u0, v0), b = mq(u1, v1);
    C.add('block', arcade(Math.hypot(b[0] - a[0], b[1] - a[1]), h, bays, opts), frame(a[0], F, a[1], [b[0] - a[0], b[1] - a[1]]));
  };
  const band = (u0: number, v0: number, u1: number, v1: number, y: number) => {
    // the band of Kufic inscription above the courtyard arcades
    const a = mq(u0, v0), b = mq(u1, v1), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    C.add('roof', paint(box(L, 0.55, 0.9, L / 2, 0, 0), new THREE.Color('#9a7f57')), frame(a[0], y, a[1], [b[0] - a[0], b[1] - a[1]]), false);
  };

  slab('paving', T, MQ_L - T, T, MQ_W - T, base, F);
  // fortress walls with a gate in the middle of the west and east sides
  slab('block', 0, T, 0, MQ_W, base, F + H);
  slab('block', MQ_L - T, MQ_L, 0, MQ_W, base, F + H);
  for (const [v0, v1] of [[0, T], [MQ_W - T, MQ_W]]) {
    slab('block', T, 14, v0, v1, base, F + H);
    slab('block', 18, MQ_L - T, v0, v1, base, F + H);
    slab('block', 14, 18, v0, v1, F + 4, F + H);
  }
  for (const [u0, v0, u1, v1] of [[0, 0, 0, MQ_W], [MQ_L, MQ_W, MQ_L, 0], [MQ_L, 0, 0, 0], [0, MQ_W, MQ_L, MQ_W]]) {
    const a = mq(u0, v0), b = mq(u1, v1);
    merlons(k, frame(a[0], F + H, a[1], [b[0] - a[0], b[1] - a[1]]), Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  // round towers at the two northern corners; the north-east one carries the muezzin's small domed kiosk
  for (const [u, v] of [[0, 0], [0, MQ_W]]) {
    const [x, z] = mq(u, v);
    C.add('block', cylinder(3.0, 3.2, F + H + 1.6 - base, 18, base).translate(x, 0, z));
    C.add('block', cylinder(3.3, 3.3, 0.5, 18, F + H + 1.6).translate(x, 0, z), undefined, false);
  }
  {
    const [x, z] = mq(0, MQ_W), y = F + H + 2.1;
    C.add('block', box(3.6, 3.2, 3.6, 0, 1.6, 0), frame(x, y, z, MQ_V), undefined);
    for (const [ox, oz] of [[1.81, 0], [-1.81, 0], [0, 1.81], [0, -1.81]]) C.add('roof', paint(box(oz ? 1.1 : 0.06, 1.8, ox ? 1.1 : 0.06, ox, 1.55, oz), DARK), frame(x, y, z, MQ_V), false);
    C.add('block', cylinder(1.75, 1.8, 0.6, 12, y + 3.2).translate(x, 0, z), undefined, false);
    C.add('block', ribbedDome(1.75, 12).translate(x, y + 3.8, z), undefined, false);
  }

  // courtyard (about 41 × 22 m) with arcades on three sides and the inscription band
  const CU0 = 6, CU1 = 28.5, CV0 = 5.25, CV1 = MQ_W - 5.25, GH = 5.6;
  slab('roof', CU0, CU1, CV0, CV1, F, F + 0.07, PAVE, false);
  slab('block', T, CU0, T, MQ_W - T, F + GH, F + GH + 0.7);
  slab('block', CU0, CU1, T, CV0, F + GH, F + GH + 0.7);
  slab('block', CU0, CU1, CV1, MQ_W - T, F + GH, F + GH + 0.7);
  arcadeAt(CU0, CV0, CU0, CV1, GH, 11, { pier: 1.1, spring: 2.6, thick: 0.9 });
  arcadeAt(CU0, CV0, CU1, CV0, GH, 6, { pier: 1.1, spring: 2.6, thick: 0.9 });
  arcadeAt(CU1, CV1, CU0, CV1, GH, 6, { pier: 1.1, spring: 2.6, thick: 0.9 });
  band(CU0 + 0.2, CV0, CU0 + 0.2, CV1, F + GH - 0.2);
  // the prayer hall: 13 naves, its façade of arches on the court, raised central nave and two domes
  const P0 = CU1, P1 = MQ_L - T, HH = 7.6;
  const nave = (MQ_W - 2 * T) / 13;
  for (let i = 0; i < 13; i++) {
    const v0 = T + i * nave, v1 = v0 + nave, central = i === 6;
    const a = mq(P0, v0), b = mq(P0, v1);
    C.add('block', arcade(Math.hypot(b[0] - a[0], b[1] - a[1]), central ? HH + 1.6 : HH, 1, { pier: 0.9, spring: central ? 4.2 : 3.4, thick: 1.0 }), frame(a[0], F, a[1], [b[0] - a[0], b[1] - a[1]]));
    if (i > 0) {
      const p = mq(P0 + 0.6, v0), q = mq(P1 - 0.2, v0);
      C.add('block', arcade(Math.hypot(q[0] - p[0], q[1] - p[1]), HH - 0.2, 6, { pier: 0.7, spring: 3.2, thick: 0.6 }), frame(p[0], F, p[1], [q[0] - p[0], q[1] - p[1]]), false);
    }
  }
  band(P0, T, P0, MQ_W - T, F + HH + 0.1);
  slab('block', P0 - 0.5, P1, T, MQ_W - T, F + HH, F + HH + 0.7);
  slab('block', P0 - 0.5, P1, T + 6 * nave - 0.3, T + 7 * nave + 0.3, F + HH + 0.7, F + HH + 2.2);
  slab('roof', P0 + 0.6, P1, T, MQ_W - T, F, F + 0.04, new THREE.Color('#5c3a2e'), false);    // mats and carpets
  for (const [u, r] of [[P0 + 2.6, 2.6], [P1 - 2.8, 2.9]] as const) {
    const [x, z] = mq(u, MQ_W / 2);
    C.add('block', cylinder(r + 0.1, r + 0.2, 1.6, 8, F + HH + 2.2).translate(x, 0, z), undefined, false);
    C.add('block', ribbedDome(r, 16).translate(x, F + HH + 3.8, z), undefined, false);
  }
  // mihrab niche
  C.add('roof', paint(box(2, 4.2, 0.5, 0, 2.1, 0), new THREE.Color('#5b4636')), M(P1 - 0.2, MQ_W / 2, F), false);
  k.markPoly([mq(-6, -8), mq(-6, MQ_W + 8), mq(MQ_L + 6, MQ_W + 8), mq(MQ_L + 6, -8)], k.flags.KEEP);
}

// ---------------------------------------------------------------------------
// the Kasbah, the Khalef al-Fata tower, the Kalaout el-Koubba

/** Crenellated walls along the Kasbah's mapped outline; inside, the museum's garden courts. */
function kasbah(b: Building, k: TownKit) {
  const { C } = k;
  const p = b.p, H = 10;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], e = p[(i + 1) % p.length], L = Math.hypot(e[0] - a[0], e[1] - a[1]);
    if (L < 0.4) continue;
    const mx = (a[0] + e[0]) / 2, mz = (a[1] + e[1]) / 2, g = k.groundAt(mx, mz);
    C.add('block', box(L + 0.3, H + 0.8, 2.2, 0, (H + 0.8) / 2, 0), frame(mx, g - 0.8, mz, [e[0] - a[0], e[1] - a[1]]));
    if (L > 2) merlons(k, frame(a[0], g + H, a[1], [e[0] - a[0], e[1] - a[1]]), L);
  }
  // garden courts of the museum: palms and low hedges
  const bb = k.bbox(p);
  for (let z = bb.z0 + 10; z < bb.z1 - 6; z += 14) for (let x = bb.x0 + 8; x < bb.x1 - 6; x += 12) {
    if (!inPolygon(p, x, z) || k.rnd() < 0.4) continue;
    k.props.palms.push(new THREE.Vector3(x, k.groundAt(x, z), z));
  }
  k.markPoly(p, k.flags.KEEP);
}

/** The Khalef al-Fata tower (859): a square stone tower about 30 m tall, crowned by a lighthouse lantern. */
function khalefTower(b: Building, k: TownKit) {
  const { C, paint } = k;
  const { lo } = k.footprintGround(b.p);
  const [x, z] = KHALEF, base = lo - 0.6, Ht = 30;
  const bb = k.bbox(b.p), S = Math.max(6, Math.min(9, Math.max(bb.x1 - bb.x0, bb.z1 - bb.z0)));
  C.add('block', frustum(S, S * 0.94, Ht).translate(x, base, z));
  merlonRing(k, x, base + Ht, z, S * 0.94);
  for (let y = base + 6; y < base + Ht - 3; y += 5) for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    C.add('roof', paint(box(oz ? 0.7 : 0.12, 1.2, ox ? 0.7 : 0.12, x + ox * (S * 0.485), y, z + oz * (S * 0.485)), DARK), undefined, false);
  }
  // the lantern of the lighthouse
  C.add('roof', paint(cylinder(1.3, 1.3, 1.0, 12, base + Ht).translate(x, 0, z), new THREE.Color('#eae6dc')), undefined, false);
  C.add('glass', cylinder(1.1, 1.1, 1.5, 12, base + Ht + 1.0).translate(x, 0, z), undefined, false);
  C.add('roof', paint(new THREE.ConeGeometry(1.4, 1.1, 12).translate(x, base + Ht + 3.05, z), new THREE.Color('#c93a2e')), undefined, false);
  k.markPoly(b.p, k.flags.BLD, 1);
}

/** The Kalaout el-Koubba (11th century?): a square hall under a dome with zigzag ribs, unique in Tunisia. */
function koubba(b: Building, k: TownKit) {
  const { C, paint } = k;
  const p = b.p;
  const { lo, hi } = k.footprintGround(p);
  const top = hi + 6.5;
  C.add('block', k.walls(p, lo - 0.6, top, 0));
  const roof = k.flat(p, top);
  if (roof) C.add('roof', paint(roof, new THREE.Color('#d9cdb3')));
  const [x, z] = KOBBA;
  C.add('block', box(9, 2.4, 9, x, top + 1.2, z));
  C.add('block', cylinder(4.1, 4.3, 1.6, 16, top + 2.4).translate(x, 0, z));
  C.add('block', ribbedDome(4.1, 20, true).translate(x, top + 4.0, z), undefined, false);
  merlons(k, frame(x - 4.5, top + 2.4, z - 4.5, [1, 0]), 9);
}
