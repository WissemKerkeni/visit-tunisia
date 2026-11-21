/**
 * Roman building pieces shared by the archaeological sites (Carthage, Dougga…), built with a TownKit:
 * columns with Corinthian-style capitals, temples on podiums, theatres fitted to their mapped outline,
 * triumphal arches and low ruined walls. Simplified shapes at real sizes.
 */
import * as THREE from 'three';
import { box, cylinder } from '../el-jem/geometry';
import type { P2, TownKit } from './terrain-town';

export const GRANITE = new THREE.Color('#8f8580');
export const MARBLE = new THREE.Color('#eee9df');
export const LIMESTONE = new THREE.Color('#a88d62');

export interface ColumnOpts { shaft?: THREE.Color; capital?: THREE.Color; plinth?: boolean; fallenYaw?: number }

/** A column (standing or fallen): plinth, moulded base, tapering shaft, capital with leaves and abacus. */
export function column(k: TownKit, x: number, z: number, y: number, h: number, r: number, o: ColumnOpts = {}) {
  const { C, paint } = k;
  const shaft = o.shaft ?? GRANITE, cap = o.capital ?? MARBLE;
  if (o.fallenYaw !== undefined) {
    const m = new THREE.Matrix4().makeRotationY(o.fallenYaw).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
    m.setPosition(x, y + r, z);
    C.add('roof', paint(cylinder(r, r * 1.04, h, 16, -h / 2), shaft), m);
    return;
  }
  let y0 = y;
  if (o.plinth !== false) { C.add('block', box(r * 2.8, 1.2, r * 2.8, x, y + 0.6, z)); y0 = y + 1.2; }
  C.add('roof', paint(cylinder(r * 1.25, r * 1.3, r * 0.65, 18, y0).translate(x, 0, z), cap));
  y0 += r * 0.65;
  C.add('roof', paint(cylinder(r * 0.88, r, h, 18, y0).translate(x, 0, z), shaft));
  const top = y0 + h;
  C.add('roof', paint(cylinder(r * 1.45, r * 0.95, r * 1.9, 16, top).translate(x, 0, z), cap), undefined, false);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    C.add('roof', paint(box(r * 0.47, r * 1.07, r * 0.4, x + Math.cos(a) * r * 1.05, top + r * 0.6, z + Math.sin(a) * r * 1.05), cap), undefined, false);
  }
  C.add('roof', paint(box(r * 3.2, r * 0.6, r * 3.2, x, top + r * 2.2, z), cap), undefined, false);
  return top + r * 2.5;
}

/** Low ruined walls filling an outline (foundations of houses, cisterns, basilicas). */
export function lowRuins(p: P2[], k: TownKit, maxH: number, step: number, mat: 'rubble' | 'block' = 'rubble') {
  const b = k.bbox(p), rnd = k.rnd;
  for (let z = b.z0 + step / 2; z < b.z1; z += step) for (let x = b.x0 + step / 2; x < b.x1; x += step) {
    if (!k.inPoly(x, z, p)) continue;
    const g = k.groundAt(x, z);
    if (rnd() < 0.7) k.C.add(mat, box(step * (0.6 + rnd() * 0.4), 0.4 + rnd() * maxH, 0.7, x, g - 0.3 + 0.4, z));
    if (rnd() < 0.6) k.C.add(mat, box(0.7, 0.4 + rnd() * maxH, step * (0.6 + rnd() * 0.4), x + step / 2, g - 0.3 + 0.4, z + step / 2));
  }
}

export interface TheatreSpec {
  /** Centre of the orchestra. */ c: P2;
  /** Orchestra radius and outer radius of the seats (m). */ r0: number; R: number;
  /** Unit vector from the centre towards the stage (the open side). */ open: P2;
  rowRise?: number;
  colour?: THREE.Color;
}

