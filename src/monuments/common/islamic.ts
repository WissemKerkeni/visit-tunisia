/**
 * Shared pieces for the Islamic monuments and medinas (Kairouan, Sousse...): horseshoe arcades, ribbed domes,
 * battered towers, rounded merlons, ramparts with bastions and breaches, city gates, and helpers to place
 * landmarks mapped as points on their street.
 */
import * as THREE from 'three';
import type { P2, TownKit } from './terrain-town';
import { box, cylinder } from '../el-jem/geometry';

export type Poi = { k: string; p: P2; name?: string };
export type Road = { k: string; w: number; p: P2[] };

const MARBLE = new THREE.Color('#ece6da');

/** Matrix for a piece placed in a local frame: x along `dir`, y up, z = dir × up. */
export function frame(x: number, y: number, z: number, dir: P2) {
  const d = new THREE.Vector3(dir[0], 0, dir[1]).normalize();
  const n = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0));
  return new THREE.Matrix4().makeBasis(d, new THREE.Vector3(0, 1, 0), n).setPosition(x, y, z);
}

/**
 * An arcade wall of horseshoe arches: a slab `len` long and `h` high with `bays` arched openings
 * reaching the ground, extruded `thick` (centred). Local x along the wall, y up.
 */
export function arcade(len: number, h: number, bays: number, opts: { pier?: number; spring?: number; thick?: number } = {}) {
  const pier = opts.pier ?? 0.7, thick = opts.thick ?? 0.7;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  const bw = len / bays;
  for (let i = 0; i < bays; i++) {
    const cx = (i + 0.5) * bw;
    const hw = Math.max(0.3, bw / 2 - pier / 2);
    const th = 0.42, R = hw / Math.cos(th);
    const spring = Math.min(opts.spring ?? hw * 2.1, h - R - 0.4);
    const yj = spring - R * Math.sin(th);
    s.lineTo(cx - hw, 0);
    s.lineTo(cx - hw, yj);
    s.absarc(cx, spring, R, Math.PI + th, -th, true);
    s.lineTo(cx + hw, 0);
  }
  s.lineTo(len, 0); s.lineTo(len, h); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -thick / 2);
  return g;
}

/** A fluted dome: a hemisphere of radius r with `ribs` ribs (zigzag when `zigzag` is set, as at the Kalaout el-Koubba). */
export function ribbedDome(r: number, ribs = 24, zigzag = false) {
  const g = new THREE.SphereGeometry(r, ribs * 2, zigzag ? 14 : 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const twist = zigzag ? Math.sin((y / r) * Math.PI * 3) * 0.5 : 0;
    const a = Math.atan2(z, x) + twist / ribs * 6, f = 1 + (zigzag ? 0.11 : 0.05) * Math.abs(Math.cos((a * ribs) / 2)) * Math.min(1, ((r - y) / r) * 2);
    pos.setXYZ(i, x * f, y, z * f);
  }
  g.computeVertexNormals();
  return g;
}

/** Square frustum (battered towers and minarets): side s0 at the bottom, s1 at the top, uvs in metres. */
export function frustum(s0: number, s1: number, h: number) {
  const g = new THREE.CylinderGeometry(s1 / Math.SQRT2, s0 / Math.SQRT2, h, 4, 1).rotateY(Math.PI / 4).translate(0, h / 2, 0).toNonIndexed();
  g.computeVertexNormals();
  const pos = g.getAttribute('position'), nrm = g.getAttribute('normal'), uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    uv.setXY(i, ay > 0.5 ? pos.getX(i) : ax > az ? pos.getZ(i) : pos.getX(i), ay > 0.5 ? pos.getZ(i) : pos.getY(i));
  }
  return g;
}

