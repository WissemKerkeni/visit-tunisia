/**
 * Bulla Regia: the Roman town at the foot of Jebel Rebia, famous for the underground floors of its houses, built
 * to escape the summer heat of the Medjerda plain.
 * Outlines and positions from OpenStreetMap (45 mapped ruins), terrain from AWS Terrain Tiles; built on the shared
 * terrain-town builder and Roman pieces (../common/roman.ts), with the underground floors cut into the terrain:
 * - the Houses of the Hunt, of Amphitrite and of the Fishing: a light well open to the sky with Corinthian columns
 *   carrying stone architraves and hexagonal openings in the walls above, a portico under a stone ceiling round it,
 *   a vaulted main room, a stair down from the surface, and mosaic floors (generated geometric patterns);
 * - the theatre, the forum with the Temple of Apollo and the Capitol, the Baths of Julia Memmia, the Byzantine
 *   fort, the piers of the triumphal arch, and low walls on every other mapped ruin.
 * Shapes are simplified. Scene frame: origin 36.55884 N, 8.75482 E, x = east, z = south.
 */
import * as THREE from 'three';
import TOWN from '../../content/bulla-regia-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { arch, column, outlineWall, romanTheatre, temple } from '../common/roman';
import { Acc, doorPath, loft, planar } from '../common/vaults';
import { box, cylinder, hash } from '../el-jem/geometry';

type Area = { k: string; name?: string; p: P2[] };
const AREAS = TOWN.areas as Area[];
const BUILDINGS = TOWN.buildings as Building[];
const centroidOf = (p: P2[]): P2 => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const outline = (re: RegExp): P2[] | null => BUILDINGS.find((b) => re.test(b.name ?? ''))?.p ?? AREAS.find((a) => re.test(a.name ?? ''))?.p ?? null;
const at = (re: RegExp, fb: P2): P2 => { const p = outline(re); return p ? centroidOf(p) : fb; };
const inPoly = (x: number, z: number, p: P2[]) => {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};

export const THEATRE = { c: [209.1, 8.5] as P2, r0: 9, R: 33, open: [0.494, 0.87] as P2 };
export const FORUM: P2[] = [[68, -59.2], [57.8, -86], [103.6, -103.4], [116.9, -68.5]];
export const FORUM_C = centroidOf(FORUM);
export const APOLLO = at(/Temple d.Apollon/i, [91, -113]);
export const CAPITOL = at(/Capitole/i, [54, -62]);
export const MEMMIA = at(/Julia Memmia/i, [-39, 151]);
export const FORT = at(/Fort byzantin/i, [-227, 121]);
export const MUSEUM = at(/Mus[ée]e/i, [-29, 253]);

/** The pale grey-gold limestone of the site. */
const STONE_C = new THREE.Color('#9c8c70');
const STONE = { shaft: STONE_C, capital: new THREE.Color('#b3a487') };
const DARK = new THREE.Color('#1c1916');

// ---------------------------------------------------------------------------
// underground houses

/**
 * One underground floor, in a frame (u, v) centred on the house: the floor area B (W across u, L along v) with the
 * light well in its middle, the main room beyond B on the +v side, and the stair down on the -v side.
 */
export interface Villa {
  name: RegExp; c: P2; u: P2; v: P2;
  W: number; L: number; cw: number; cl: number; rw: number; rd: number; stairA: number;
  mosaic: [Pattern, Pattern];
  /** Set when built: floor and ceiling heights. */
  F?: number; Gc?: number;
}
type Pattern = 'squares' | 'circles' | 'diamonds' | 'sea';
export const VILLAS: Villa[] = [];

