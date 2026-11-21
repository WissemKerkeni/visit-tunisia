/**
 * Djerba: the village of Erriadh (Hara Sghira) and the Ghriba synagogue, in the island's countryside of
 * whitewashed houses, palms and olive trees.
 * Buildings, streets and positions from OpenStreetMap (1,300 mapped houses, no generated ones), terrain from AWS
 * Terrain Tiles; built on the shared terrain-town builder:
 * - the Ghriba synagogue, entered through its door into a hall of blue-tiled walls, white horseshoe arcades on
 *   blue columns, a painted wooden ceiling and brass lamps; the pilgrims' caravanserai beside it with two storeys
 *   of arcades;
 * - Erriadh's lanes with the Djerbahood murals (procedural paintings on the street walls), its mosques with
 *   their short minarets, and the white domed shrines of the countryside.
 * Shapes are simplified. Scene frame: origin 33.8175 N, 10.8565 E, x = east, z = south.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import TOWN from '../../content/djerba-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { arcade, frame } from '../common/islamic';
import { box, cylinder, hash } from '../el-jem/geometry';

const BUILDINGS = TOWN.buildings as Building[];
const centroidOf = (p: P2[]): P2 => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const named = (re: RegExp) => BUILDINGS.find((b) => re.test(b.name ?? ''));
const areaOf = (p: P2[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s / 2); };

export const GHRIBA_P = named(/Synagogue de La Ghriba/i)?.p ?? [];
export const GHRIBA = GHRIBA_P.length ? centroidOf(GHRIBA_P) : [273, 391] as P2;
export const FUNDUQ_P = named(/Caravans/i)?.p ?? [];
export const FUNDUQ = FUNDUQ_P.length ? centroidOf(FUNDUQ_P) : [210, 416] as P2;
export const MOSQUE = centroidOf(named(/Mosquée Erriadh/i)?.p ?? [[-75, -416]]);
export const SALAMA = centroidOf(named(/Sidi Salama/i)?.p ?? [[-1, 635]]);
/** The heart of the village, where the Djerbahood murals are densest (the gallery and café points). */
export const VILLAGE: P2 = [-235, -375];
export const PLACETTE: P2 = (TOWN.pois as unknown as { name?: string; p: P2 }[]).find((p) => /Placette/i.test(p.name ?? ''))?.p ?? [-253, -402];
/** A menzel out in the fields: the largest mapped house between the village and the synagogue. */
export const MENZEL = (() => {
  let best: Building | null = null, a = 0;
  for (const b of BUILDINGS) {
    const c = centroidOf(b.p);
    if (b.name || Math.hypot(c[0] - 40, c[1] - 0) > 260) continue;
    const s = areaOf(b.p);
    if (s > a && s < 600) { a = s; best = b; }
  }
  return best ? centroidOf(best.p) : [40, 0] as P2;
})();

/** Door of the synagogue: the middle of its longest north-facing outline edge (the street side). */
export const GHRIBA_DOOR = (() => {
  const p = GHRIBA_P;
  if (p.length < 3) return { at: [270, 384] as P2, out: [0, -1] as P2, edge: -1 };
  const inP = (x: number, z: number) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  let best = -1, score = -Infinity, out: P2 = [0, -1], at: P2 = [0, 0];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 5) continue;
    const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let n: P2 = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
    if (inP(m[0] + n[0], m[1] + n[1])) n = [-n[0], -n[1]];
    const sc = -n[1] + L * 0.01;
    if (sc > score) { score = sc; best = i; out = n; at = m; }
  }
  return { at, out, edge: best };
})();

/** The longest north-facing edge of an outline: its middle, outward normal and index. */
function northFront(p: P2[], minLen = 5) {
  const inP = (x: number, z: number) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  let best = -1, score = -Infinity, out: P2 = [0, -1], at: P2 = [0, 0];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < minLen) continue;
    const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let n: P2 = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
    if (inP(m[0] + n[0], m[1] + n[1])) n = [-n[0], -n[1]];
    const sc = -n[1] + L * 0.01;
    if (sc > score) { score = sc; best = i; out = n; at = m; }
  }
  return { at, out, edge: best };
}
export const FUNDUQ_FRONT = FUNDUQ_P.length > 2 ? northFront(FUNDUQ_P, 12) : { at: [210, 395] as P2, out: [0, -1] as P2, edge: -1 };