/** Rounded merlons along a straight edge (local x from 0 to len). */
export function merlons(k: TownKit, m: THREE.Matrix4, len: number, mat: 'block' | 'plaster' = 'block') {
  for (let x = 0.8; x < len - 0.4; x += 1.7) {
    k.C.add(mat, box(0.9, 0.8, 0.5, x, 0.4, 0), m, false);
    k.C.add(mat, cylinder(0.45, 0.45, 0.5, 8).rotateX(Math.PI / 2).translate(x, 0.8, -0.25), m, false);
  }
}

/** Merlons round a square top of side `s` centred on (x, z), at height y. */
export function merlonRing(k: TownKit, x: number, y: number, z: number, s: number, dir: P2 = [1, 0]) {
  const L = Math.hypot(...dir), d: P2 = [dir[0] / L, dir[1] / L], n: P2 = [-d[1], d[0]];
  for (let side = 0; side < 4; side++) {
    // corners in order, each edge walked along its own direction
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]][side], e = [[-1, -1], [1, -1], [1, 1], [-1, 1]][(side + 1) % 4];
    const ax = x + (d[0] * c[0] + n[0] * c[1]) * s / 2, az = z + (d[1] * c[0] + n[1] * c[1]) * s / 2;
    const bx = x + (d[0] * e[0] + n[0] * e[1]) * s / 2, bz = z + (d[1] * e[0] + n[1] * e[1]) * s / 2;
    merlons(k, frame(ax, y, az, [bx - ax, bz - az]), s);
  }
}

export function inPolygon(poly: P2[], x: number, z: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

/** Nearest point on a mapped street, with the street's width and direction. */
export function nearestRoad(roads: Road[], p: P2) {
  let best = { d: Infinity, q: p, w: 4, dir: [1, 0] as P2 };
  for (const r of roads) for (let i = 0; i < r.p.length - 1; i++) {
    const a = r.p[i], b = r.p[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2));
    const q: P2 = [a[0] + dx * t, a[1] + dz * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < best.d) best = { d, q, w: r.w, dir: [dx, dz] };
  }
  return best;
}

/** A landmark mapped as a point: its front on the nearest street, centre set back by half its depth. */
export function frontage(roads: Road[], p: P2, depth: number) {
  const r = nearestRoad(roads, p);
  let nx = r.q[0] - p[0], nz = r.q[1] - p[1];
  const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L;
  const back = r.w / 2 + 0.4 + depth / 2;
  // the lane runs along the façade (the street segment itself can end at the landmark)
  return { c: [r.q[0] - nx * back, r.q[1] - nz * back] as P2, n: [nx, nz] as P2, street: r.q, along: [-nz, nx] as P2, depth };
}
export type Frontage = ReturnType<typeof frontage>;

/** Direction of the nearest wall segment, and how far it is. */
function wallAt(walls: P2[][], p: P2) {
  let best = { d: Infinity, dir: [1, 0] as P2 };
  for (const w of walls) for (let i = 0; i < w.length - 1; i++) {
    const a = w[i], b = w[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2));
    const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dz * t - p[1]);
    if (d < best.d) best = { d, dir: [dx, dz] };
  }
  return best;
}

/** Unit vector through a gate, pointing out of the walled town. */
export function gateOut(walls: P2[][], poly: P2[], p: P2): P2 {
  const { dir } = wallAt(walls, p);
  const L = Math.hypot(...dir) || 1;
  let n: P2 = [dir[1] / L, -dir[0] / L];
  if (inPolygon(poly, p[0] + n[0] * 15, p[1] + n[1] * 15)) n = [-n[0], -n[1]];
  return n;
}

/**
 * Chain wall polylines end to end into the ring of a walled town (gaps such as a demolished stretch are
 * closed straight). Starts from the longest; segments whose ends are further than `reach` are left out.
 */
