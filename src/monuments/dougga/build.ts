/**
 * Dougga (Thugga): the best-preserved Roman town of North Africa, on a hillside above olive groves.
 * Positions and outlines of every monument come from OpenStreetMap; terrain from AWS Terrain Tiles.
 * Built with the shared terrain builder (no generated houses: this is an archaeological site) and the
 * shared Roman pieces (../common/roman.ts):
 * - the Capitol (166–167 CE): podium, porch of four Corinthian columns and one on each side, cella, pediment;
 * - the theatre (168–169 CE, about 3,500 seats) fitted to its outline;
 * - the Temple of Juno Caelestis in its semicircular colonnaded court;
 * - the Libyco-Punic mausoleum (2nd century BCE, about 21 m), the arches of Septimius Severus and of
 *   Severus Alexander, the Temple of Saturn's porch, the Licinian Baths, the forum and the Square of the Winds;
 * - low walls on the houses, temples, markets and cisterns.
 * Shapes are simplified. Scene frame: origin 36.4228 N, 9.2182 E (by the Capitol), x = east, z = south.
 */
import * as THREE from 'three';
import TOWN from '../../content/dougga-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { LIMESTONE, archFrom, column, lowRuins, outlineWall, romanTheatre, temple } from '../common/roman';
import { box, cylinder } from '../el-jem/geometry';

export const CAPITOL = { c: [-3.1, -4.4] as P2, front: [0.198, 0.98] as P2 };
export const THEATRE = { c: [183.5, -97] as P2, r0: 9.5, R: 35, open: [0, 1] as P2 };
export const JUNO = { c: [-219, 6] as P2, R: 27, front: [0.22, 0.976] as P2 };
export const MAUSOLEUM: P2 = [177.6, 293.2];
export const SQUARE_OF_WINDS: P2 = [21, 10];
const STONE = { shaft: LIMESTONE, capital: LIMESTONE };

export function buildDougga(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  // the archaeological park is mapped as a park: treat it as excavated ground (no garden trees over the ruins)
  const data = { ...(TOWN as unknown as TownData) };
  data.areas = (TOWN.areas as { k: string; name?: string }[]).map((a) => (/Archaeological Park/i.test(a.name ?? '') ? { ...a, k: 'archaeology' } : a));
  return buildTerrainTown(materials, site, {
    data,
    core: 0,
    fill: false,
    spawn: { x: 34, z: 20 },           // on the Square of the Winds
    look: { x: -3, z: -2, h: 9 },      // looking at the Capitol
    lights: [
      [-1, 12, 3.5, 90, 34],           // Capitol
      [183, -88, 4, 80, 36],           // theatre
      [21, 10, 3.5, 50, 24],           // Square of the Winds
    ],
    special: (b, k) => {
      if (b.k !== 'ruins') return false;
      const name = b.name ?? '';
      if (/Capitole/i.test(name)) temple(k, { c: CAPITOL.c, front: CAPITOL.front, w: 14, l: 22, podium: 2.8, cols: 4, sideCols: 1, colH: 8, colR: 0.45, cellaH: 12.5 });
      else if (/Théâtre/i.test(name)) romanTheatre(k, THEATRE, STONE);
      else if (/Junon|Caelestis/i.test(name)) juno(b.p, k);
      else if (/Mausolée/i.test(name)) mausoleum(k);
      else if (/Arc de Septime/i.test(name)) archFrom(b.p, k, 12, 2);
      else if (/Arc de Sévère Alexandre/i.test(name)) archFrom(b.p, k, 10, 3.5);
      else if (/Saturne/i.test(name)) saturn(b.p, k);
      else if (/Forum/i.test(name)) forum(b.p, k);
      else if (/Thermes|baths/i.test(name)) lowRuins(b.p, k, 5.5, 7, 'block');
      else if (/Temple/i.test(name)) smallTemple(b.p, k);
      else if (/Enceinte|Hippodrome/i.test(name)) outlineWall(b.p, k, /Enceinte/.test(name) ? 4 : 1.2);
      else if (/Maison/i.test(name)) lowRuins(b.p, k, 1.5, 5);
      else lowRuins(b.p, k, 2.2, 6);
      k.markPoly(b.p, k.flags.KEEP);
      return true;
    },
    extras: (k) => {
      squareOfWinds(k);
      // olive trees among the ruins, sparser than in the groves around the site
      const park = k.areas.find((a) => a.k === 'archaeology' && /Park/i.test(a.name ?? ''));
      if (park) {
        const b = k.bbox(park.p);
        for (let z = b.z0; z < b.z1; z += 17) for (let x = b.x0; x < b.x1; x += 17) {
          const px = x + (k.rnd() - 0.5) * 8, pz = z + (k.rnd() - 0.5) * 8;
          if (k.rnd() > 0.45 || !k.inPoly(px, pz, park.p) || k.at(px, pz) & (k.flags.BLD | k.flags.KEEP | k.flags.ROAD)) continue;
          k.props.groves.push({ x: px, z: pz, y: k.groundAt(px, pz), yaw: k.rnd() * 6 });
        }
      }
    },
  });
}

