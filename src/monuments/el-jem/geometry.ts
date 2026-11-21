import * as THREE from 'three';

/** Real dimensions of the amphitheatre (metres). Major axis along x. */
export const OUTER = { A: 74, B: 61 };   // 148 × 122 m
export const ARENA = { a: 32, b: 19.5 }; // 64 × 39 m
/** Average radial width between arena edge and facade, used to convert s to metres. */
export const RING_W = ((OUTER.A - ARENA.a) + (OUTER.B - ARENA.b)) / 2;

export function axes(s: number): [number, number] {
  return [ARENA.a + (OUTER.A - ARENA.a) * s, ARENA.b + (OUTER.B - ARENA.b) * s];
}

export function ringXZ(t: number, s: number): [number, number] {
  const [ax, bz] = axes(s);
  return [ax * Math.cos(t), bz * Math.sin(t)];
}

export function ringPoint(t: number, s: number, y: number) {
  const [x, z] = ringXZ(t, s);
  return new THREE.Vector3(x, y, z);
}

/** Speed |dP/dt| on the ellipse of ring s at parameter t. */
export function ringSpeed(t: number, s: number) {
  const [ax, bz] = axes(s);
  return Math.hypot(ax * Math.sin(t), bz * Math.cos(t));
}

/**
 * Boundaries of n bays of equal arc length on ring s, with bay 0 centred on t = 0.
 * Returns n + 1 parameters, increasing, spanning one full turn.
 */
export function bayBoundaries(n: number, s: number): number[] {
  const N = 4096;
  const cum = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) {
    const tm = ((i - 0.5) / N) * Math.PI * 2;
    cum[i] = cum[i - 1] + ringSpeed(tm, s) * (Math.PI * 2 / N);
  }
  const total = cum[N];
  const paramAt = (len: number) => {
    let L = ((len % total) + total) % total;
    let lo = 0, hi = N;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= L) lo = mid; else hi = mid; }
    const f = (L - cum[lo]) / (cum[hi] - cum[lo]);
    return ((lo + f) / N) * Math.PI * 2;
  };
  const out: number[] = [];
  for (let k = 0; k <= n; k++) {
    let p = paramAt((k - 0.5) / n * total);
    if (k === 0) p -= Math.PI * 2; // first boundary is just below 0
    out.push(p);
  }
  out[n] = out[0] + Math.PI * 2;
  for (let k = 1; k < n; k++) if (out[k] < out[k - 1]) out[k] += Math.PI * 2;
  return out;
}

/** Matrix that places a flat panel (local x along the chord, local +z pointing inward) between t0 and t1 on ring s. */
export function bayMatrix(t0: number, t1: number, s: number, y: number, refWidth: number) {
  const [x0, z0] = ringXZ(t0, s);
  const [x1, z1] = ringXZ(t1, s);
  const dx = x1 - x0, dz = z1 - z0;
  const w = Math.hypot(dx, dz);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-dz, dx));
  m.compose(new THREE.Vector3((x0 + x1) / 2, y, (z0 + z1) / 2), q, new THREE.Vector3(w / refWidth, 1, 1));
  return { matrix: m, width: w };
}

/** Deterministic hash noise in [0, 1). */
export function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function noise1(x: number, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i + seed * 57) * (1 - u) + hash(i + 1 + seed * 57) * u;
}

// ---------------------------------------------------------------------------
// Sweep of a closed polygon in (s, y) space around the ellipse.

export type Profile = THREE.Vector2[]; // x = s, y = height
export interface SweepOpts {
  segments?: number;
  capStart?: boolean;
  capEnd?: boolean;
  /** Profile can vary with t (must keep the same vertex count). */
  profileAt?: (t: number) => Profile;
}

function signedArea(p: Profile) {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length]; a += q.x * r.y - r.x * q.y; }
  return a / 2;
}