export function wallRing(walls: P2[][], reach = 120): P2[] {
  const left = walls.slice().sort((a, b) => b.length - a.length);
  const ring = [...left.shift()!];
  for (;;) {
    const end = ring[ring.length - 1];
    let best = -1, rev = false, bd = reach;
    left.forEach((w, i) => {
      const d0 = Math.hypot(w[0][0] - end[0], w[0][1] - end[1]), d1 = Math.hypot(w[w.length - 1][0] - end[0], w[w.length - 1][1] - end[1]);
      if (d0 < bd) { bd = d0; best = i; rev = false; }
      if (d1 < bd) { bd = d1; best = i; rev = true; }
    });
    if (best < 0) break;
    const w = left.splice(best, 1)[0];
    ring.push(...(rev ? w.slice().reverse() : w));
  }
  return ring;
}

export interface RampartOpts {
  walls: P2[][];
  /** The walled town (to know which side is outside). */
  poly: P2[];
  gates: Poi[];
  roads: Road[];
  height?: number;
  /** Gates that get marble columns beside the passage. */
  bigGate?: RegExp;
  /** Places where no rampart is built (e.g. a fort that has its own walls). */
  skip?: (x: number, z: number) => boolean;
}

/** Ramparts along the mapped walls: crenellated, square bastions every ~36 m, breaches where streets cross, and the gates. */
export function ramparts(k: TownKit, o: RampartOpts) {
  const { C } = k;
  const H = o.height ?? 8.5, T = 2.2;
  // where mapped streets cross the walls (and not at a gate), leave a breach
  const gaps: { p: P2; r: number }[] = [];
  const cross = (a: P2, b: P2, c: P2, d: P2): P2 | null => {
    const r1x = b[0] - a[0], r1z = b[1] - a[1], r2x = d[0] - c[0], r2z = d[1] - c[1], den = r1x * r2z - r1z * r2x;
    if (Math.abs(den) < 1e-9) return null;
    const t = ((c[0] - a[0]) * r2z - (c[1] - a[1]) * r2x) / den, s = ((c[0] - a[0]) * r1z - (c[1] - a[1]) * r1x) / den;
    return t >= 0 && t <= 1 && s >= 0 && s <= 1 ? [a[0] + r1x * t, a[1] + r1z * t] : null;
  };
  for (const w of o.walls) for (let i = 0; i < w.length - 1; i++) for (const r of o.roads) {
    if (r.w < 2) continue;
    for (let j = 0; j < r.p.length - 1; j++) { const q = cross(w[i], w[i + 1], r.p[j], r.p[j + 1]); if (q) gaps.push({ p: q, r: r.w / 2 + 1.2 }); }
  }
  for (const g of o.gates) gaps.push({ p: g.p, r: 7.5 });
  const inGap = (x: number, z: number) => gaps.some((g) => Math.hypot(x - g.p[0], z - g.p[1]) < g.r) || !!o.skip?.(x, z);

  let tower = 0;
  for (const w of o.walls) for (let i = 0; i < w.length - 1; i++) {
    const a = w[i], b = w[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 0.5) continue;
    const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L;
    // outward normal
    let nx = dz, nz = -dx;
    if (inPolygon(o.poly, (a[0] + b[0]) / 2 + nx * 6, (a[1] + b[1]) / 2 + nz * 6)) { nx = -nx; nz = -nz; }
    const n = Math.max(1, Math.ceil(L / 3.4)), step = L / n;
    for (let s = 0; s < n; s++) {
      const mx = a[0] + dx * (s + 0.5) * step, mz = a[1] + dz * (s + 0.5) * step;
      if (inGap(mx, mz)) continue;
      const g = k.groundAt(mx, mz);
      if (g < 0.3) continue; // in the sea
      C.add('block', box(step + 0.05, H + 0.6, T, 0, (H + 0.6) / 2, 0), frame(mx, g - 0.6, mz, [dx, dz]));
      // rounded merlons on the outer edge
      merlons(k, frame(mx - dx * step / 2 + nx * (T / 2 - 0.25), g + H, mz - dz * step / 2 + nz * (T / 2 - 0.25), [dx, dz]), step);
      k.markSeg([mx - dx * step / 2, mz - dz * step / 2], [mx + dx * step / 2, mz + dz * step / 2], 1.6, k.flags.BLD);
      // a square bastion every ~36 m
      tower += step;
      if (tower > 36) {
        tower = 0;
        const tx = mx + nx * 2.6, tz = mz + nz * 2.6, tg = k.groundAt(tx, tz);
        C.add('block', box(5.5, H + 2.2, 4.2, 0, (H + 2.2) / 2, 0), frame(tx, tg - 0.6, tz, [dx, dz]));
        merlons(k, frame(tx - dx * 2.75 + nx * 1.9, tg + H + 1.6, tz - dz * 2.75 + nz * 1.9, [dx, dz]), 5.5);
        k.markSeg([tx, tz], [tx, tz], 3.5, k.flags.BLD);
      }
    }
  }
  for (const g of o.gates) gate(k, g, o);
}