// ---------------------------------------------------------------------------

/** Temple of Juno Caelestis: a semicircular colonnaded court around a temple on a podium. */
function juno(p: P2[], k: TownKit) {
  lowRuins(p, k, 0.8, 6, 'block');
  const { c, R, front } = JUNO;
  const sx = -front[1], sz = front[0];
  const g = k.groundAt(c[0], c[1]);
  // the curved portico: columns and a back wall along the half circle away from the entrance
  for (let i = 0; i <= 22; i++) {
    const a = Math.PI * (i / 22);
    const dx = sx * Math.cos(a) - front[0] * Math.sin(a), dz = sz * Math.cos(a) - front[1] * Math.sin(a);
    const wx = c[0] + dx * R, wz = c[1] + dz * R;
    const wh = 1.5 + k.rnd() * 2.5;
    k.C.add('block', box(3.9, wh, 0.9, 0, 0, 0).rotateY(-Math.atan2(-dx, dz)).translate(wx, k.groundAt(wx, wz) - 0.3 + wh / 2, wz));
    if (k.rnd() < 0.55) column(k, c[0] + dx * (R - 4), c[1] + dz * (R - 4), k.groundAt(c[0] + dx * (R - 4), c[1] + dz * (R - 4)) - 0.2, 4.5 + k.rnd() * 1.5, 0.3, { ...STONE, plinth: false });
  }
  temple(k, { c: [c[0] - front[0] * 4, c[1] - front[1] * 4], front, w: 10, l: 15, podium: 2.2, cols: 4, sideCols: 1, colH: 6.5, colR: 0.38, cellaH: 6, ...STONE });
  void g;
}