/** Roman theatre: semicircular rows of seats resting on the hillside, orchestra, stage and a row of columns. */
export function romanTheatre(k: TownKit, t: TheatreSpec, columnOpts: ColumnOpts = {}) {
  const { C, groundAt } = k;
  const [mx, mz] = t.c, [ox, oz] = t.open;
  const nx = -ox, nz = -oz;
  const ux = -nz, uz = nx;
  const y0 = groundAt(mx, mz);
  const disc: P2[] = [];
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; disc.push([mx + Math.cos(a) * (t.R + 4), mz + Math.sin(a) * (t.R + 4)]); }
  k.markPoly(disc, k.flags.KEEP);
  const rows = Math.floor((t.R - t.r0) / 0.85), rise = t.rowRise ?? 0.4;
  const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(ux, 0, uz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-nx, 0, -nz)).setPosition(mx, 0, mz);
  for (let i = 0; i < rows; i++) {
    const r0 = t.r0 + i * 0.85, r1 = r0 + 0.85;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, r1, 0, Math.PI, false);
    shape.absarc(0, 0, r0, Math.PI, 0, true);
    const h = (i + 1) * rise;
    const g = new THREE.ExtrudeGeometry(shape, { depth: h + 2, bevelEnabled: false, curveSegments: 40 }).rotateX(-Math.PI / 2).translate(0, y0 - 2, 0);
    C.add('block', g, basis);
  }
  const orch: P2[] = [];
  for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI; orch.push([mx + ux * Math.cos(a) * t.r0 + nx * Math.sin(a) * t.r0, mz + uz * Math.cos(a) * t.r0 + nz * Math.sin(a) * t.r0]); }
  const of = k.flat(orch, y0 + 0.05); if (of) C.add('paving', of);
  const span = t.R * 1.6;
  const sm = new THREE.Matrix4().makeRotationY(-Math.atan2(uz, ux)).setPosition(mx + ox * 5, 0, mz + oz * 5);
  C.add('block', box(span, 1.3, 9, 0, y0 + 0.15, 0), sm);
  for (let s = -span * 0.42; s <= span * 0.42 + 1e-6; s += span * 0.12) column(k, mx + ox * 8 + ux * s, mz + oz * 8 + uz * s, y0 + 0.8, 5.5, 0.4, columnOpts);
  return y0;
}

export interface TempleSpec {
  /** Centre of the podium and the unit direction the front faces. */ c: P2; front: P2;
  /** Podium width (across the front) and length, and podium height. */ w: number; l: number; podium: number;
  /** Columns across the front, and extra columns down each side of the porch. */ cols: number; sideCols?: number;
  colH: number; colR: number;
  /** Fraction of the length taken by the porch (the rest is the cella). */ porch?: number;
  pediment?: boolean;
  /** Pitched roof behind the pediment (default true; ruined temples are roofless). */
  roof?: boolean;
  /** Cella wall height above the podium (0 = no cella left). */ cellaH?: number;
  shaft?: THREE.Color; capital?: THREE.Color;
}

