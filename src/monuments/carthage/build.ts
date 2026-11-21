/**
 * Carthage, from Byrsa Hill to the sea: the shared terrain-town builder with Carthage's data and its monuments.
 * - Antonine Baths (145–162 CE): only the basement level survives. Modelled from the known plan: a symmetrical
 *   complex about 200 m along the shore, vaulted service rooms, the frigidarium's massive piers and its one
 *   re-erected granite column (at its real, mapped position), the caldarium apses facing the sea, the
 *   horseshoe latrines, the natatio, column stumps of the palaestrae, fallen drums and capitals.
 * - Byrsa Hill: the Cathédrale Saint-Louis (1890) on its real footprint and the excavated Punic quarter.
 * - The Roman theatre fitted to its mapped outline; the Villa de la Volière's peristyle; low walls on other ruins.
 * Positions and outlines come from OpenStreetMap; heights from terrain data. Details are simplified.
 * Scene frame: origin 36.8550 N, 10.3290 E, x = east, z = south, y = metres above sea level.
 */
import * as THREE from 'three';
import TOWN from '../../content/carthage-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { box, cylinder } from '../el-jem/geometry';
import { GRANITE, MARBLE, column, lowRuins, romanTheatre } from '../common/roman';

/** The re-erected column of the frigidarium (OpenStreetMap "Colonnes des Thermes d'Antonin"). */
export const COLUMN: P2 = [555, 51];
/** Along the shore (NNE) and towards the sea (ESE), from the coastline next to the baths. */
const U: P2 = [0.535, -0.845], V: P2 = [0.845, 0.535];
/** Baths frame: u along the shore, v towards the sea, origin at the column. */
export const bathsAt = (u: number, v: number): P2 => [COLUMN[0] + U[0] * u + V[0] * v, COLUMN[1] + U[1] * u + V[1] * v];
const BATHS_YAW = -Math.atan2(U[1], U[0]);

export function buildCarthage(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  return buildTerrainTown(materials, site, {
    data: TOWN as unknown as TownData,
    core: 0, // no old medina here: villas with gardens around the archaeological parks
    spawn: { x: 470, z: 0 },          // in the baths park, on the landward side
    look: { x: COLUMN[0], z: COLUMN[1], h: 8 },
    lights: [
      [470, 0, 3.5, 60, 26],          // baths park entrance
      [-470, 165, 3.5, 70, 30],       // Byrsa esplanade by the cathedral
      [44, -300, 4, 70, 32],          // theatre
    ],
    special: (b, k) => {
      if (b.k === 'cathedral') { cathedral(b, k); return true; }
      if (/voliera|volière/i.test(b.name || '')) { peristyle(b.p, k); return true; }
      if (b.k === 'ruins') { lowRuins(b.p, k, 2.2, 7); return true; }
      return false;
    },
    extras: (k) => {
      antonineBaths(k);
      for (const a of k.areas) {
        if (a.k !== 'ruins') continue;
        if (/Théâtre/i.test(a.name || '')) theatre(a.p, k);
        else lowRuins(a.p, k, 1.6, 9);
        k.markPoly(a.p, k.flags.KEEP);
      }
      punicQuarter(k);
    },
  });
}

// ---------------------------------------------------------------------------


/** Box in the baths frame (u along the shore, v towards the sea), from y0 up h metres. */
function bathsBox(k: TownKit, u: number, v: number, lu: number, lv: number, y0: number, h: number, mat: 'rubble' | 'block' = 'rubble', collide = true) {
  const [x, z] = bathsAt(u, v);
  const m = new THREE.Matrix4().makeRotationY(BATHS_YAW).setPosition(x, 0, z);
  k.C.add(mat, box(lu, h, lv, 0, y0 + h / 2, 0), m, collide);
}