/** Libyco-Punic mausoleum (of Ateban): stepped podium and three stages topped by a pyramid, about 21 m. */
function mausoleum(k: TownKit) {
  const { C, paint } = k;
  const [x, z] = MAUSOLEUM;
  let y = k.groundAt(x, z) - 0.3;
  const step = (w: number, h: number) => { C.add('block', box(w, h, w, x, y + h / 2, z)); y += h; };
  for (let i = 0; i < 5; i++) step(7.6 - i * 0.35, 0.42);                       // podium steps
  step(6.0, 4.6);                                                              // first stage
  for (const [ox, oz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) C.add('block', box(0.7, 4.6, 0.7, x + ox * 2.85, y - 2.3, z + oz * 2.85), undefined, false); // Aeolic corner pilasters
  step(6.6, 0.5); step(6.2, 0.4);                                              // cornice
  for (let i = 0; i < 3; i++) step(5.6 - i * 0.3, 0.35);                         // steps to the second stage
  const y2 = y; step(4.8, 5.2);                                                // second stage
  for (const s of [-1, 1]) for (const t of [-1.2, 0, 1.2]) {                   // engaged Ionic half-columns
    C.add('block', cylinder(0.28, 0.3, 4.6, 10, y2 + 0.2).translate(x + s * 2.45, 0, z + t), undefined, false);
    C.add('block', cylinder(0.28, 0.3, 4.6, 10, y2 + 0.2).translate(x + t, 0, z + s * 2.45), undefined, false);
  }
  step(5.4, 0.5); step(4.6, 2.6);                                              // third stage
  for (const [ox, oz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) C.add('block', box(0.6, 1.4, 0.6, x + ox * 2.4, y + 0.7, z + oz * 2.4), undefined, false); // corner statues (horsemen)
  C.add('block', new THREE.ConeGeometry(3.1, 4.6, 4).rotateY(Math.PI / 4).translate(x, y + 2.3, z));   // pyramid
  C.add('roof', paint(box(0.5, 1.2, 0.5, x, y + 5.1, z), LIMESTONE), undefined, false);             // crowning figure
}

/** Temple of Saturn: the sanctuary's ruins with the four re-erected columns of its porch. */
function saturn(p: P2[], k: TownKit) {
  lowRuins(p, k, 2.4, 6, 'block');
  // the porch faces the town: the side whose midpoint is nearest the Capitol
  let best: [P2, P2] = [p[0], p[1]], bd = Infinity;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 20) continue;
    const d = Math.hypot((a[0] + b[0]) / 2 - CAPITOL.c[0], (a[1] + b[1]) / 2 - CAPITOL.c[1]);
    if (d < bd) { bd = d; best = [a, b]; }
  }
  const [a, b] = best, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  const c = k.centroid(p);
  let nx = -uz, nz = ux; // inward
  if (((a[0] + b[0]) / 2 - c[0]) * nx + ((a[1] + b[1]) / 2 - c[1]) * nz > 0) { nx = -nx; nz = -nz; }
  for (let i = 0; i < 4; i++) {
    const s = L / 2 + (i - 1.5) * 4.2, x = a[0] + ux * s + nx * 4, z = a[1] + uz * s + nz * 4;
    column(k, x, z, k.groundAt(x, z) - 0.2, 7, 0.4, STONE);
  }
}

/** Forum: paved, with the stumps of its porticoes along the sides. */
function forum(p: P2[], k: TownKit) {
  const f = k.flat(p, (x, z) => k.groundAt(x, z) + 0.06);
  if (f) k.C.add('paving', f);
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 2; s < L - 1; s += 3.6) {
      if (k.rnd() < 0.35) continue;
      const x = a[0] + ((b[0] - a[0]) * s) / L, z = a[1] + ((b[1] - a[1]) * s) / L;
      const h = k.rnd() < 0.15 ? 4 + k.rnd() * 2 : 0.6 + k.rnd() * 1.2;
      k.C.add('roof', k.paint(cylinder(0.3, 0.34, h, 10, k.groundAt(x, z)).translate(x, 0, z), LIMESTONE));
    }
  }
}

/** Square of the Winds: paved square with the compass rose of twelve winds cut in the paving. */
function squareOfWinds(k: TownKit) {
  const [x, z] = SQUARE_OF_WINDS, ring: P2[] = [], inner: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; ring.push([x + Math.cos(a) * 13, z + Math.sin(a) * 13]); }
  k.markPoly(ring, k.flags.KEEP);
  const g = k.groundAt(x, z);
  const f = k.flat(ring, g + 0.08); if (f) k.C.add('paving', f);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; inner.push([x + Math.cos(a) * 8.6, z + Math.sin(a) * 8.6]); }
  const darker = new THREE.Color('#a8957a');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    k.C.add('roof', k.paint(box(1.6, 0.04, 0.35, 0, 0, 0).rotateY(-a).translate(x + Math.cos(a) * 9.3, g + 0.11, z + Math.sin(a) * 9.3), darker), undefined, false);
  }
  void inner;
}

/** A small temple's ruins: a raised podium with low walls and a couple of column stumps. */
function smallTemple(p: P2[], k: TownKit) {
  const { lo, hi } = k.footprintGround(p);
  const top = hi + 1.2;
  k.C.add('block', k.walls(p, lo - 0.4, top, 0));
  const t = k.flat(p, top); if (t) k.C.add('paving', t);
  lowRuins(p, k, 1.6, 5, 'block');
  const c = k.centroid(p);
  for (let i = 0; i < 2; i++) column(k, c[0] + (i - 0.5) * 3, c[1], top, 1.5 + k.rnd() * 3, 0.32, { ...STONE, plinth: false });
}

export type { Building };