/** A temple on a podium: front steps, porch of columns, cella, entablature and pediment. */
export function temple(k: TownKit, t: TempleSpec) {
  const { C, paint, groundAt } = k;
  const [fx, fz] = t.front, sx = -fz, sz = fx; // side direction
  const yaw = -Math.atan2(sz, sx);              // local x across the front, local z = -front
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(t.c[0], 0, t.c[1]);
  const corners: P2[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [t.c[0] + sx * a * t.w / 2 + fx * b * t.l / 2, t.c[1] + sz * a * t.w / 2 + fz * b * t.l / 2]);
  const g0 = Math.min(...corners.map(([x, z]) => groundAt(x, z)));
  const top = Math.max(...corners.map(([x, z]) => groundAt(x, z))) + t.podium;
  // podium (local z points to the back)
  C.add('block', box(t.w, top - g0 + 0.5, t.l, 0, g0 - 0.5 + (top - g0 + 0.5) / 2, 0), m);
  C.add('block', box(t.w + 0.4, 0.35, t.l + 0.4, 0, top - 0.17, 0), m, false);
  // front steps down to the ground
  const steps = Math.max(2, Math.ceil((top - groundAt(t.c[0] + fx * (t.l / 2 + 1), t.c[1] + fz * (t.l / 2 + 1))) / 0.3));
  for (let i = 0; i < steps; i++) {
    const h = top - (i + 1) * ((top - g0) / steps);
    C.add('block', box(t.w * 0.8, h - g0 + 0.5, 0.42, 0, g0 - 0.5 + (h - g0 + 0.5) / 2, -(t.l / 2 + 0.21 + i * 0.4)), m);
  }
  const porch = (t.porch ?? 0.38) * t.l;
  // cella
  const cellaH = t.cellaH ?? t.colH + 1;
  if (cellaH > 0) {
    const cl = t.l - porch, cz = -t.l / 2 + porch + cl / 2;
    for (const side of [-1, 1]) C.add('block', box(1.1, cellaH, cl, side * (t.w / 2 - 0.9), top + cellaH / 2, cz), m);
    C.add('block', box(t.w - 0.6, cellaH, 1.1, 0, top + cellaH / 2, t.l / 2 - 0.55), m);
    // front wall with the great door
    const dw = t.w * 0.28;
    for (const side of [-1, 1]) C.add('block', box((t.w - dw) / 2 - 0.4, cellaH, 1.1, side * (dw / 2 + ((t.w - dw) / 2 - 0.4) / 2), top + cellaH / 2, -t.l / 2 + porch), m);
    C.add('block', box(dw, cellaH * 0.3, 1.1, 0, top + cellaH * 0.85, -t.l / 2 + porch), m);
  }
  // porch columns, entablature and pediment
  const colTop = top + 1.2 * 0 + t.colR * 0.65 + t.colH + t.colR * 2.5;
  const ys: number[] = [];
  const place = (lx: number, lz: number) => {
    const x = t.c[0] + sx * lx - fx * lz, z = t.c[1] + sz * lx - fz * lz;
    ys.push(column(k, x, z, top, t.colH, t.colR, { plinth: false, shaft: t.shaft ?? LIMESTONE, capital: t.capital ?? LIMESTONE }) ?? colTop);
  };
  for (let i = 0; i < t.cols; i++) place(-t.w / 2 + 1.2 + (i * (t.w - 2.4)) / (t.cols - 1), -t.l / 2 + 1.2);
  for (let j = 1; j <= (t.sideCols ?? 0); j++) for (const side of [-1, 1]) place(side * (t.w / 2 - 1.2), -t.l / 2 + 1.2 + j * (porch - 1.2) / ((t.sideCols ?? 0) + 0.5));
  const eY = Math.max(...ys, colTop);
  const stone = t.capital ?? LIMESTONE;
  if (t.roof !== false) {
    C.add('roof', paint(box(t.w, 1.5, t.l * 0.98, 0, eY + 0.75, 0), stone), m);          // entablature over porch and cella
    C.add('roof', paint(box(t.w + 0.5, 0.35, t.l + 0.2, 0, eY + 1.62, 0), stone), m, false); // cornice
  } else {
    // roofless: the entablature and cornice only run round the top of the walls and the porch
    const L = t.l * 0.98, W = t.w;
    for (const [w, d, x, z] of [[W, 1.1, 0, L / 2 - 0.55], [W, 1.1, 0, -L / 2 + 0.55], [1.1, L, W / 2 - 0.55, 0], [1.1, L, -W / 2 + 0.55, 0]]) {
      C.add('roof', paint(box(w, 1.5, d, x, eY + 0.75, z), stone), m);
      C.add('roof', paint(box(w + (d > w ? 0.5 : 0), 0.35, d + (d > w ? 0 : 0.5), x, eY + 1.62, z), stone), m, false);
    }
  }
  if (t.pediment !== false) {
    const ph = t.w * 0.2;
    const shape = new THREE.Shape([new THREE.Vector2(-t.w / 2 - 0.2, 0), new THREE.Vector2(t.w / 2 + 0.2, 0), new THREE.Vector2(0, ph)]);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false }).translate(0, eY + 1.8, -t.l / 2 - 0.1);
    C.add('roof', paint(g, stone), m, false);
    // roof ridge back from the pediment
    if (t.roof !== false) {
      const roof = new THREE.ExtrudeGeometry(shape, { depth: t.l - 1.4, bevelEnabled: false }).translate(0, eY + 1.8, -t.l / 2 + 1.1);
      C.add('roof', paint(roof, new THREE.Color('#b9a888')), m, false);
    }
  }
  return top;
}