export function sweep(profile: Profile, t0: number, t1: number, opts: SweepOpts = {}): THREE.BufferGeometry {
  const midS = profile.reduce((a, p) => a + p.x, 0) / profile.length;
  const arc = Math.abs(t1 - t0) * ringSpeed((t0 + t1) / 2, midS);
  const segs = opts.segments ?? Math.max(2, Math.ceil(arc / 1.1));
  const getProfile = (t: number) => {
    const p = opts.profileAt ? opts.profileAt(t) : profile;
    return signedArea(p) < 0 ? [...p].reverse() : p;
  };

  const pos: number[] = [];
  const uv: number[] = [];
  const profiles: Profile[] = [];
  const ts: number[] = [];
  for (let j = 0; j <= segs; j++) { const t = t0 + (t1 - t0) * (j / segs); ts.push(t); profiles.push(getProfile(t)); }
  const n = profiles[0].length;

  // arc-length (u) per profile vertex, accumulated along t
  const u = profiles.map(() => new Float64Array(n));
  for (let j = 1; j <= segs; j++) {
    for (let k = 0; k < n; k++) {
      const a = ringPoint(ts[j - 1], profiles[j - 1][k].x, 0), b = ringPoint(ts[j], profiles[j][k].x, 0);
      u[j][k] = u[j - 1][k] + a.distanceTo(b);
    }
  }
  // v along profile, in metres
  const vOf = (p: Profile) => {
    const v = new Float64Array(n + 1);
    for (let k = 1; k <= n; k++) {
      const a = p[k - 1], b = p[k % n];
      v[k] = v[k - 1] + Math.hypot((b.x - a.x) * RING_W, b.y - a.y);
    }
    return v;
  };

  const push = (P: THREE.Vector3, U: number, V: number) => { pos.push(P.x, P.y, P.z); uv.push(U, V); };
  for (let j = 0; j < segs; j++) {
    const pa = profiles[j], pb = profiles[j + 1];
    const va = vOf(pa), vb = vOf(pb);
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n;
      const A = ringPoint(ts[j], pa[k].x, pa[k].y), B = ringPoint(ts[j], pa[k2].x, pa[k2].y);
      const C = ringPoint(ts[j + 1], pb[k2].x, pb[k2].y), D = ringPoint(ts[j + 1], pb[k].x, pb[k].y);
      const uA = u[j][k], uB = u[j][k2], uC = u[j + 1][k2], uD = u[j + 1][k];
      const vA = va[k], vB = va[k + 1], vC = vb[k + 1], vD = vb[k];
      push(A, uA, vA); push(B, uB, vB); push(C, uC, vC);
      push(A, uA, vA); push(C, uC, vC); push(D, uD, vD);
    }
  }

  const cap = (t: number, p: Profile, dirSign: number) => {
    const tris = THREE.ShapeUtils.triangulateShape(p, []);
    const tangent = new THREE.Vector3(-Math.sin(t), 0, Math.cos(t)).multiplyScalar(dirSign);
    for (const [i0, i1, i2] of tris) {
      const P0 = ringPoint(t, p[i0].x, p[i0].y), P1 = ringPoint(t, p[i1].x, p[i1].y), P2 = ringPoint(t, p[i2].x, p[i2].y);
      const nrm = new THREE.Vector3().subVectors(P1, P0).cross(new THREE.Vector3().subVectors(P2, P0));
      const order = nrm.dot(tangent) >= 0 ? [i0, i1, i2] : [i0, i2, i1];
      for (const i of order) push(ringPoint(t, p[i].x, p[i].y), p[i].x * RING_W, p[i].y);
    }
  };
  if (opts.capStart) cap(ts[0], profiles[0], -1);
  if (opts.capEnd) cap(ts[segs], profiles[segs], 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** Rectangle profile helper. */
export function rect(s0: number, s1: number, y0: number, y1: number): Profile {
  return [new THREE.Vector2(s0, y0), new THREE.Vector2(s1, y0), new THREE.Vector2(s1, y1), new THREE.Vector2(s0, y1)];
}

/** Sutherland–Hodgman clip of a polygon to the half-plane y >= yMin. */
export function clipAbove(p: Profile, yMin: number): Profile {
  const out: Profile = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const ina = a.y >= yMin, inb = b.y >= yMin;
    if (ina) out.push(a.clone());
    if (ina !== inb) {
      const f = (yMin - a.y) / (b.y - a.y);
      out.push(new THREE.Vector2(a.x + (b.x - a.x) * f, yMin));
    }
  }
  // drop consecutive duplicates
  return out.filter((v, i) => i === 0 || v.distanceTo(out[i - 1]) > 1e-6);
}

// ---------------------------------------------------------------------------
// Arch panels (flat, extruded) for the arcades.

export interface ArchPanelOpts {
  width: number;
  height: number;
  depth: number;
  opening?: number;        // arch width, 0 for a solid panel
  spring?: number;         // height where the arch starts
  sill?: number;           // opening bottom (0 = door to the floor)
  jagged?: number;         // 0 = straight top; > 0 = ruined top with this max loss (m)
  seed?: number;
  window?: { w: number; h: number; y: number };
}

export function archPanel(o: ArchPanelOpts): THREE.BufferGeometry {
  const { width: w, height: h, depth } = o;
  const s = new THREE.Shape();
  const top = (sh: THREE.Shape | THREE.Path) => {
    if (!o.jagged) { sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); return; }
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const x = w / 2 - (w * i) / steps;
      const loss = o.jagged * (0.25 + 0.75 * hash(i * 3.1 + (o.seed ?? 0) * 17.3));
      sh.lineTo(x, h - loss);
    }
  };
  const r = (o.opening ?? 0) / 2;
  const sill = o.sill ?? 0;
  if (r > 0 && sill === 0) {
    s.moveTo(-w / 2, 0);
    s.lineTo(-r, 0);
    s.lineTo(-r, o.spring!);
    s.absarc(0, o.spring!, r, Math.PI, 0, true);
    s.lineTo(r, 0);
    s.lineTo(w / 2, 0);
    top(s);
    s.closePath();
  } else {
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); top(s); s.closePath();
    if (r > 0) {
      const hole = new THREE.Path();
      hole.moveTo(-r, sill); hole.lineTo(r, sill); hole.lineTo(r, o.spring!);
      hole.absarc(0, o.spring!, r, 0, Math.PI, false);
      hole.closePath();
      s.holes.push(hole);
    }
    if (o.window) {
      const { w: ww, h: wh, y } = o.window;
      const hole = new THREE.Path();
      hole.moveTo(-ww / 2, y); hole.lineTo(ww / 2, y); hole.lineTo(ww / 2, y + wh); hole.lineTo(-ww / 2, y + wh); hole.closePath();
      s.holes.push(hole);
    }
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Box with UVs in metres (for consistent texture scale). */
export function box(w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const nrm = g.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i));
    const [su, sv] = nx > 0.5 ? [d, h] : ny > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
  g.translate(x, y, z);
  return g.toNonIndexed();
}

export function cylinder(rTop: number, rBot: number, h: number, seg = 14, y = 0): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * rBot, uv.getY(i) * h);
  g.translate(0, y + h / 2, 0);
  return g.toNonIndexed();
}