/** A city gate: a tall block pierced by a horseshoe arch, striped voussoirs, merlons; aligned on its wall. */
function gate(k: TownKit, poi: Poi, o: RampartOpts) {
  const { C, paint } = k;
  const best = wallAt(o.walls, poi.p);
  // gates away from the mapped walls (e.g. on a boulevard): the passage runs along the nearest street
  if (best.d > 15) { const r = nearestRoad(o.roads, poi.p); best.dir = [-r.dir[1], r.dir[0]]; }
  const L = Math.hypot(...best.dir), d: P2 = [best.dir[0] / L, best.dir[1] / L], n: P2 = [d[1], -d[0]];
  const [x, z] = poi.p, g = k.groundAt(x, z), W = 13, D = 9, H = (o.height ?? 8.5) + 4;
  const big = !!o.bigGate?.test(poi.name ?? '');
  // the arch passage runs across the wall (along n): extrude the arched slab along n
  C.add('block', arcade(W, H, 1, { pier: W - 5, spring: 4.6, thick: D }), frame(x - d[0] * W / 2, g - 0.6, z - d[1] * W / 2, d));
  merlons(k, frame(x - d[0] * W / 2 + n[0] * (D / 2 - 0.3), g + H - 0.6, z - d[1] * W / 2 + n[1] * (D / 2 - 0.3), d), W);
  merlons(k, frame(x - d[0] * W / 2 - n[0] * (D / 2 - 0.3), g + H - 0.6, z - d[1] * W / 2 - n[1] * (D / 2 - 0.3), d), W);
  // striped voussoirs around the arch on both faces
  const R = 2.5 / Math.cos(0.42);
  for (const side of [1, -1]) for (let i = 0; i <= 14; i++) {
    const a = Math.PI + 0.42 - (i / 14) * (Math.PI + 0.84);
    const px = Math.cos(a) * (R + 0.45), py = 4.6 + Math.sin(a) * (R + 0.45);
    const col = i % 2 ? new THREE.Color('#2d2a26') : MARBLE;
    const off = side * (D / 2 + 0.06);
    C.add('roof', paint(box(0.6, 0.9, 0.1, 0, 0, 0).rotateZ(a - Math.PI / 2), col), frame(x + d[0] * px + n[0] * off, g - 0.6 + py, z + d[1] * px + n[1] * off, d), false);
  }
  if (big) for (const side of [1, -1]) for (const s of [-1, 1]) {
    // marble columns flanking the passage
    const off = side * (D / 2 + 0.35), px = s * 3.4;
    C.add('roof', paint(cylinder(0.24, 0.26, 4.6, 10), MARBLE), frame(x + d[0] * px + n[0] * off, g - 0.4, z + d[1] * px + n[1] * off, d));
  }
  k.markSeg([x - d[0] * W / 2, z - d[1] * W / 2], [x + d[0] * W / 2, z + d[1] * W / 2], D / 2, k.flags.BLD);
  k.markSeg([x - n[0] * 10, z - n[1] * 10], [x + n[0] * 10, z + n[1] * 10], 3, k.flags.KEEP);
}