/** A single-bay triumphal arch: two piers, the vault, an attic; the passage runs along `through`. */
export function arch(k: TownKit, c: P2, through: P2, width: number, depth: number, height: number, ruinedTop = 0) {
  const { C, groundAt } = k;
  const yaw = -Math.atan2(-through[0], through[1]); // local x across the passage, local z along it
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(c[0], 0, c[1]);
  const g = groundAt(c[0], c[1]);
  const opening = width * 0.45, pier = (width - opening) / 2, spring = height * 0.55;
  for (const s of [-1, 1]) C.add('block', box(pier, spring, depth, s * (opening / 2 + pier / 2), g - 0.5 + spring / 2, 0), m);
  // vault (half ring) and the masonry above it
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0); shape.lineTo(-opening / 2, 0); shape.absarc(0, 0, opening / 2, Math.PI, 0, true); shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, height * 0.45 - ruinedTop); shape.lineTo(-width / 2, height * 0.45 - ruinedTop * 0.4); shape.closePath();
  const v = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 18 }).translate(0, g - 0.5 + spring, -depth / 2);
  C.add('block', v, m);
  // pilasters on both faces
  for (const s of [-1, 1]) for (const f of [-1, 1]) C.add('block', box(0.8, spring + height * 0.25, 0.35, s * (width / 2 - 0.6), g - 0.5 + (spring + height * 0.25) / 2, f * (depth / 2 + 0.17)), m, false);
}

/** An arch from its mapped footprint: the long side is the face, the passage runs across it. */
export function archFrom(p: P2[], k: TownKit, height: number, ruined: number) {
  const c = k.centroid(p);
  let a = p[0], b = p[1], L = 0;
  for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length], d = Math.hypot(r[0] - q[0], r[1] - q[1]); if (d > L) { L = d; a = q; b = r; } }
  const fx = (b[0] - a[0]) / L, fz = (b[1] - a[1]) / L;
  const depth = Math.min(...p.map((q, i) => { const r = p[(i + 1) % p.length]; return Math.hypot(r[0] - q[0], r[1] - q[1]); }).filter((d) => d > 1));
  arch(k, c, [fz, -fx], L, Math.max(2.5, depth), height, ruined);
  return { c, face: [fx, fz] as P2, width: L, depth: Math.max(2.5, depth) };
}

/** A ruined wall following an outline (enclosures, amphitheatre rings, a hippodrome's spina): broken lengths of rubble. */
export function outlineWall(p: P2[], k: TownKit, h: number, closed = true) {
  for (let i = 0; i < p.length - (closed ? 0 : 1); i++) {
    const a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 0; s < L; s += 4) {
      if (k.rnd() < 0.25) continue;
      const x = a[0] + ((b[0] - a[0]) * (s + 2)) / L, z = a[1] + ((b[1] - a[1]) * (s + 2)) / L;
      const hh = h * (0.5 + k.rnd() * 0.5);
      const m = new THREE.Matrix4().makeRotationY(-Math.atan2(b[1] - a[1], b[0] - a[0])).setPosition(x, 0, z);
      k.C.add('rubble', box(4.1, hh, 1.4, 0, k.groundAt(x, z) - 0.3 + hh / 2, 0), m);
    }
  }
}