function villaFrame(name: RegExp, W: number, L: number, cw: number, cl: number, rw: number, rd: number, mosaic: [Pattern, Pattern]): Villa | null {
  const p = outline(name);
  if (!p) return null;
  const c = centroidOf(p);
  let best = 0, u: P2 = [1, 0];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d > best) { best = d; u = [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; }
  }
  let v: P2 = [-u[1], u[0]];
  // the main room on the side that stays inside the house
  if (!inPoly(c[0] + v[0] * (L / 2 + rd), c[1] + v[1] * (L / 2 + rd), p)) v = [-v[0], -v[1]];
  return { name, c, u, v, W, L, cw, cl, rw, rd, stairA: W / 2 - 2.2, mosaic };
}
function planVillas() {
  VILLAS.length = 0;
  for (const f of [
    villaFrame(/Maison de la chasse/i, 15, 15, 7, 7, 4.8, 6, ['squares', 'circles']),
    villaFrame(/Maison d.Amphitrite/i, 14, 13, 6, 5, 4.8, 6, ['diamonds', 'sea']),
    villaFrame(/Maison de la p[êe]che/i, 13, 13, 6, 6, 4.4, 5, ['circles', 'sea']),
  ]) if (f) VILLAS.push(f);
}
planVillas();
const W2 = (V: Villa, a: number, b: number): P2 => [V.c[0] + V.u[0] * a + V.v[0] * b, V.c[1] + V.u[1] * a + V.v[1] * b];
const rectW = (V: Villa, a0: number, a1: number, b0: number, b1: number): P2[] => [W2(V, a0, b0), W2(V, a1, b0), W2(V, a1, b1), W2(V, a0, b1)];
const STAIR_W = 1.8;
/** The stair run (m) for a drop of about 5.2 m. */
const stairRun = (V: Villa, g: (x: number, z: number) => number) => Math.ceil((g(...W2(V, V.stairA, -V.L / 2 - 6)) - (V.F ?? 0)) / 0.25) * 0.3;
/** Footprint of everything below ground (for keeping ruins and trees off it). */
const villaFoot = (V: Villa): P2[] => rectW(V, -V.W / 2 - 1, V.W / 2 + 1, -V.L / 2 - 9, V.L / 2 + V.rd + 1);

/** Levels and the openings cut in the terrain: the light well and the stair trench. */
function villaHoles(g: (x: number, z: number) => number) {
  const out: P2[][] = [];
  for (const V of VILLAS) {
    let lo = Infinity;
    for (let b = -V.L / 2 - 8; b <= V.L / 2 + V.rd; b += 1) for (let a = -V.W / 2; a <= V.W / 2; a += 1) lo = Math.min(lo, g(...W2(V, a, b)));
    V.F = lo - 5.0; V.Gc = V.F + 3.6;
    out.push(rectW(V, -V.cw / 2, V.cw / 2, -V.cl / 2, V.cl / 2));
    // the stair trench, its long sides in short steps so the ground follows the slope
    const run = stairRun(V, g), a0 = V.stairA - STAIR_W / 2, a1 = V.stairA + STAIR_W / 2;
    const side: P2[] = [], other: P2[] = [];
    for (let s = 0; s <= run + 1e-6; s += run / Math.max(2, Math.ceil(run / 1.5))) { side.push(W2(V, a0, -V.L / 2 - s)); other.push(W2(V, a1, -V.L / 2 - s)); }
    out.push([...side, ...other.reverse()]);
  }
  return out;
}