/** The Djerbahood mural nearest the village square (set while building; read by the hotspot). */
export const MURAL = { at: [-250, -395] as P2, out: [0, -1] as P2, d: Infinity };

const WHITE = new THREE.Color('#f7f5ef');
const BLUE = new THREE.Color('#1f5fa8');
const TILE = new THREE.Color('#2f6db3');
const WOOD = new THREE.Color('#6b4426');

export function buildDjerba(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  MURAL.d = Infinity; // chosen afresh on each visit
  const spawn = PLACETTE, look = [VILLAGE[0] + 30, VILLAGE[1] + 10];
  return buildTerrainTown(materials, site, {
    houseStyle: 'djerba', // src/viewer/house-styles.ts
    data: TOWN as unknown as TownData,
    core: 0,
    corePoly: Array.from({ length: 24 }, (_, i) => [VILLAGE[0] + Math.cos((i / 24) * Math.PI * 2) * 190, VILLAGE[1] + Math.sin((i / 24) * Math.PI * 2) * 170] as P2),
    fill: false,
    inland: true,                    // the sea is 5 km away: fields to the horizon, not a shoreline at the map edge
    domes: 4,
    flowers: 0.6,
    treeR: 220,
    scrub: 0.9,
    spawn: { x: spawn[0], z: spawn[1] },
    look: { x: look[0], z: look[1], h: 3 },
    lights: [
      [GHRIBA[0], GHRIBA[1], 4, 50, 22],
      [FUNDUQ[0], FUNDUQ[1], 4, 60, 30],
      [PLACETTE[0], PLACETTE[1], 4, 50, 30],
      [MOSQUE[0], MOSQUE[1], 6, 40, 25],
    ],
    special: (b: Building, k: TownKit) => {
      const name = b.name ?? '';
      if (/Synagogue de La Ghriba/i.test(name)) { ghriba(b, k); return true; }
      if (/Caravans/i.test(name)) { funduq(b, k); return true; }
      if (/^Sidi /i.test(name)) { shrine(b, k); return true; }
      return false;
    },
    extras: (k) => {
      murals(k);
      // palms and olives in the fields between the houses, as everywhere on the island
      for (let z = -640; z < 640; z += 15) for (let x = -640; x < 640; x += 15) {
        const px = x + (hash(x * 0.13 + z * 0.71) - 0.5) * 12, pz = z + (hash(z * 0.37 - x * 0.19) - 0.5) * 12;
        if (k.at(px, pz) || k.inPoly(px, pz, k.areas.find((a) => a.k === 'cemetery')?.p ?? [])) continue;
        const r = hash(px * 1.31 + pz * 0.77);
        if (r < 0.16) k.props.palms.push(new THREE.Vector3(px, k.groundAt(px, pz), pz));
        else if (r < 0.3) k.props.groves.push({ x: px, z: pz, y: k.groundAt(px, pz), yaw: r * 40 });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// the Ghriba synagogue and its caravanserai

/** Thick white walls on the outline (a door on the side of the caravanserai), the hall inside, a flat roof. */
function ghriba(b: Building, k: TownKit) {
  const { C, paint } = k;
  const p = b.p;
  const { lo, hi } = k.footprintGround(p);
  const F = hi + 0.25, H = 7.2, T = 0.7;
  const inside = (x: number, z: number) => k.inPoly(x, z, p);
  // floor of the hall
  const floor = k.flat(p, F);
  if (floor) C.add('roof', paint(floor, new THREE.Color('#cdbb9c')));
  C.add('roof', paint(k.walls(p, lo - 0.6, F, 0), WHITE));
  // walls, edge by edge, as solid slabs set just inside the outline, with the door gap
  for (let i = 0; i < p.length; i++) {
    const a = p[i], e = p[(i + 1) % p.length], L = Math.hypot(e[0] - a[0], e[1] - a[1]);
    if (L < 0.3) continue;
    const dx = (e[0] - a[0]) / L, dz = (e[1] - a[1]) / L;
    let nx = dz, nz = -dx;                                   // towards the inside
    const mx = (a[0] + e[0]) / 2, mz = (a[1] + e[1]) / 2;
    if (!inside(mx + nx * 1.2, mz + nz * 1.2)) { nx = -nx; nz = -nz; }
    const cx = mx + nx * T / 2, cz = mz + nz * T / 2;
    const piece = (from: number, to: number, y0: number, y1: number, col: THREE.Color) => {
      const len = to - from, o = (from + to) / 2 - L / 2;
      C.add('whitewash', paint(box(len + T, y1 - y0, T, 0, (y0 + y1) / 2, 0), col), frame(cx + dx * o, 0, cz + dz * o, [dx, dz]));
    };
    if (i === GHRIBA_DOOR.edge) {
      piece(0, L / 2 - 1.1, F - 0.2, F + H, WHITE);
      piece(L / 2 + 1.1, L, F - 0.2, F + H, WHITE);
      piece(L / 2 - 1.1, L / 2 + 1.1, F + 3.0, F + H, WHITE);
      // the door frame, painted blue
      for (const s of [-1, 1]) C.add('roof', paint(box(0.18, 3.1, T + 0.1, 0, 1.55, 0), BLUE), frame(mx + dx * s * 1.15 + nx * T / 2, F - 0.05, mz + dz * s * 1.15 + nz * T / 2, [dx, dz]), false);
      C.add('roof', paint(box(2.5, 0.2, T + 0.1, 0, 3.1, 0), BLUE), frame(mx + nx * T / 2, F, mz + nz * T / 2, [dx, dz]), false);
    } else piece(0, L, F - 0.2, F + H, WHITE);
    // inside: a dado of blue tiles; outside: small windows with blue frames high on the wall
    const tx = mx + nx * (T + 0.04), tz = mz + nz * (T + 0.04);
    if (L > 1.5 && i !== GHRIBA_DOOR.edge) C.add('roof', paint(box(L - 0.3, 2.2, 0.06, 0, 1.1, 0), TILE), frame(tx, F, tz, [dx, dz]), false);
    for (let t = 2; t < L - 1.5; t += 4.5) {
      const ox = a[0] + dx * t - nx * 0.04, oz = a[1] + dz * t - nz * 0.04;
      C.add('roof', paint(box(1.0, 1.2, 0.1, 0, 0, 0), new THREE.Color('#2a2d33')), frame(ox, F + 4.8, oz, [dx, dz]), false);
      C.add('roof', paint(box(1.2, 0.12, 0.12, 0, 0.66, 0), BLUE), frame(ox, F + 4.8, oz, [dx, dz]), false);
    }
  }
  // the hall: two arcades of horseshoe arches on blue columns, down its length
  const bb = k.bbox(p), c = centroidOf(p);
  const long = bb.x1 - bb.x0 > bb.z1 - bb.z0;
  const dir: P2 = long ? [1, 0] : [0, 1], across: P2 = long ? [0, 1] : [1, 0];
  const len = (long ? bb.x1 - bb.x0 : bb.z1 - bb.z0) * 0.62;
  for (const s of [-1, 1]) {
    const off = s * 3.4, sx = c[0] + across[0] * off - dir[0] * len / 2, sz = c[1] + across[1] * off - dir[1] * len / 2;
    C.add('roof', paint(arcade(len, 5.2, Math.max(2, Math.round(len / 3)), { pier: 0.45, spring: 3.0, thick: 0.45 }), WHITE), frame(sx, F, sz, dir), false);
    const n = Math.max(2, Math.round(len / 3));
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * len, x = sx + dir[0] * t, z = sz + dir[1] * t;
      C.add('roof', paint(cylinder(0.2, 0.22, 2.6, 10, F).translate(x, 0, z), BLUE));
    }
  }
  // the painted wooden ceiling (seen from below) and the flat white roof
  const ceil = k.flat(p, F + H - 0.05);
  if (ceil) {
    const g = ceil.clone();
    const idx = g.getIndex();
    if (idx) { const arr = idx.array as Uint16Array | Uint32Array; for (let i = 0; i < arr.length; i += 3) { const t = arr[i]; arr[i] = arr[i + 2]; arr[i + 2] = t; } }
    else { const pos = g.getAttribute('position') as THREE.BufferAttribute; for (let i = 0; i < pos.count; i += 3) { const t = [pos.getX(i), pos.getY(i), pos.getZ(i)]; pos.setXYZ(i, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2)); pos.setXYZ(i + 2, t[0], t[1], t[2]); } }
    g.computeVertexNormals();
    C.add('roof', paint(g, WOOD), undefined, false);
  }
  const roof = k.flat(p, F + H);
  if (roof) C.add('roof', paint(roof, WHITE));
  // brass lamps hanging in the hall, and the Ark (the niche for the Torah scrolls) at the far end
  for (let i = -2; i <= 2; i++) {
    const x = c[0] + dir[0] * i * 3, z = c[1] + dir[1] * i * 3;
    C.add('townSteel', cylinder(0.02, 0.02, 1.6, 4, F + H - 1.7).translate(x, 0, z), undefined, false);
    C.add('townSteel', cylinder(0.55, 0.3, 0.35, 10, F + H - 2.05).translate(x, 0, z), undefined, false);
  }
  const ax = c[0] - dir[0] * (len / 2 + 1.5) * Math.sign(GHRIBA_DOOR.out[0] * dir[0] + GHRIBA_DOOR.out[1] * dir[1] || 1), az = c[1] - dir[1] * (len / 2 + 1.5) * Math.sign(GHRIBA_DOOR.out[0] * dir[0] + GHRIBA_DOOR.out[1] * dir[1] || 1);
  C.add('roof', paint(box(2.6, 3.4, 0.6, 0, 1.7, 0), WOOD), frame(ax, F, az, across), false);
  C.add('roof', paint(box(2.9, 0.3, 0.7, 0, 3.55, 0), BLUE), frame(ax, F, az, across), false);
  k.markPoly(p, k.flags.BLD, 1);
  const d = GHRIBA_DOOR;
  k.markSeg(d.at, [d.at[0] + d.out[0] * 12, d.at[1] + d.out[1] * 12], 2.5, k.flags.KEEP);
}

/** The pilgrims' caravanserai: two storeys of white rooms round a courtyard, arcaded on the side of the synagogue. */
function funduq(b: Building, k: TownKit) {
  const { C, paint } = k;
  k.house(b.p, 777010, { lv: 2, h: 7.4 });
  // a two-storey arcade along its street front
  const p = b.p, best = Math.max(0, FUNDUQ_FRONT.edge);
  const a = p[best], e = p[(best + 1) % p.length], L = Math.hypot(e[0] - a[0], e[1] - a[1]);
  const dx = (e[0] - a[0]) / L, dz = (e[1] - a[1]) / L;
  let nx = dz, nz = -dx;
  const mx = (a[0] + e[0]) / 2, mz = (a[1] + e[1]) / 2;
  if (k.inPoly(mx + nx, mz + nz, p)) { nx = -nx; nz = -nz; }
  const g = k.groundAt(mx + nx * 2, mz + nz * 2);
  for (const [y, h] of [[g - 0.3, 3.9], [g + 3.6, 3.6]]) {
    C.add('roof', paint(arcade(L - 1, h, Math.round((L - 1) / 3.2), { pier: 0.6, spring: h * 0.42, thick: 0.5 }), WHITE), frame(a[0] + dx * 0.5 + nx * 0.3, y, a[1] + dz * 0.5 + nz * 0.3, [dx, dz]), false);
  }
}

/** A white shrine (marabout) of the countryside: a cube under a dome. */
function shrine(b: Building, k: TownKit) {
  const { C, paint } = k;
  k.house(b.p, 777020 + Math.round(b.p[0][0]), { lv: 1, h: 4.2 });
  const { hi } = k.footprintGround(b.p), c = centroidOf(b.p), bb = k.bbox(b.p);
  const r = Math.min(4, Math.min(bb.x1 - bb.x0, bb.z1 - bb.z0) * 0.38);
  C.add('roof', paint(cylinder(r, r, 0.9, 18, hi + 4.2).translate(c[0], 0, c[1]), WHITE), undefined, false);
  C.add('roof', paint(new THREE.SphereGeometry(r, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.15, 1).translate(c[0], hi + 5.1, c[1]), WHITE), undefined, false);
}

// ---------------------------------------------------------------------------
// Djerbahood: since 2014 artists from around the world have painted the walls of Erriadh

const PALETTE = ['#e63946', '#f1a208', '#2a9d8f', '#264653', '#e76f51', '#8ab17d', '#6d597a', '#ffb4a2', '#1d3557', '#f4d35e', '#0b7a75', '#d1495b'];
function muralTexture(seed: number) {
  const W = 256, H = 160;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  const r = (i: number) => hash(seed * 31.7 + i * 7.13);
  const col = (i: number) => PALETTE[Math.floor(r(i) * PALETTE.length)];
  g.fillStyle = col(1); g.fillRect(0, 0, W, H);
  const style = Math.floor(r(2) * 4);
  for (let i = 0; i < 9; i++) {
    g.fillStyle = col(10 + i); g.strokeStyle = col(30 + i); g.lineWidth = 3 + r(50 + i) * 8;
    const x = r(60 + i) * W, y = r(70 + i) * H, s = 20 + r(80 + i) * 70;
    g.beginPath();
    if (style === 0) g.arc(x, y, s, 0, Math.PI * 2);                                   // circles and moons
    else if (style === 1) { g.moveTo(x, y - s); g.lineTo(x + s, y + s); g.lineTo(x - s, y + s); g.closePath(); } // triangles
    else if (style === 2) { g.moveTo(0, y); for (let t = 0; t <= W; t += 16) g.lineTo(t, y + Math.sin(t / 20 + i) * s * 0.4); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); } // waves
    else g.ellipse(x, y, s, s * 0.45, r(90 + i) * 3, 0, Math.PI * 2);               // eyes and leaves
    g.fill(); if (r(100 + i) < 0.5) g.stroke();
  }
  // a face or a figure on some walls: two eyes and a mouth
  if (r(3) < 0.45) {
    const cx = W * (0.3 + r(4) * 0.4), cy = H * 0.45, s = 30 + r(5) * 20;
    g.fillStyle = '#f2e8d5'; g.beginPath(); g.ellipse(cx, cy, s, s * 1.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b1b1b'; for (const o of [-0.4, 0.4]) { g.beginPath(); g.arc(cx + o * s, cy - s * 0.2, s * 0.12, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = col(6); g.lineWidth = 4; g.beginPath(); g.arc(cx, cy + s * 0.25, s * 0.35, 0.2, Math.PI - 0.2); g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function murals(k: TownKit) {
  const N = 10;
  const parts: THREE.BufferGeometry[][] = Array.from({ length: N }, () => []);
  let count = 0;
  for (const b of k.buildings) {
    const c = centroidOf(b.p);
    if (Math.hypot(c[0] - VILLAGE[0], c[1] - VILLAGE[1]) > 200 || b.name) continue;
    const p = b.p;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], e = p[(i + 1) % p.length], L = Math.hypot(e[0] - a[0], e[1] - a[1]);
      if (L < 3.5) continue;
      const dx = (e[0] - a[0]) / L, dz = (e[1] - a[1]) / L;
      let nx = dz, nz = -dx;
      const mx = (a[0] + e[0]) / 2, mz = (a[1] + e[1]) / 2;
      if (k.inPoly(mx + nx * 0.5, mz + nz * 0.5, p)) { nx = -nx; nz = -nz; }
      if (!(k.at(mx + nx * 2.5, mz + nz * 2.5) & k.flags.ROAD)) continue;   // only walls on a street
      if (hash(mx * 0.71 + mz * 1.37) > 0.42) continue;
      const w = Math.min(L - 0.8, 5.5), h = Math.min(2.9, w * 0.62), gy = k.groundAt(mx + nx * 1.2, mz + nz * 1.2);
      const g = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
      g.applyMatrix4(frame(mx + nx * 0.06, gy + 0.45, mz + nz * 0.06, [nz, -nx]));   // local z (the plane's face) = outward
      parts[Math.floor(hash(mx + mz * 3.1) * N)].push(g);
      count++;
      const dp = Math.hypot(mx - PLACETTE[0], mz - PLACETTE[1]);
      if (w > 3.5 && dp < MURAL.d) { MURAL.d = dp; MURAL.at = [mx, mz]; MURAL.out = [nx, nz]; }
    }
  }
  parts.forEach((list, i) => {
    if (!list.length) return;
    const geo = mergeGeometries(list)!;
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: muralTexture(i + 1), roughness: 0.9 }));
    mesh.receiveShadow = true;
    mesh.name = 'murals';
    k.C.extra.push(mesh);
  });
  void count;
}
