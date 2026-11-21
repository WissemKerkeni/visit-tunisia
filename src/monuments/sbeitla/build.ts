/**
 * Sbeitla (Sufetula): a Roman town on the high steppe, famous for the three temples of its forum.
 * Outlines and positions from OpenStreetMap (the ruins are mapped as areas), terrain from AWS Terrain Tiles;
 * built on the shared terrain-town builder (the modern town's houses generated outside the archaeological park)
 * and the shared Roman pieces (../common/roman.ts):
 * - the forum in its mapped enclosure: the Antonine gate (139 CE) on the east, porticoes on the long sides,
 *   the paved square, and the three temples of the Capitoline triad side by side on the west, linked by arches;
 * - the Arch of the Tetrarchy (about 300 CE) on the road from the south, three bays;
 * - the theatre above the wadi, the great baths, the Byzantine churches (Bellator, Vitalis with its baptistery,
 *   Servus, Jucundus), the small Byzantine forts, the amphitheatre, the aqueduct bridge and lesser ruins.
 * Shapes are simplified. Scene frame: origin 35.2400 N, 9.1195 E, x = east, z = south.
 */
import * as THREE from 'three';
import TOWN from '../../content/sbeitla-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { arch, archFrom, column, lowRuins, outlineWall, romanTheatre, temple } from '../common/roman';
import { box } from '../el-jem/geometry';

type Area = { k: string; name?: string; p: P2[] };
const AREAS = TOWN.areas as Area[];
const centroidOf = (p: P2[]): P2 => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const areaAt = (re: RegExp) => AREAS.find((a) => a.k === 'ruins' && re.test(a.name ?? ''));
const at = (re: RegExp, fallback: P2): P2 => { const a = areaAt(re); return a ? centroidOf(a.p) : fallback; };

/**
 * Forum frame from its mapped enclosure: u from the east side (the Antonine gate) towards the temples in the
 * west, v from the south side to the north. The enclosure is about 76 × 70 m; the open square u 3..43.
 */
const FO_O: P2 = [41.2, 1.5];
const FO_U: P2 = [-0.942, -0.335];
const FO_V: P2 = [0.335, -0.942];
export const FO_L = 76, FO_W = 70;
export const fo = (u: number, v: number): P2 => [FO_O[0] + FO_U[0] * u + FO_V[0] * v, FO_O[1] + FO_U[1] * u + FO_V[1] * v];
/** Direction the temples face (east, towards the square and the gate). */
const EAST: P2 = [-FO_U[0], -FO_U[1]];
/** Centres of the three temples (north to south: Minerva?, Jupiter, Juno? — the attribution is debated). */
export const TEMPLES: P2[] = [fo(59, 52.5), fo(61, 35), fo(59, 17.5)];

export const TETRARCHY = at(/T[ée]trarchie/i, [366, 485]);
export const ANTONINE = at(/Antonimus|Antonin/i, [54, -38]);
export const THEATRE_SPEC = { c: [284, 41] as P2, r0: 9, R: 40, open: [0.977, -0.214] as P2 };
export const BATHS = at(/Grand Thermes/i, [190, 45]);
export const VITALIS = at(/Vitalis/i, [-24, -221]);
export const BELLATOR = at(/Bellator/i, [33, -179]);
export const FORT = at(/Fortin/i, [145, 285]);
export const AMPHI = at(/Amphith/i, [-447, -405]);

/** The warm orange limestone of Sufetula. */
const OCHRE = new THREE.Color('#a77a50');
const STONE = { shaft: OCHRE, capital: OCHRE };
const PAVE = new THREE.Color('#c8b48e');