// generated mosaic floors: geometric patterns in the colours of the site's mosaics, laid in tesserae
const PALETTE = { white: '#d6ccb8', black: '#2e2a26', ochre: '#c58a3e', red: '#9b3f2c', grey: '#8d8a83', green: '#5f7a63', blue: '#3e6d86' };
const mosaicCache = new Map<string, THREE.CanvasTexture>();
function mosaicTexture(kind: Pattern, w: number, l: number) {
  const key = `${kind}:${Math.round(w)}x${Math.round(l)}`;
  if (mosaicCache.has(key)) return mosaicCache.get(key)!;
  const S = 1024, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const P = PALETTE;
  g.fillStyle = P.white; g.fillRect(0, 0, S, S);
  const border = 56;
  // a border of black and ochre bands
  g.strokeStyle = P.black; g.lineWidth = 14; g.strokeRect(20, 20, S - 40, S - 40);
  g.strokeStyle = P.ochre; g.lineWidth = 10; g.strokeRect(40, 40, S - 80, S - 80);
  const inner = S - 2 * border;
  if (kind === 'squares') {
    const n = 6, c = inner / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = border + i * c, y = border + j * c;
      g.strokeStyle = P.black; g.lineWidth = 6; g.strokeRect(x + 10, y + 10, c - 20, c - 20);
      g.fillStyle = (i + j) % 2 ? P.red : P.ochre;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.beginPath(); g.ellipse(x + c / 2 + Math.cos(a) * c * 0.18, y + c / 2 + Math.sin(a) * c * 0.18, c * 0.13, c * 0.06, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = P.black; g.beginPath(); g.arc(x + c / 2, y + c / 2, c * 0.07, 0, Math.PI * 2); g.fill();
    }
  } else if (kind === 'circles') {
    const n = 6, c = inner / n;
    g.lineWidth = 9;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      g.strokeStyle = (i + j) % 2 ? P.black : P.grey;
      g.beginPath(); g.arc(border + i * c, border + j * c, c * 0.71, 0, Math.PI * 2); g.stroke();
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { g.fillStyle = P.red; g.beginPath(); g.arc(border + (i + 0.5) * c, border + (j + 0.5) * c, c * 0.1, 0, Math.PI * 2); g.fill(); }
  } else if (kind === 'diamonds') {
    const n = 5, c = inner / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = border + (i + 0.5) * c, y = border + (j + 0.5) * c;
      g.fillStyle = (i + j) % 2 ? P.ochre : P.red;
      g.beginPath(); g.moveTo(x, y - c * 0.42); g.lineTo(x + c * 0.42, y); g.lineTo(x, y + c * 0.42); g.lineTo(x - c * 0.42, y); g.closePath(); g.fill();
      g.fillStyle = P.white; g.beginPath(); g.moveTo(x, y - c * 0.2); g.lineTo(x + c * 0.2, y); g.lineTo(x, y + c * 0.2); g.lineTo(x - c * 0.2, y); g.closePath(); g.fill();
      g.fillStyle = P.black; g.fillRect(x - 6, y - 6, 12, 12);
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(x + dx * c / 2, y + dy * c / 2); g.lineTo(x + dx * c / 2 - dx * c * 0.16, y + dy * c / 2); g.lineTo(x + dx * c / 2, y + dy * c / 2 - dy * c * 0.16); g.closePath(); g.fill(); }
    }
  } else {
    // a sea: blue-green waves with fish and dolphins round a medallion with a plain head-and-shoulders bust
    g.fillStyle = '#d9d4c3'; g.fillRect(border, border, inner, inner);
    g.strokeStyle = P.blue; g.lineWidth = 6;
    for (let y = border + 30; y < S - border; y += 46) { g.beginPath(); for (let x = border; x <= S - border; x += 8) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 6); g.stroke(); }
    for (let k = 0; k < 14; k++) {
      const x = border + 60 + hash(k * 3.1) * (inner - 120), y = border + 60 + hash(k * 7.7) * (inner - 120), s = 24 + hash(k * 1.9) * 26, dir = hash(k) < 0.5 ? 1 : -1;
      if (Math.hypot(x - S / 2, y - S / 2) < 230) continue;
      g.fillStyle = k % 3 ? P.ochre : P.grey;
      g.beginPath(); g.ellipse(x, y, s, s * 0.38, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(x - dir * s, y); g.lineTo(x - dir * s * 1.6, y - s * 0.4); g.lineTo(x - dir * s * 1.6, y + s * 0.4); g.closePath(); g.fill();
      g.fillStyle = P.black; g.beginPath(); g.arc(x + dir * s * 0.6, y - s * 0.08, 4, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = P.white; g.beginPath(); g.arc(S / 2, S / 2, 200, 0, Math.PI * 2); g.fill();
    g.strokeStyle = P.red; g.lineWidth = 16; g.beginPath(); g.arc(S / 2, S / 2, 200, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = P.ochre; g.lineWidth = 10; g.beginPath(); g.arc(S / 2, S / 2, 176, 0, Math.PI * 2); g.stroke();
    // a rosette of petals in the medallion
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.fillStyle = k % 2 ? P.red : P.ochre; g.beginPath(); g.ellipse(S / 2 + Math.cos(a) * 92, S / 2 + Math.sin(a) * 92, 70, 26, a, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = P.blue; g.beginPath(); g.arc(S / 2, S / 2, 40, 0, Math.PI * 2); g.fill();
  }
  // lay it in tesserae: each small square takes the colour under it, slightly varied, with grout between
  const T = 3, img = g.getImageData(0, 0, S, S).data;
  g.fillStyle = '#7d766a'; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += T) for (let x = 0; x < S; x += T) {
    const i = ((y + 1) * S + x + 1) * 4, n = 0.88 + hash(x * 0.37 + y * 1.71) * 0.22;
    g.fillStyle = `rgb(${Math.min(255, img[i] * n)},${Math.min(255, img[i + 1] * n)},${Math.min(255, img[i + 2] * n)})`;
    g.fillRect(x, y, T - 1, T - 1);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  mosaicCache.set(key, t);
  return t;
}
/** A mosaic laid flat over a rectangle of the villa frame. */
function mosaic(k: TownKit, V: Villa, a0: number, a1: number, b0: number, b1: number, y: number, kind: Pattern) {
  const w = a1 - a0, l = b1 - b0;
  const g = new THREE.PlaneGeometry(w, l).rotateX(-Math.PI / 2);
  const [cx, cz] = W2(V, (a0 + a1) / 2, (b0 + b1) / 2);
  g.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.atan2(V.u[1], V.u[0])).setPosition(cx, y, cz));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: mosaicTexture(kind, w, l), roughness: 0.8 }));
  m.receiveShadow = true; m.name = 'mosaic';
  k.C.extra.push(m);
}

