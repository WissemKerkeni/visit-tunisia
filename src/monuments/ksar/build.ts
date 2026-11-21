/**
 * Ksar Ouled Soltane: the fortified granary on its hilltop south of Tataouine, two courtyards ringed by ghorfas
 * (vaulted storage cells) stacked up to four storeys.
 * The outline and both courtyards come from OpenStreetMap (the second courtyard is the notch in the mapped outline,
 * open to the east), with the village, roads and terrain around (AWS Terrain Tiles); built on the shared
 * terrain-town builder:
 * - a plastered base two storeys high on the whole outline, and on the courtyard sides columns of ghorfas rising
 *   to three or four storeys, each with its barrel vault on top (the scalloped roofline of the photos);
 * - small wooden doors on every level, beam ends below the upper doors, and stair ramps against the walls;
 * - one ghorfa open to walk into, and the passage roofed with palm trunks between the two courtyards.
 * Shapes are simplified. Scene frame: origin 32.78843 N, 10.51483 E, x = east, z = south.
 */
import * as THREE from 'three';
import TOWN from '../../content/ksar-ouled-soltane-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { Acc, UP, doorPath, loft, planar } from '../common/vaults';
import { box, cylinder, hash } from '../el-jem/geometry';

const BUILDINGS = TOWN.buildings as Building[];
const area = (p: P2[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const ccw = (p: P2[]) => (area(p) < 0 ? [...p].reverse() : [...p]);
const centroidOf = (p: P2[]): P2 => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const nearestIdx = (p: P2[], q: P2) => { let bi = 0, bd = Infinity; p.forEach((v, i) => { const d = Math.hypot(v[0] - q[0], v[1] - q[1]); if (d < bd) { bd = d; bi = i; } }); return bi; };

const KSAR = BUILDINGS.find((b) => b.id === 2516832) ?? BUILDINGS.find((b) => /Ouled Soltane/i.test(b.name ?? '') && b.k === 'ruins')!;
/** The whole outline (counter-clockwise), with the second courtyard as a notch open to the east. */
export const OUT: P2[] = ccw(KSAR.p);
/** The first (older) courtyard, mapped as the inner ring. */
export const COURT1: P2[] = ccw(KSAR.holes?.[0] ?? [[-43.3, 9.6], [-38.6, 10.8], [-37, 7.2], [-26, 9.8], [-14.6, 11.6], [-9.3, 3.3], [-7.8, -5.3], [-28.2, -9], [-40, -8.8]]);
const iA = nearestIdx(OUT, [48.7, -14]), iB = nearestIdx(OUT, [49.7, -2.6]);
const [n0, n1] = iA < iB ? [iA, iB] : [iB, iA];
/** The second courtyard, closed across its open end. */
export const COURT2: P2[] = ccw(OUT.slice(n0, n1 + 1));
/** The footprint with the second courtyard filled in (for levelling the ground). */
export const FOOT: P2[] = ccw([...OUT.slice(0, n0 + 1), ...OUT.slice(n1)]);
const GATE_A = OUT[n0], GATE_B = OUT[n1];
export const GATE: P2 = [(GATE_A[0] + GATE_B[0]) / 2, (GATE_A[1] + GATE_B[1]) / 2];
const NOTCH = new Set(Array.from({ length: n1 - n0 }, (_, i) => n0 + i)); // outline edges facing the second courtyard

const LH = 2.7;          // height of one storey of ghorfas
const H0 = 2 * LH;       // the plastered base: two storeys all round
const inPoly = (x: number, z: number, p: P2[]) => {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};
/** Distance from p along d to the first outline or courtyard edge (other than the one it starts on). */
function reach(p: P2, d: P2, skip: P2[] | null) {
  let best = Infinity;
  for (const poly of [OUT, COURT1]) for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (skip && skip[0] === a && skip[1] === b) continue;
    const ex = b[0] - a[0], ez = b[1] - a[1], den = d[0] * ez - d[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - p[0]) * ez - (a[1] - p[1]) * ex) / den, s = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den;
    if (t > 0.05 && s >= 0 && s <= 1) best = Math.min(best, t);
  }
  return best;
}

/** Places worked out while building (for the hotspots). */
export const SPOTS = {
  y0: 500,
  ghorfa: { at: [0, 0] as P2, front: [0, 1] as P2, depth: 4 },
  stair: { at: [0, 0] as P2, front: [0, 1] as P2, y: 0 },
  passage: { a: [0, 0] as P2, b: [0, 0] as P2 },
};