function antonineBaths(k: TownKit) {
  const { groundAt, rnd } = k;
  // ground level of the basement: the lowest ground under the building, dug down a little
  let base = Infinity;
  for (let u = -100; u <= 100; u += 20) for (let v = -60; v <= 35; v += 19) base = Math.min(base, groundAt(...bathsAt(u, v)));
  base = Math.max(0.4, base - 0.4);
  // keep the whole park free of generated houses
  const outline: P2[] = [bathsAt(-110, -70), bathsAt(110, -70), bathsAt(110, 45), bathsAt(-110, 45)];
  k.markPoly(outline, k.flags.KEEP);
  // basement floor (beaten earth and broken paving)
  const floor = k.flat(outline, (x, z) => Math.max(base, Math.min(groundAt(x, z), base + 0.15)) + 0.02);
  if (floor) k.C.add('ground', floor);

  const inFrig = (u: number, v: number) => Math.abs(u) < 26 && Math.abs(v) < 12;
  const inNatatio = (u: number, v: number) => Math.abs(u) < 30 && v > -58 && v < -32;
  // vaulted service rooms: a grid of ruined walls with doorways, higher towards the centre
  for (let u = -98; u <= 98; u += 7) {
    for (let v = -58; v < 33; v += 6.5) {
      if (inFrig(u, v) || inNatatio(u, v)) continue;
      const centre = 1 - Math.min(1, Math.hypot(u / 110, v / 70));
      // wall along v (a cross wall) and along u, each with a chance of being lost
      if (rnd() < 0.55) {
        const h = 1.2 + centre * 5 + rnd() * 2.5;
        bathsBox(k, u, v + 3.25, 1.1, 6.5 - (rnd() < 0.5 ? 1.6 : 0), base - 0.5, h);
      }
      if (rnd() < 0.45) {
        const h = 1 + centre * 4 + rnd() * 2;
        bathsBox(k, u + 3.5, v, 7 - (rnd() < 0.6 ? 1.8 : 0), 1.1, base - 0.5, h);
      }
    }
  }
  // rough cores of fallen vaults and piers: big shapeless masses of Roman concrete
  for (let i = 0; i < 26; i++) {
    const u = (rnd() - 0.5) * 170, v = -50 + rnd() * 75;
    if (inFrig(u, v)) continue;
    const sz = 3 + rnd() * 5;
    const [x, z] = bathsAt(u, v);
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4)).setPosition(x, base + sz * 0.3, z);
    k.C.add('rubble', box(sz, sz * (0.6 + rnd() * 0.6), sz * (0.7 + rnd() * 0.5)), m);
  }
  // frigidarium: eight massive piers around the great cold hall
  for (const u of [-21, -7, 7, 21]) for (const v of [-9, 9]) bathsBox(k, u, v, 4, 4, base - 0.5, 4 + rnd() * 5, 'block');
  // the re-erected column, at its real position, and fallen drums and capitals around the hall
  column(k, COLUMN[0], COLUMN[1], base, 12.2, 0.75);
  // its shorter companion, nearer the sea (both stand in visitor photos)
  { const [x, z] = bathsAt(-15, 7); column(k, x, z, base, 6.8, 0.68); }
  for (let i = 0; i < 9; i++) {
    const [x, z] = bathsAt((rnd() - 0.5) * 50, (rnd() - 0.5) * 22);
    if (Math.hypot(x - COLUMN[0], z - COLUMN[1]) < 3) continue;
    if (i % 3 === 2) k.C.add('roof', k.paint(box(1.6, 1.1, 1.6, x, base + 0.55, z), MARBLE));
    else column(k, x, z, base, 2.5 + rnd() * 3, 0.7, { fallenYaw: rnd() * Math.PI });
  }
  // natatio (swimming pool) on the land side: a sunken basin with its rim
  {
    const rim: P2[] = [bathsAt(-30, -58), bathsAt(30, -58), bathsAt(30, -32), bathsAt(-30, -32)];
    k.C.add('block', k.walls(rim, base - 1.8, base + 0.6, 0));
    const f = k.flat(rim, base - 1.6); if (f) k.C.add('paving', f);
  }
  // caldarium: five apses facing the sea, the central one the largest
  for (const [uc, R] of [[-44, 6.5], [-22, 7.5], [0, 9.5], [22, 7.5], [44, 6.5]] as [number, number][]) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.18) continue; // breaks in the wall
      const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI;
      const am = (a0 + a1) / 2;
      const u = uc + Math.cos(am) * R, v = 30 + Math.sin(am) * R;
      const [x, z] = bathsAt(u, v);
      const seg = 2 * R * Math.sin((a1 - a0) / 2) + 0.2;
      const h = 3 + (R / 9.5) * 5 + rnd() * 2.5;
      const yaw = BATHS_YAW - am + Math.PI / 2;
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
      k.C.add('rubble', box(seg, h, 1.6, 0, base - 0.5 + h / 2, 0), m);
    }
  }
  // latrines (horseshoe room with a stone bench) at the north end
  {
    const [cx, cz] = bathsAt(80, -36);
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (i / 14) + Math.PI / 2;
      const x = cx + U[0] * Math.cos(a) * 7 + V[0] * Math.sin(a) * 7, z = cz + U[1] * Math.cos(a) * 7 + V[1] * Math.sin(a) * 7;
      k.C.add('rubble', box(1.7, 2.2, 1.7, x, base + 0.6, z));
      const xb = cx + U[0] * Math.cos(a) * 5.8 + V[0] * Math.sin(a) * 5.8, zb = cz + U[1] * Math.cos(a) * 5.8 + V[1] * Math.sin(a) * 5.8;
      k.C.add('roof', k.paint(box(1.4, 0.5, 1.4, xb, base + 0.25, zb), MARBLE));
    }
  }
  // palaestrae at both ends: column stumps around open courts
  for (const side of [-1, 1]) for (let u = 62; u <= 96; u += 5) for (const v of [-50, -20]) {
    if (rnd() < 0.3) continue;
    const [x, z] = bathsAt(side * u, v);
    k.C.add('roof', k.paint(cylinder(0.42, 0.45, 0.8 + rnd() * 2, 12, base).translate(x, 0, z), GRANITE));
  }
  // park around the ruins: palms, pines and paths are in the map data
  for (let i = 0; i < 70; i++) {
    const u = (rnd() - 0.5) * 260, v = -95 + rnd() * 30;
    const [x, z] = bathsAt(u, v);
    if (groundAt(x, z) < 0.6) continue;
    (rnd() < 0.5 ? k.props.palms.push(new THREE.Vector3(x, groundAt(x, z), z)) : k.props.trees.push({ x, z, y: groundAt(x, z), yaw: rnd() * 6 }));
  }
}