export function buildSbeitla(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  // the archaeological park is mapped as a garden: treat it as excavated ground (no garden trees or houses)
  const data = { ...(TOWN as unknown as TownData) };
  data.areas = (TOWN.areas as Area[]).map((a) => (/Ruines romaines/i.test(a.name ?? '') ? { ...a, k: 'archaeology' } : a));
  const spawn = fo(-30, 40), look = fo(60, 35), sq = fo(22, 35);
  return buildTerrainTown(materials, site, {
    data,
    core: 0,
    treeR: 200,
    scrub: 0.6,
    flatten: [{ p: [fo(-2, -2), fo(-2, FO_W + 2), fo(FO_L + 2, FO_W + 2), fo(FO_L + 2, -2)], pad: 12 }],
    spawn: { x: spawn[0], z: spawn[1] },          // outside the Antonine gate, looking through it at the temples
    look: { x: look[0], z: look[1], h: 9 },
    lights: [
      [sq[0], sq[1], 4, 120, 50],                   // the forum, floodlit
      [THEATRE_SPEC.c[0], THEATRE_SPEC.c[1], 4, 60, 35],
      [TETRARCHY[0], TETRARCHY[1], 3, 50, 25],
    ],
    special: (b: Building, k: TownKit) => {
      const name = b.name ?? '';
      if (/^Forum$/i.test(name)) { forum(k); return true; }
      if (b.k === 'ruins') { lowRuins(b.p, k, 2, 6, 'block'); return true; }
      return false;
    },
    extras: (k) => {
      for (const a of k.areas as Area[]) {
        if (a.k !== 'ruins') continue;
        const name = a.name ?? '', p = a.p;
        if (/T[ée]trarchie/i.test(name)) { archFrom(p, k, 11, 0); k.markPoly(p, k.flags.KEEP, 6); }
        else if (/Antonimus|Antonin/i.test(name)) tripleArch(p, k, 10.5);
        else if (/Arc septentrional/i.test(name)) archFrom(p, k, 7.5, 2.5);
        else if (/^Th[ée][âa]tre$/i.test(name)) theatre(k);
        else if (/Amphith/i.test(name)) amphitheatre(p, k);
        else if (/Basilique|[ÉE]glise|Chapelle/i.test(name)) basilica(p, k, /Bellator|Vitalis/i.test(name));
        else if (/Fortin/i.test(name)) fortin(p, k);
        else if (/Pont Aqueduc/i.test(name)) aqueduct(p, k);
        else if (/Thermes/i.test(name)) lowRuins(p, k, /Grand/i.test(name) ? 4.5 : 3, 6, 'block');
        else if (/Temple/i.test(name)) temple(k, { c: centroidOf(p), front: EAST, w: 8, l: 13, podium: 1.8, cols: 4, sideCols: 0, colH: 3.5, colR: 0.3, cellaH: 2.5, porch: 0.35, pediment: false, ...STONE });
        else lowRuins(p, k, 2.2, 6, 'rubble');
        k.markPoly(p, k.flags.KEEP);
      }
      // olive trees among the ruins, as around the site
      const park = k.areas.find((a) => a.k === 'archaeology');
      if (park) {
        const b = k.bbox(park.p);
        for (let z = b.z0; z < b.z1; z += 19) for (let x = b.x0; x < b.x1; x += 19) {
          const px = x + (k.rnd() - 0.5) * 8, pz = z + (k.rnd() - 0.5) * 8;
          if (k.rnd() > 0.4 || !k.inPoly(px, pz, park.p) || k.at(px, pz) & (k.flags.BLD | k.flags.KEEP | k.flags.ROAD)) continue;
          k.props.groves.push({ x: px, z: pz, y: k.groundAt(px, pz), yaw: k.rnd() * 6 });
        }
      }
    },
  });
}

// ---------------------------------------------------------------------------

/** The forum: enclosure wall, Antonine gate (built from its own outline), porticoes, paving, three temples. */
function forum(k: TownKit) {
  const { C, paint } = k;
  const outline = [fo(0, 0), fo(0, FO_W), fo(FO_L, FO_W), fo(FO_L, 0)];
  const { lo, hi } = k.footprintGround(outline);
  const F = hi + 0.15;
  const M = (u: number, v: number, y: number) => { const [x, z] = fo(u, v); return new THREE.Matrix4().makeRotationY(-Math.atan2(FO_V[1], FO_V[0])).setPosition(x, y, z); };
  // paving of the square (big limestone slabs), and the raised terrace of the temples
  { const g = box(FO_W - 6, F - lo + 0.6, 40, 0, 0, 0); C.add('paving', g, M(23, FO_W / 2, (lo - 0.6 + F) / 2)); }
  for (let i = 1; i < 10; i++) C.add('roof', paint(box(FO_W - 7.4, 0.03, 0.12, 0, 0, 0), new THREE.Color('#a8956f')), M(3 + i * 4, FO_W / 2, F + 0.01), false);
  C.add('roof', paint(box(FO_W - 6, F - lo + 1.8, 31, 0, 0, 0), PAVE), M(59, FO_W / 2, (lo - 0.6 + F + 1.2) / 2));
  // steps up to the temple terrace
  for (let s = 0; s < 4; s++) C.add('roof', paint(box(FO_W - 8, 0.3 * (s + 1), 0.4, 0, 0, 0), PAVE), M(43.3 + s * 0.4 - 1.2, FO_W / 2, F + 0.15 * (s + 1)), false);
  // the enclosure wall (low, ruined) with a gap for the gate on the east
  const wall = (u0: number, v0: number, u1: number, v1: number) => {
    const a = fo(u0, v0), b = fo(u1, v1);
    outlineWall([a, b], k, 3.2, false);
  };
  wall(FO_L, 0, FO_L, FO_W);
  wall(0, 0, FO_L, 0); wall(0, FO_W, FO_L, FO_W);
  wall(0, 0, 0, 36); wall(0, 47, 0, FO_W);
  // porticoes along the north and south sides: columns, some standing to full height, some broken
  for (const v of [3.0, FO_W - 3.0]) for (let u = 4; u < 43; u += 3.4) {
    const [x, z] = fo(u, v), r = k.rnd();
    if (r < 0.15) continue;
    column(k, x, z, F - 0.1, r < 0.55 ? 5.2 : 1.5 + k.rnd() * 2.5, 0.3, { ...STONE, plinth: false });
  }
  // the three temples on their podiums, facing the gate; the central one a little larger and set back
  // roofless today; the north temple has lost its pediment and much of its cella
  const T0 = { front: EAST, cols: 4, sideCols: 2, colR: 0.45, porch: 0.4, pediment: true, roof: false, ...STONE };
  temple(k, { ...T0, c: TEMPLES[0], w: 12.5, l: 25, podium: 2.6, colH: 8.2, cellaH: 7, pediment: false });
  temple(k, { ...T0, c: TEMPLES[1], w: 14, l: 27, podium: 3.0, colH: 8.8, cellaH: 11.5 });
  temple(k, { ...T0, c: TEMPLES[2], w: 12.5, l: 25, podium: 2.6, colH: 8.2, cellaH: 10.5 });
  // arches linking the temples
  for (const v of [26.2, 43.8]) arch(k, fo(49, v), EAST, 3.2, 2.2, 7.2, 0);
  k.markPoly(outline, k.flags.KEEP, 4);
}