const hexPath = (cx: number, cy: number, r: number): P2[] => Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i / 6) * Math.PI * 2) * r, cy + Math.sin((i / 6) * Math.PI * 2) * r] as P2);

function villa(k: TownKit, V: Villa) {
  const F = V.F!, Gc = V.Gc!;
  const A = { block: new Acc(), paving: new Acc() };
  const U = new THREE.Vector3(V.u[0], 0, V.u[1]), Vv = new THREE.Vector3(V.v[0], 0, V.v[1]);
  const P3 = (a: number, b: number, y: number) => { const [x, z] = W2(V, a, b); return new THREE.Vector3(x, y, z); };
  const gAt = (a: number, b: number) => k.groundAt(...W2(V, a, b));
  const { W, L, cw, cl, rw, rd } = V;
  const run = stairRun(V, k.groundAt);
  // (a rotation, never a mirror: local x along u, local z across it)
  const M = (a: number, b: number) => { const [x, z] = W2(V, a, b); return new THREE.Matrix4().makeRotationY(-Math.atan2(V.u[1], V.u[0])).setPosition(x, 0, z); };

  // ---- floor slab (walked on), mosaics laid over it ----
  k.C.add('paving', box(W, 0.6, L, 0, F - 0.3, 0), M(0, 0));
  k.C.add('paving', box(rw, 0.6, rd, 0, F - 0.3, 0), M(0, L / 2 + rd / 2));
  mosaic(k, V, -W / 2, W / 2, -L / 2, L / 2, F + 0.02, V.mosaic[0]);
  mosaic(k, V, -rw / 2, rw / 2, L / 2, L / 2 + rd, F + 0.02, V.mosaic[1]);
  // the light well paved, a step higher
  k.C.add('paving', box(cw - 0.1, 0.25, cl - 0.1, 0, F + 0.06, 0), M(0, 0));

  // ---- walls of the underground floor, facing in, with the doorways ----
  const wallPiece = (a0: number, b0: number, a1: number, b1: number, notch?: (s: number) => P2[], ns = 0) => {
    const ax: P2 = W2(V, a0, b0), bx: P2 = W2(V, a1, b1), len = Math.hypot(bx[0] - ax[0], bx[1] - ax[1]);
    const ue: P2 = [(bx[0] - ax[0]) / len, (bx[1] - ax[1]) / len];
    const inward = new THREE.Vector3(...((): [number, number, number] => { const [cx, cz] = W2(V, 0, 0); const mx = (ax[0] + bx[0]) / 2, mz = (ax[1] + bx[1]) / 2; const d = Math.hypot(cx - mx, cz - mz); return [(cx - mx) / d, 0, (cz - mz) / d]; })());
    const n: P2 = [ue[1], -ue[0]];
    const nn = n[0] * inward.x + n[1] * inward.z > 0 ? new THREE.Vector3(n[0], 0, n[1]) : new THREE.Vector3(-n[0], 0, -n[1]);
    const out: P2[] = [[0, F - 0.2]];
    if (notch) { const p = notch(ns); out.push([p[0][0], F - 0.2], ...p, [p[p.length - 1][0], F - 0.2]); }
    out.push([len, F - 0.2], [len, Gc], [0, Gc]);
    planar(A.block, out, [], new THREE.Vector3(ax[0], 0, ax[1]), ue, nn);
  };
  const stairDoor = (s: number): P2[] => [[s - STAIR_W / 2, F], [s - STAIR_W / 2, F + 2.6], [s + STAIR_W / 2, F + 2.6], [s + STAIR_W / 2, F]];
  const roomDoor = (s: number): P2[] => doorPath(s, F, rw * 0.62, 2.0);
  wallPiece(-W / 2, -L / 2, W / 2, -L / 2, stairDoor, V.stairA + W / 2);            // -v, with the stair door
  wallPiece(W / 2, -L / 2, W / 2, L / 2);
  wallPiece(W / 2, L / 2, -W / 2, L / 2, roomDoor, W / 2);                          // +v, into the main room
  wallPiece(-W / 2, L / 2, -W / 2, -L / 2);
  // ceiling of the portico (stone slab), open over the light well
  {
    const v2 = (q: P2) => new THREE.Vector2(q[0], q[1]);
    const outer = rectW(V, -W / 2, W / 2, -L / 2, L / 2), hole = rectW(V, -cw / 2, cw / 2, -cl / 2, cl / 2);
    const tris = THREE.ShapeUtils.triangulateShape(outer.map(v2), [hole.map(v2)]);
    const all = [...outer, ...hole], down = new THREE.Vector3(0, -1, 0);
    for (const [a, b, c] of tris) {
      const P = (q: P2) => new THREE.Vector3(q[0], Gc, q[1]);
      A.block.tri(P(all[a]), P(all[b]), P(all[c]), all[a], all[b], all[c], down);
    }
  }

  // ---- the light well: columns, architraves, the walls above with hexagonal openings, a railing ----
  const corners: P2[] = [[-cw / 2, -cl / 2], [cw / 2, -cl / 2], [cw / 2, cl / 2], [-cw / 2, cl / 2]];
  const colTop = Gc - 0.55, r = 0.26;
  for (let e = 0; e < 4; e++) {
    const [a0, b0] = corners[e], [a1, b1] = corners[(e + 1) % 4];
    const len = Math.hypot(a1 - a0, b1 - b0), n = Math.max(1, Math.round(len / 3));
    for (let i = 0; i < n; i++) {
      const t = i / n, [x, z] = W2(V, a0 + (a1 - a0) * t, b0 + (b1 - b0) * t);
      column(k, x, z, F + 0.05, colTop - (F + 0.05) - r * 3.15, r, { ...STONE, plinth: false });
    }
    // architrave along the edge
    const [mx, mz] = W2(V, (a0 + a1) / 2, (b0 + b1) / 2), ex = W2(V, a1, b1), sx = W2(V, a0, b0);
    const m = new THREE.Matrix4().makeRotationY(-Math.atan2(ex[1] - sx[1], ex[0] - sx[0])).setPosition(mx, 0, mz);
    k.C.add('block', box(len + 0.7, 0.55, 0.7, 0, colTop + 0.275, 0), m);
    // the wall above, up to the ground, with a hexagonal opening over each bay
    const ue: P2 = [(ex[0] - sx[0]) / len, (ex[1] - sx[1]) / len];
    const g0 = gAt(a0, b0), g1 = gAt(a1, b1), band = Math.min(g0, g1) - Gc;
    const holes: P2[][] = [];
    if (band > 1.3) for (let i = 0; i < n; i++) {
      const s = ((i + 0.5) / n) * len, cy = Gc + band / 2, hr = Math.min(0.55, band * 0.32);
      holes.push(hexPath(s, cy, hr));
      // a dark cavity behind it
      const [hx, hz] = [sx[0] + ue[0] * s, sx[1] + ue[1] * s];
      const back = new THREE.Vector3(...(() => { const [cx, cz] = W2(V, 0, 0); const d = Math.hypot(hx - cx, hz - cz); return [(hx - cx) / d, 0, (hz - cz) / d] as [number, number, number]; })());
      k.C.add('roof', k.paint(cylinder(hr, hr, 0.5, 6, -0.25).rotateX(Math.PI / 2).rotateY(-Math.atan2(back.z, back.x) + Math.PI / 2).translate(hx + back.x * 0.35, cy, hz + back.z * 0.35), DARK), undefined, false);
    }
    const inward = new THREE.Vector3(...(() => { const [cx, cz] = W2(V, 0, 0); const d = Math.hypot(cx - mx, cz - mz); return [(cx - mx) / d, 0, (cz - mz) / d] as [number, number, number]; })());
    planar(A.block, [[0, colTop], [len, colTop], [len, g1], [0, g0]], holes, new THREE.Vector3(sx[0], 0, sx[1]), ue, inward);
    // railing round the rim (a modern guard, as on site)
    for (let s = 0; s <= len + 1e-6; s += len / Math.ceil(len / 1.6)) {
      const [px, pz] = [sx[0] + ue[0] * s - inward.x * 0.15, sx[1] + ue[1] * s - inward.z * 0.15], gy = k.groundAt(px, pz);
      k.C.add('townSteel', box(0.06, 1.05, 0.06, px, gy + 0.52, pz), undefined, false);
    }
    for (const h of [0.5, 1.02]) {
      const m2 = new THREE.Matrix4().makeRotationY(-Math.atan2(ue[1], ue[0])).setPosition(mx - inward.x * 0.15, (g0 + g1) / 2 + h, mz - inward.z * 0.15);
      k.C.add('townSteel', box(len + 0.3, 0.05, 0.05, 0, 0, 0), m2);
    }
  }

  // ---- the main room, barrel-vaulted ----
  {
    const prof = doorPath(0, 0, rw, 2.1);
    const S0 = P3(0, L / 2, F), S1 = P3(0, L / 2 + rd, F);
    loft(A.block, A.paving, [{ P: S0, u: V.u }, { P: S1, u: V.u }], prof, undefined, 1.8);
    planar(A.block, prof, [], S1, V.u, Vv.clone().negate());
    planar(A.block, [[-rw / 2, 0], ...doorPath(0, 0, rw * 0.62, 2.0), [rw / 2, 0], ...prof.slice(1, -1).reverse()], [], S0, V.u, Vv.clone());
  }

  // ---- the stair down from the surface ----
  {
    const n = Math.round(run / 0.3), top = gAt(V.stairA, -L / 2 - run), rise = (top - F) / n;
    for (let i = 0; i < n; i++) {
      const b = -L / 2 - (i + 0.5) * 0.3, h = (i + 1) * rise;
      k.C.add('block', box(STAIR_W, h + 0.4, 0.31, 0, F - 0.4 + (h + 0.4) / 2, 0), M(V.stairA, b));
    }
    // side walls of the trench up to the ground, and the face above the door
    const steps = Math.max(2, Math.ceil(run / 1.5));
    for (const side of [-1, 1]) {
      const a = V.stairA + (side * STAIR_W) / 2, pts: P2[] = [];
      for (let i = 0; i <= steps; i++) { const s = (run * i) / steps; pts.push([s, gAt(a, -L / 2 - s)]); }
      const o = P3(a, -L / 2, 0);
      planar(A.block, [[0, F - 0.4], [run, F - 0.4], ...pts.reverse()], [], new THREE.Vector3(o.x, 0, o.z), [-V.v[0], -V.v[1]], U.clone().multiplyScalar(-side));
    }
    const o = P3(V.stairA - STAIR_W / 2, -L / 2, 0);
    planar(A.block, [[0, F + 2.6], [STAIR_W, F + 2.6], [STAIR_W, gAt(V.stairA + STAIR_W / 2, -L / 2)], [0, gAt(V.stairA - STAIR_W / 2, -L / 2)]], [], new THREE.Vector3(o.x, 0, o.z), V.u, Vv.clone().negate());
  }

  // ---- daylight reaching down the well, and lamps in the rooms (always on, dim) ----
  for (const [a, b, p] of [[0, L / 2 + rd * 0.55, 18], [-W / 2 + 1.5, -L / 2 + 1.5, 8], [W / 2 - 1.5, L / 2 - 1.5, 8]] as [number, number, number][]) {
    const l = new THREE.PointLight('#ffe2b5', p, 11, 2);
    l.position.copy(P3(a, b, F + 2.6));
    k.C.extra.push(l);
  }
  for (const [key, acc] of Object.entries(A)) if (acc.pos.length) k.C.add(key as 'block', acc.geo());
  k.markPoly(villaFoot(V), k.flags.KEEP);
}