/** Cathédrale Saint-Louis: nave on the real footprint, twin towers on the façade, dome over the crossing. */
function cathedral(b: Building, k: TownKit) {
  const { C, paint, groundAt } = k;
  const p = b.p, c = k.centroid(p);
  // long axis: the farthest pair of corners
  let a = p[0], e = p[1], best = 0;
  for (const q of p) for (const r of p) { const d = Math.hypot(q[0] - r[0], q[1] - r[1]); if (d > best) { best = d; a = q; e = r; } }
  // façade end: towards the esplanade, east
  if (a[0] > e[0]) [a, e] = [e, a];
  const ux = (e[0] - a[0]) / best, uz = (e[1] - a[1]) / best, yaw = -Math.atan2(uz, ux);
  const { lo, hi } = k.footprintGround(p);
  const cream = new THREE.Color('#e9dcc1'), band = new THREE.Color('#cdb48a'), dark = new THREE.Color('#2c2a28');
  const len = best * 0.92, wid = 21;
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(c[0], 0, c[1]);
  C.add('roof', paint(box(len, hi - lo + 17, wid, 0, lo - 0.5 + (hi - lo + 17) / 2, 0), cream), m);
  C.add('roof', paint(box(len * 0.3, hi - lo + 19, wid + 14, len * 0.08, lo - 0.5 + (hi - lo + 19) / 2, 0), cream), m); // transept
  for (const y of [hi + 6, hi + 12.5]) C.add('roof', paint(box(len + 0.2, 0.5, wid + 0.2, 0, y, 0), band), m, false);
  // windows: tall dark arches along the nave
  for (let s = -len / 2 + 5; s < len / 2 - 5; s += 5) for (const sd of [-1, 1]) C.add('roof', paint(box(1.4, 4.5, 0.1, s, hi + 9, sd * (wid / 2 + 0.05)), dark), m, false);
  // twin towers on the façade with small domes
  for (const sd of [-1, 1]) {
    const tx = len / 2 - 3.5, tz = sd * (wid / 2 - 3.5), th = hi - lo + 31;
    C.add('roof', paint(box(7.5, th, 7.5, tx, lo - 0.5 + th / 2, tz), cream), m);
    C.add('roof', paint(box(8.3, 0.6, 8.3, tx, lo - 0.5 + th, tz), band), m, false);
    C.add('roof', paint(new THREE.SphereGeometry(3.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(tx, lo - 0.5 + th + 0.5, tz), cream), m, false);
    for (let i = 0; i < 4; i++) C.add('roof', paint(box(i % 2 ? 0.1 : 1.6, 3.4, i % 2 ? 1.6 : 0.1, tx + [3.8, 0, -3.8, 0][i], hi + 22, tz + [0, 3.8, 0, -3.8][i]), dark), m, false);
  }
  // façade portal
  C.add('roof', paint(box(0.1, 7, 5, len / 2 + 0.05, hi + 3.5, 0), dark), m, false);
  // central dome on a drum over the crossing, with a lantern
  const dx = len * 0.08, drumY = hi + 17;
  C.add('roof', paint(cylinder(8.5, 8.5, 5, 24, drumY).translate(0, 0, 0), cream), new THREE.Matrix4().makeRotationY(yaw).setPosition(c[0] + ux * dx, 0, c[1] + uz * dx), false);
  C.add('roof', paint(new THREE.SphereGeometry(8.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, drumY + 5, 0), cream), new THREE.Matrix4().makeRotationY(yaw).setPosition(c[0] + ux * dx, 0, c[1] + uz * dx), false);
  C.add('roof', paint(cylinder(1.4, 1.4, 3, 10, drumY + 13.3).translate(c[0] + ux * dx, 0, c[1] + uz * dx), cream), undefined, false);
  void groundAt;
}

/** Excavated Punic houses on the south slope of Byrsa: low walls along narrow streets. */
function punicQuarter(k: TownKit) {
  const cat = k.buildings.find((b) => b.k === 'cathedral');
  if (!cat) return;
  const c = k.centroid(cat.p);
  const cx = c[0] + 15, cz = c[1] + 80, rnd = k.rnd;
  const area: P2[] = [[cx - 35, cz - 22], [cx + 35, cz - 22], [cx + 35, cz + 22], [cx - 35, cz + 22]];
  k.markPoly(area, k.flags.KEEP);
  const plaster = new THREE.Color('#e7dccb');
  for (let x = cx - 33; x < cx + 33; x += 5.5) for (let z = cz - 20; z < cz + 20; z += 6) {
    if (Math.abs(z - cz) < 2.2) continue; // the street through the quarter
    const g = k.groundAt(x, z);
    if (rnd() < 0.8) k.C.add('rubble', box(5.5, 0.6 + rnd() * 1.8, 0.6, x + 2.75, g - 0.3 + 0.6, z));
    if (rnd() < 0.7) k.C.add('rubble', box(0.6, 0.6 + rnd() * 1.6, 6, x, g - 0.3 + 0.6, z + 3));
    if (rnd() < 0.12) k.C.add('roof', k.paint(box(1.2, 1.2, 1.2, x + 2, g + 0.3, z + 2), plaster)); // cistern / plastered basin
  }
}

/**
 * Roman theatre. Its OpenStreetMap outline is the ring of the cavea: the arcs centre on THEATRE.c, the
 * orchestra edge is about 13 m out, the top of the seats about 56 m, and it opens to the south-west.
 */
export const THEATRE = { c: [31, -298] as P2, r0: 13, R: 56, open: [-0.59, 0.8] as P2 };
function theatre(_p: P2[], k: TownKit) {
  romanTheatre(k, { c: THEATRE.c, r0: THEATRE.r0, R: THEATRE.R, open: THEATRE.open });
}

/** Peristyle of a Roman villa (Villa de la Volière): low walls and a colonnade around a garden court. */
function peristyle(p: P2[], k: TownKit) {
  lowRuins(p, k, 1.2, 4);
  const b = k.bbox(p), c = k.centroid(p);
  const hx = (b.x1 - b.x0) * 0.3, hz = (b.z1 - b.z0) * 0.3;
  for (let i = 0; i < 4; i++) for (let t = 0; t < 4; t++) {
    const f = t / 4;
    const corners: P2[] = [[c[0] - hx, c[1] - hz], [c[0] + hx, c[1] - hz], [c[0] + hx, c[1] + hz], [c[0] - hx, c[1] + hz]];
    const a = corners[i], e = corners[(i + 1) % 4];
    const x = a[0] + (e[0] - a[0]) * f, z = a[1] + (e[1] - a[1]) * f;
    column(k, x, z, k.groundAt(x, z) - 1.2, 3.4, 0.24);
  }
}