/** A gate of three bays (the Antonine gate of the forum): a central arch between two smaller ones, from the mapped footprint. */
function tripleArch(p: P2[], k: TownKit, height: number) {
  const { c, face, width, depth } = archFrom(p, k, height, 0);
  for (const s of [-1, 1]) {
    const off = width / 2 + 2.6;
    arch(k, [c[0] + face[0] * off * s, c[1] + face[1] * off * s], [face[1], -face[0]], 4.4, depth, height * 0.68, 0);
  }
  k.markPoly(p, k.flags.KEEP, 6);
}

function theatre(k: TownKit) {
  romanTheatre(k, THEATRE_SPEC, STONE);
}

/** The amphitheatre: ruined outer and inner rings of its cavea around the arena. */
function amphitheatre(p: P2[], k: TownKit) {
  const c = centroidOf(p);
  outlineWall(p, k, 4.5);
  outlineWall(p.map(([x, z]) => [c[0] + (x - c[0]) * 0.62, c[1] + (z - c[1]) * 0.62] as P2), k, 2.6);
}

/** A Byzantine basilica: low outer walls, two rows of columns down the nave, an apse at one end. */
function basilica(p: P2[], k: TownKit, big: boolean) {
  lowRuins(p, k, big ? 2.4 : 1.6, 7, 'block');
  // long axis from the longest edge
  let a = p[0], b = p[1], L = 0;
  for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length], d = Math.hypot(r[0] - q[0], r[1] - q[1]); if (d > L) { L = d; a = q; b = r; } }
  const c = centroidOf(p), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  let half = 0; for (const q of p) half = Math.max(half, Math.abs((q[0] - c[0]) * -uz + (q[1] - c[1]) * ux));
  const len = L * 0.85, rowOff = half * 0.38;
  for (const s of [-1, 1]) for (let t = -len / 2 + 1.5; t <= len / 2 - 1.5; t += 3.2) {
    const x = c[0] + ux * t - uz * rowOff * s, z = c[1] + uz * t + ux * rowOff * s, r = k.rnd();
    if (r < 0.2) continue;
    column(k, x, z, k.groundAt(x, z) - 0.2, r < (big ? 0.6 : 0.35) ? 4.4 : 1.2 + k.rnd() * 2, 0.26, { ...STONE, plinth: false });
  }
}

/** A small Byzantine fort: thick walls standing high, ruined at the top. */
function fortin(p: P2[], k: TownKit) {
  const { lo, hi } = k.footprintGround(p);
  k.C.add('block', k.walls(p, lo - 0.5, hi + 6.5, 0));
  const top = k.flat(p, hi + 6.5);
  if (top) k.C.add('rubble', top);
  lowRuins(p, k, 1.2, 3, 'rubble');
}

/** The aqueduct bridge over the wadi: a row of arches along the mapped outline. */
function aqueduct(p: P2[], k: TownKit) {
  let a = p[0], b = p[1], L = 0;
  for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length], d = Math.hypot(r[0] - q[0], r[1] - q[1]); if (d > L) { L = d; a = q; b = r; } }
  const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, c = centroidOf(p);
  const n = Math.max(2, Math.round(L / 6.5)), w = L / n;
  for (let i = 0; i < n; i++) {
    const t = -L / 2 + (i + 0.5) * w;
    arch(k, [c[0] + ux * t, c[1] + uz * t], [-uz, ux], w - 1.6, 2.4, 7 + k.rnd() * 1.5, k.rnd() < 0.4 ? 2 : 0);
  }
}