// ---------------------------------------------------------------------------
// the other ruins

/** Low walls filling an outline, leaving out what lies over the underground floors. */
function ruins(p: P2[], k: TownKit, maxH: number, step: number, mat: 'rubble' | 'block' = 'rubble') {
  const b = k.bbox(p), rnd = k.rnd, avoid = VILLAS.map(villaFoot);
  for (let z = b.z0 + step / 2; z < b.z1; z += step) for (let x = b.x0 + step / 2; x < b.x1; x += step) {
    if (!k.inPoly(x, z, p) || avoid.some((q) => inPoly(x, z, q) || inPoly(x + step / 2, z + step / 2, q))) continue;
    const g = k.groundAt(x, z);
    if (rnd() < 0.7) { const h = 0.4 + rnd() * maxH; k.C.add(mat, box(step * (0.6 + rnd() * 0.4), h, 0.65, x, g - 0.3 + h / 2, z)); }
    if (rnd() < 0.6) { const h = 0.4 + rnd() * maxH; k.C.add(mat, box(0.65, h, step * (0.6 + rnd() * 0.4), x + step / 2, g - 0.3 + h / 2, z + step / 2)); }
  }
}

function forum(k: TownKit) {
  const lo = Math.min(...FORUM.map(([x, z]) => k.groundAt(x, z)));
  const g = k.flat(FORUM, lo + 0.08); if (g) k.C.add('paving', g);
  // portico columns along three sides (stumps, a few standing)
  const inner: P2[] = [[106.1, -64.4], [96.2, -90.3], [71.6, -81], [78.4, -63.1]];
  for (let i = 0; i < inner.length - 1; i++) {
    const a = inner[i], b = inner[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 1.5; s < L; s += 3.2) {
      const x = a[0] + ((b[0] - a[0]) * s) / L, z = a[1] + ((b[1] - a[1]) * s) / L;
      column(k, x, z, lo + 0.05, k.rnd() < 0.3 ? 4.6 : 0.6 + k.rnd() * 1.6, 0.27, { ...STONE, plinth: false });
    }
  }
  outlineWall(FORUM, k, 1.6);
  const toForum = (p: P2): P2 => { const dx = FORUM_C[0] - p[0], dz = FORUM_C[1] - p[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
  temple(k, { c: APOLLO, front: toForum(APOLLO), w: 11, l: 20, podium: 2.2, cols: 4, sideCols: 1, colH: 5.5, colR: 0.36, cellaH: 2.6, porch: 0.35, pediment: false, roof: false, ...STONE });
  temple(k, { c: CAPITOL, front: toForum(CAPITOL), w: 10, l: 14, podium: 2.8, cols: 4, sideCols: 0, colH: 1.2, colR: 0.4, cellaH: 1.4, porch: 0.3, pediment: false, roof: false, ...STONE });
  k.markPoly(FORUM, k.flags.KEEP, 4);
}

function baths(p: P2[], k: TownKit) {
  // the Baths of Julia Memmia: high walls of the halls, a few arches still standing
  ruins(p, k, 5.5, 7, 'block');
  const c = centroidOf(p);
  for (const [dx, dz, h] of [[-8, -6, 8.5], [6, 4, 7.5], [-2, 14, 7]] as [number, number, number][]) {
    const q: P2 = [c[0] + dx, c[1] + dz];
    if (inPoly(q[0], q[1], p)) arch(k, q, [0.25, -0.97], 7, 1.8, h, 1.5);
  }
  k.markPoly(p, k.flags.KEEP);
}

function piers(p: P2[], k: TownKit) {
  const { lo, hi } = k.footprintGround(p);
  k.C.add('block', k.walls(p, lo - 0.5, hi + 6.2));
  const top = k.flat(p, hi + 6.2); if (top) k.C.add('block', top);
}

export function buildBullaRegia(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  planVillas();
  if (import.meta.env.DEV) (window as unknown as { __bulla: Villa[] }).__bulla = VILLAS; // for dev checks
  // the archaeological park is mapped as a garden: treat it as excavated ground (no garden trees or houses)
  const data = { ...(TOWN as unknown as TownData) };
  data.areas = (TOWN.areas as Area[]).map((a) => (a.k === 'garden' && /Bulla|بولا/i.test(a.name ?? '') ? { ...a, k: 'archaeology' } : a));
  const hunt = VILLAS[0];
  return buildTerrainTown(materials, site, {
    houseStyle: 'rural', // src/viewer/house-styles.ts
    data,
    core: 0,
    treeR: 220,
    scrub: 0.7,
    palette: { soil: '#d9c79c', scrub: '#9ea06a' },
    paved: (r) => r.k === 'secondary' || r.k === 'tertiary' || r.s === 'asphalt',
    houseColors: { walls: ['#ffffff', '#f7f3ea', '#f1ebdf', '#fbf8f2'], roofs: ['#dcd2c0', '#d0c4ac', '#e8e1d2'] },
    flatten: [{ p: FORUM, pad: 10, level: 'mean' }],
    holes: villaHoles,
    // at the entrance by the museum, looking south over the site
    spawn: { x: MUSEUM[0] + 10, z: MUSEUM[1] - 30 },
    look: { x: hunt ? hunt.c[0] : -140, z: hunt ? hunt.c[1] : -150, h: 2 },
    lights: [
      [FORUM_C[0], FORUM_C[1], 4, 90, 40],
      [THEATRE.c[0], THEATRE.c[1], 4, 70, 40],
      [MEMMIA[0], MEMMIA[1], 4, 60, 35],
    ],
    special: (b: Building, k: TownKit) => {
      const name = b.name ?? '';
      if (/Th[ée][âa]tre/i.test(name)) { romanTheatre(k, THEATRE, STONE); return true; }
      if (/Julia Memmia/i.test(name)) { baths(b.p, k); return true; }
      if (/Fort byzantin/i.test(name)) { outlineWall(b.p, k, 6); k.markPoly(b.p, k.flags.KEEP, 3); return true; }
      if (/Capitole|Temple d.Apollon/i.test(name)) return true; // built with the forum
      if (b.k === 'ruins') { ruins(b.p, k, /Thermes/i.test(name) ? 3.5 : 2, 6, 'block'); k.markPoly(b.p, k.flags.KEEP); return true; }
      return false;
    },
    extras: (k) => {
      for (const V of VILLAS) villa(k, V);
      forum(k);
      for (const a of k.areas as Area[]) {
        if (a.k !== 'ruins') continue;
        const name = a.name ?? '', p = a.p;
        if (/Arc de triomphe/i.test(name)) piers(p, k);
        else if (/^Forum$/i.test(name)) continue;
        else if (/Thermes|Citernes/i.test(name)) ruins(p, k, 3.2, 6, 'block');
        else if (/Basilique|[ÉE]glise|Temple/i.test(name)) ruins(p, k, 2.4, 6, 'block');
        else ruins(p, k, 1.8, 6, 'rubble');
        k.markPoly(p, k.flags.KEEP);
      }
      // olive trees around the excavations
      for (const park of k.areas.filter((a) => a.k === 'archaeology')) {
        const b = k.bbox(park.p);
        for (let z = b.z0; z < b.z1; z += 21) for (let x = b.x0; x < b.x1; x += 21) {
          const px = x + (k.rnd() - 0.5) * 8, pz = z + (k.rnd() - 0.5) * 8;
          if (k.rnd() > 0.35 || !k.inPoly(px, pz, park.p) || k.at(px, pz) & (k.flags.BLD | k.flags.KEEP | k.flags.ROAD)) continue;
          k.props.groves.push({ x: px, z: pz, y: k.groundAt(px, pz), yaw: k.rnd() * 6 });
        }
      }
    },
  });
}