interface Edge { a: P2; b: P2; L: number; u: P2; f: P2; court: 0 | 1 | 2 }
interface Notch { s: number; path: (s: number, y0: number) => P2[] }

const SAND = 'sand' as const;
const WOOD = new THREE.Color('#5d4632'), DARK = new THREE.Color('#2a221b'), PALM = new THREE.Color('#7b5c3d'), JAR = new THREE.Color('#b9875a');

function ksar(k: TownKit) {
  const Y0 = k.groundAt(...centroidOf(COURT1));
  SPOTS.y0 = Y0;
  const A = { sand: new Acc(), ground: new Acc(), paving: new Acc() };
  const rnd = (n: number) => hash(n * 1.37 + 0.29);

  // ---- every wall of the base, facing out of the mass ----
  const edges: Edge[] = [];
  const addEdges = (poly: P2[], into: (m: P2, f: P2) => boolean, courtOf: (i: number) => 0 | 1 | 2) => {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 0.2) continue;
      const u: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let f: P2 = [u[1], -u[0]];
      if (!into(m, f)) f = [-f[0], -f[1]];
      edges.push({ a, b, L, u, f, court: courtOf(i) });
    }
  };
  addEdges(OUT, (m, f) => !inPoly(m[0] + f[0] * 0.3, m[1] + f[1] * 0.3, OUT), (i) => (NOTCH.has(i) ? 2 : 0));
  addEdges(COURT1, (m, f) => inPoly(m[0] + f[0] * 0.3, m[1] + f[1] * 0.3, COURT1), () => 1);
  const notches = new Map<Edge, Notch[]>();
  const addNotch = (e: Edge, n: Notch) => { if (!notches.has(e)) notches.set(e, []); notches.get(e)!.push(n); };

  // ---- the passage between the courtyards, roofed with palm trunks ----
  // straight out of a wall of the first courtyard, square to it, to the nearest wall of the second
  const PW = 2.2, PH = 2.5;
  {
    let best: { e1: Edge; s1: number; e2: Edge; s2: number; t: number } | null = null;
    for (const e1 of edges) {
      if (e1.court !== 1) continue;
      for (let s1 = PW / 2 + 0.4; s1 <= e1.L - PW / 2 - 0.4; s1 += 0.5) {
        const p: P2 = [e1.a[0] + e1.u[0] * s1, e1.a[1] + e1.u[1] * s1], d: P2 = [-e1.f[0], -e1.f[1]];
        const first = reach(p, d, [e1.a, e1.b]);
        for (const e2 of edges) {
          if (e2.court !== 2) continue;
          const ex = e2.b[0] - e2.a[0], ez = e2.b[1] - e2.a[1], den = d[0] * ez - d[1] * ex;
          if (Math.abs(den) < 1e-9) continue;
          const t = ((e2.a[0] - p[0]) * ez - (e2.a[1] - p[1]) * ex) / den, sr = ((e2.a[0] - p[0]) * d[1] - (e2.a[1] - p[1]) * d[0]) / den;
          if (t < 0.5 || t > 9 || sr < 0 || sr > 1 || Math.abs(t - first) > 0.05) continue;
          const c = Math.abs(d[0] * e2.f[0] + d[1] * e2.f[1]), hw = PW / 2 / Math.max(c, 0.01), s2 = sr * e2.L;
          if (c < 0.6 || s2 - hw < 0.3 || s2 + hw > e2.L - 0.3) continue;
          if (!best || t < best.t) best = { e1, s1, e2, s2, t };
        }
      }
    }
    if (best) {
      const { e1, s1, e2, s2 } = best;
      const d = new THREE.Vector3(-e1.f[0], 0, -e1.f[1]);
      const perp: P2 = [-d.z, d.x];
      // the lateral axis at each end, sheared to lie in that wall (so the side walls meet it squarely)
      const shear = (n: P2): P2 => { const k2 = -(perp[0] * n[0] + perp[1] * n[1]) / (d.x * n[0] + d.z * n[1]); return [perp[0] + d.x * k2, perp[1] + d.z * k2]; };
      const u1 = shear(e1.f), u2 = shear(e2.f);
      const P1 = new THREE.Vector3(e1.a[0] + e1.u[0] * s1, Y0, e1.a[1] + e1.u[1] * s1);
      const P2v = new THREE.Vector3(e2.a[0] + e2.u[0] * s2, Y0, e2.a[1] + e2.u[1] * s2);
      const notch = (e: Edge, u: P2) => { const hw = (PW / 2) * Math.abs(u[0] * e.u[0] + u[1] * e.u[1]); return (ss: number, y0: number): P2[] => [[ss - hw, y0], [ss - hw, y0 + PH], [ss + hw, y0 + PH], [ss + hw, y0]]; };
      addNotch(e1, { s: s1, path: notch(e1, u1) });
      addNotch(e2, { s: s2, path: notch(e2, u2) });
      const prof: P2[] = [[-PW / 2, 0], [-PW / 2, PH], [PW / 2, PH], [PW / 2, 0]];
      loft(A.sand, A.paving, [{ P: P1, u: u1 }, { P: P2v, u: u2 }], prof, undefined, 1.2);
      const len = P1.distanceTo(P2v);
      for (let t = 0.25; t < len; t += 0.42) {
        const c = P1.clone().addScaledVector(d, t);
        const g = cylinder(0.11, 0.12, PW, 7, -PW / 2).rotateZ(Math.PI / 2).rotateY(-Math.atan2(d.z, d.x) + Math.PI / 2);
        k.C.add('roof', k.paint(g.translate(c.x, Y0 + PH - 0.12, c.z), PALM), undefined, false);
      }
      SPOTS.passage = { a: [P1.x, P1.z], b: [P2v.x, P2v.z] };
    }
  }

  // ---- an open ghorfa in the first courtyard, on its longest side ----
  const longest1 = edges.filter((e) => e.court === 1).sort((a, b) => b.L - a.L)[0];
  const GW = 1.2, GS = 1.25;
  {
    const e = longest1, s = e.L * 0.62;
    addNotch(e, { s, path: (ss, y0) => doorPath(ss, y0, GW, GS) });
    const at: P2 = [e.a[0] + e.u[0] * s, e.a[1] + e.u[1] * s], back: P2 = [-e.f[0], -e.f[1]];
    const depth = Math.max(3, Math.min(6.5, reach(at, back, [e.a, e.b]) - 0.6));
    const P = (t: number) => new THREE.Vector3(at[0] + back[0] * t, Y0, at[1] + back[1] * t);
    const W = 2.6, S = 1.5;
    loft(A.sand, A.ground, [{ P: P(0), u: e.u }, { P: P(0.5), u: e.u }], doorPath(0, 0, GW, GS), undefined, 1);
    loft(A.sand, A.ground, [{ P: P(0.5), u: e.u }, { P: P(depth), u: e.u }], doorPath(0, 0, W, S), undefined, 1.4);
    planar(A.sand, [[-W / 2, 0], ...doorPath(0, 0, GW, GS), [W / 2, 0], ...doorPath(0, 0, W, S).slice(1, -1).reverse()], [], P(0.5), e.u, new THREE.Vector3(back[0], 0, back[1]));
    planar(A.sand, doorPath(0, 0, W, S), [], P(depth), e.u, new THREE.Vector3(-back[0], 0, -back[1]));
    // grain and oil jars along the walls
    for (let i = 0; i < 5; i++) {
      const t = 1.2 + i * ((depth - 1.6) / 4), sx = (i % 2 ? 1 : -1) * (W / 2 - 0.45);
      const q = P(t).addScaledVector(new THREE.Vector3(e.u[0], 0, e.u[1]), sx);
      const jar = new THREE.LatheGeometry([0.1, 0.28, 0.36, 0.34, 0.22, 0.12, 0.14].map((r, j) => new THREE.Vector2(r, j * 0.14)), 12).translate(q.x, Y0, q.z);
      k.C.add('roof', k.paint(jar, JAR), undefined, false);
    }
    SPOTS.ghorfa = { at, front: e.f, depth };
  }

  // ---- walls of the base, with the openings ----
  for (const e of edges) {
    const top = Y0 + H0 + (e.court === 0 ? 0.35 : 0);
    const out: P2[] = [[0, Y0 - 1.5]];
    for (const n of (notches.get(e) ?? []).sort((a, b) => a.s - b.s)) { const p = n.path(n.s, Y0); out.push([p[0][0], Y0 - 1.5], ...p, [p[p.length - 1][0], Y0 - 1.5]); }
    out.push([e.L, Y0 - 1.5], [e.L, top], [0, top]);
    // (the notch paths start and end at the floor: drop them to the wall's foot so the outline stays simple)
    const clean = out.filter((q, i) => i === 0 || q[0] !== out[i - 1][0] || q[1] !== out[i - 1][1]);
    planar(A.sand, clean, [], new THREE.Vector3(e.a[0], 0, e.a[1]), e.u, new THREE.Vector3(e.f[0], 0, e.f[1]));
  }
  // flat roof of the base (the courtyards left open)
  {
    const v2 = (q: P2) => new THREE.Vector2(q[0], q[1]);
    const tris = THREE.ShapeUtils.triangulateShape(OUT.map(v2), [COURT1.map(v2)]);
    const all = [...OUT, ...COURT1];
    for (const [a, b, c] of tris) {
      const P = (q: P2) => new THREE.Vector3(q[0], Y0 + H0, q[1]);
      A.sand.tri(P(all[a]), P(all[b]), P(all[c]), all[a], all[b], all[c], UP);
    }
  }

  // ---- columns of ghorfas on the courtyard sides ----
  const vault = (r: number, D: number) => new THREE.CylinderGeometry(r, r, D, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
  const stairsPlan: { e: Edge; s: number; level: number }[] = [];
  let cellId = 0;
  for (const e of edges) {
    if (e.court === 0 || e.L < 2.4) continue;
    const n = Math.max(1, Math.round(e.L / 3)), w = e.L / n;
    const yaw = Math.atan2(-e.f[0], -e.f[1]); // local z = into the mass
    const back: P2 = [-e.f[0], -e.f[1]];
    const busy = notches.get(e) ?? [];
    for (let i = 0; i < n; i++) {
      const id = ++cellId, s = (i + 0.5) * w;
      const at: P2 = [e.a[0] + e.u[0] * s, e.a[1] + e.u[1] * s];
      const D = Math.min(7.5, reach(at, back, [e.a, e.b]) - 0.3);
      if (D < 2) continue;
      const levels = D < 3 ? 2 : e.court === 1 ? (rnd(id) < 0.75 ? 4 : 3) : 2 + Math.floor(rnd(id * 2.3) * 2.6);
      const top = Y0 + levels * LH;
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(at[0] + back[0] * (D / 2), 0, at[1] + back[1] * (D / 2));
      if (levels > 2) k.C.add(SAND, box(w - 0.06, top - (Y0 + H0) + 0.02, D, 0, (Y0 + H0 + top) / 2, 0), m);
      k.C.add(SAND, vault(w / 2 - 0.06, D).translate(0, top, 0), m);
      // doors on every level, beam ends under the upper ones
      const blocked = busy.some((nn) => Math.abs(nn.s - s) < w / 2 + 0.6);
      const face = new THREE.Matrix4().makeRotationY(yaw).setPosition(at[0] + e.f[0] * 0.03, 0, at[1] + e.f[1] * 0.03);
      for (let l = 0; l < levels; l++) {
        if (l === 0 && blocked) continue;
        const h = rnd(id * 7 + l);
        const dw = l === 0 ? 0.9 : 0.72, dh = l === 0 ? 1.55 : 1.1, y = Y0 + l * LH + (l === 0 ? 0 : 0.35);
        const off = (rnd(id * 3 + l) - 0.5) * Math.max(0, w - dw - 0.8);
        if (h < 0.88) k.C.add('roof', k.paint(box(dw, dh, 0.08, off, y + dh / 2, 0), h < 0.2 ? DARK : WOOD), face);
        if (l > 0 && h < 0.55) for (const o of [-0.28, 0.28]) {
          const g = cylinder(0.055, 0.055, 0.55, 6, 0).rotateX(Math.PI / 2).translate(off + o, y - 0.3, -0.45);
          k.C.add('roof', k.paint(g, WOOD), face, false);
        }
        if (h > 0.6 && h < 0.75) k.C.add('roof', k.paint(box(0.28, 0.28, 0.06, off + (dw / 2 + 0.5) * (h < 0.67 ? 1 : -1), y + dh * 0.7, 0), DARK), face, false);
      }
      if (levels >= 3 && !blocked && rnd(id * 5.1) < 0.36) stairsPlan.push({ e, s, level: rnd(id * 1.9) < 0.5 && levels >= 3 ? 2 : 1 });
    }
  }

  // ---- stair ramps against the walls, up to an upper door ----
  let best = -1;
  const used: { e: Edge; s0: number; s1: number }[] = [];
  for (const st of stairsPlan) {
    const e = st.e, H = st.level * LH, n = Math.ceil(H / 0.27), rise = H / n, run = 0.3;
    const len = n * run + 0.6;
    const dir = st.s > e.L / 2 ? -1 : 1;   // run down towards the longer side
    const s0 = Math.min(st.s, st.s + dir * len), s1 = Math.max(st.s, st.s + dir * len);
    if (s0 < 0.3 || s1 > e.L - 0.3 || used.some((u2) => u2.e === e && s0 < u2.s1 + 1 && s1 > u2.s0 - 1)) continue;
    if ((notches.get(e) ?? []).some((nn) => nn.s > s0 - 2 && nn.s < s1 + 2)) continue;
    used.push({ e, s0, s1 });
    const yaw = Math.atan2(-e.f[0], -e.f[1]);
    const at = (s: number, h: number, sz: number) => {
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(e.a[0] + e.u[0] * s + e.f[0] * 0.55, 0, e.a[1] + e.u[1] * s + e.f[1] * 0.55);
      k.C.add(SAND, box(sz, h, 1.05, 0, Y0 + h / 2, 0), m);
    };
    // the landing in front of the door, then the steps down along the wall
    at(st.s, H, 1.1);
    for (let i = 1; i <= n; i++) {
      const h = H - i * rise;
      if (h < 0.05) break;
      at(st.s + dir * (0.4 + i * run), h, run + 0.02);
    }
    const score = st.level + (e.court === 1 ? 0.5 : 0);   // the highest flight, preferably in the first courtyard
    if (score > best) {
      best = score;
      SPOTS.stair = { at: [e.a[0] + e.u[0] * st.s + e.f[0] * 0.55, e.a[1] + e.u[1] * st.s + e.f[1] * 0.55], front: e.f, y: Y0 + H };
    }
  }

  // ---- courtyards: stone paving, palms and jars ----
  for (const c of [COURT1, COURT2]) { const g = k.flat(c, Y0 + 0.06); if (g) k.C.add('paving', g); }
  for (const [c, nPalm] of [[COURT1, 2], [COURT2, 2]] as [P2[], number][]) {
    const cc = centroidOf(c);
    for (let i = 0; i < nPalm; i++) {
      const x = cc[0] + (rnd(i + c.length) - 0.5) * 9, z = cc[1] + (rnd(i * 3 + c.length) - 0.5) * 4;
      if (inPoly(x, z, c)) k.props.palms.push(new THREE.Vector3(x, Y0 + 0.06, z));
      for (let j = 0; j < 4; j++) {
        const jx = x + 1.2 + (rnd(i * 9 + j) - 0.5) * 1.6, jz = z + (rnd(i * 11 + j) - 0.5) * 1.6;
        if (!inPoly(jx, jz, c)) continue;
        const jar = new THREE.LatheGeometry([0.1, 0.3, 0.4, 0.38, 0.26, 0.13, 0.15].map((r, q) => new THREE.Vector2(r, q * 0.16)), 12).translate(jx, Y0 + 0.06, jz);
        k.C.add('roof', k.paint(jar, JAR), undefined, false);
      }
    }
  }

  for (const [key, acc] of Object.entries(A)) if (acc.pos.length) k.C.add(key as 'sand', acc.geo());
  k.markPoly(FOOT, k.flags.BLD, 3);
}

export async function buildKsar(materials: Materials, site: SiteDef): Promise<BuildResult> {
  return buildTerrainTown(materials, site, {
    data: TOWN as unknown as TownData,
    core: 0,
    fill: false,
    inland: true,
    domes: 0.3,
    flowers: 0.1,
    treeR: 200,
    scrub: 0.45,
    smooth: 16,
    palette: { soil: '#e6cda3', scrub: '#bcab7a' },
    paved: (r) => r.k === 'tertiary' || r.k === 'secondary' || r.s === 'asphalt',
    houseColors: { walls: ['#dcc6a0', '#d2b98f', '#e6d7bb', '#cdb089'], roofs: ['#d6c3a2', '#cbb592', '#e0d2b8'] },
    flatten: [{ p: FOOT, pad: 16, level: 'mean' }],
    // outside the open end of the second courtyard, by the café and the car park
    spawn: { x: GATE[0] + 22, z: GATE[1] + 2 },
    look: { x: GATE[0] - 20, z: GATE[1] + 4, h: 5 },
    lights: [[GATE[0] - 18, GATE[1] + 6, 4, 60, 30], [centroidOf(COURT1)[0], centroidOf(COURT1)[1], 5, 60, 30]],
    special: (b: Building) => b === KSAR,
    extras: (k) => ksar(k),
  });
}
