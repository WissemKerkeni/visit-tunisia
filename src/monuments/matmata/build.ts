/**
 * Matmata: the troglodyte pit houses of Matmata el Qadima, dug into the soft hills of the Dahar.
 * Positions from OpenStreetMap (the 18 mapped courtyard pits, roads, the mosque and village houses), terrain from AWS
 * Terrain Tiles; built on the shared terrain-town builder, with the pits cut out of the terrain:
 * - each house is a round courtyard about 7 to 8 m deep, its walls lime-washed below and the bare ochre soil above;
 *   vaulted rooms are dug into the walls at the floor, granaries above them (some reached by white steps), and a
 *   sloping tunnel leads from the hillside into the courtyard through a sunken lane;
 * - Hotel Sidi Driss: three pits joined by underground passages, with rooms you can walk into;
 * - more pits are generated on open ground between the mapped ones, many abandoned since the floods of 1969;
 * - olive trees and palms in the hollows, scrub on the bare hills.
 * Shapes are simplified. Scene frame: origin 33.5425 N, 9.9705 E, x = east, z = south.
 */
import * as THREE from 'three';
import TOWN from '../../content/matmata-town.json';
import type { Materials, MatKey } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { box, cylinder, hash } from '../el-jem/geometry';
import { Acc, UP, doorPath, loft, planar } from '../common/vaults';

const BUILDINGS = TOWN.buildings as Building[];
const ROADS = TOWN.roads as { k: string; w: number; p: P2[] }[];
const POIS = TOWN.pois as unknown as { k: string; p: P2; name?: string }[];
const OSM_PITS = (TOWN as unknown as { pits: P2[][] }).pits;
const HALF = TOWN.terrain.half;

const centroidOf = (p: P2[]): P2 => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const poi = (re: RegExp, fb: P2): P2 => POIS.find((p) => re.test(p.name ?? ''))?.p ?? fb;
const inPoly = (x: number, z: number, p: P2[]) => {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};
const segDist = (x: number, z: number, a: P2, b: P2) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
  return Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z);
};

export const SIDI_DRISS_POI = poi(/Sidi Idriss/i, [-299, -23]);
export const KHADIJA_POI = poi(/Khadija/i, [-181, 38]);
export const MOSQUE = centroidOf(BUILDINGS.find((b) => /Mosquée de Matmata/i.test(b.name ?? ''))?.p ?? [[-342, -214]]);

// ---------------------------------------------------------------------------
// plan (made once the terrain is loaded, on each visit)

/** An opening in a pit wall: a room door at the floor, a granary door higher up, a tunnel or a passage. */
interface Door { edge: number; s: number; w: number; S: number; sill: number; kind: 'room' | 'loft' | 'tunnel' | 'passage'; D?: number; W?: number; Sr?: number; leaf?: boolean }
interface Tunnel { edge: number; M: P2; n: P2; u: P2; W: number; S: number; slope: number; t1: number; t2: number; hole: P2[] }
export interface Pit {
  p: P2[]; c: P2; r: number; floor: number; rimLo: number;
  kind: 'hotel' | 'house' | 'museum' | 'ruin';
  doors: Door[]; tunnel?: Tunnel; stairs?: Door; coat: number;
}
interface Passage { a: Pit; b: Pit; da: Door; db: Door }

export const PLAN = { pits: [] as Pit[], passages: [] as Passage[], hotel: null as Pit | null, museum: null as Pit | null, ruin: null as Pit | null, high: [0, 0] as P2, highY: 0, seen: [0, 400, 0] as [number, number, number] };

const edgeOf = (p: P2[], k: number) => {
  const a = p[(k + p.length) % p.length], b = p[(k + 1 + p.length) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
  return { a, b, L, u, n: [u[1], -u[0]] as P2, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as P2 }; // n: outward (CCW outline)
};

/** A smooth outline (CCW in the scene's x-z sense) from the mapped ring, by its radius around the centre. */
function smoothOutline(raw: P2[]) {
  const c = centroidOf(raw);
  let per = 0; for (let i = 0; i < raw.length; i++) per += Math.hypot(raw[(i + 1) % raw.length][0] - raw[i][0], raw[(i + 1) % raw.length][1] - raw[i][1]);
  const N = Math.max(12, Math.min(26, Math.round(per / 2.8)));
  let rs: number[] = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
    let best = Infinity;
    for (let i = 0; i < raw.length; i++) {
      const p = raw[i], q = raw[(i + 1) % raw.length], ex = q[0] - p[0], ez = q[1] - p[1];
      const den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
      const t = ((p[0] - c[0]) * ez - (p[1] - c[1]) * ex) / den, s = ((p[0] - c[0]) * dz - (p[1] - c[1]) * dx) / den;
      if (t > 0 && s >= 0 && s <= 1) best = Math.min(best, t);
    }
    rs.push(isFinite(best) ? best : per / (2 * Math.PI));
  }
  for (let it = 0; it < 2; it++) rs = rs.map((r, k) => 0.25 * rs[(k + N - 1) % N] + 0.5 * r + 0.25 * rs[(k + 1) % N]);
  const p = rs.map((r, k) => [c[0] + Math.cos((k / N) * Math.PI * 2) * r, c[1] + Math.sin((k / N) * Math.PI * 2) * r] as P2);
  return { p, c, r: rs.reduce((s, r) => s + r, 0) / N };
}
const circle = (c: P2, r: number, N: number) => Array.from({ length: N }, (_, k) => [c[0] + Math.cos((k / N) * Math.PI * 2) * r * (1 + (hash(c[0] * 0.3 + k) - 0.5) * 0.08), c[1] + Math.sin((k / N) * Math.PI * 2) * r * (1 + (hash(c[1] * 0.7 + k * 1.3) - 0.5) * 0.08)] as P2);

function plan(g: (x: number, z: number) => number) {
  PLAN.pits = []; PLAN.passages = []; PLAN.hotel = PLAN.museum = PLAN.ruin = null;
  const lim = HALF - 14;
  const inside = (c: P2, r: number) => Math.abs(c[0]) + r < lim && Math.abs(c[1]) + r < lim;
  const pits: Pit[] = [];
  const mk = (p: P2[], c: P2, r: number, kind: Pit['kind'], seed: number): Pit => {
    const rimLo = Math.min(...p.map(([x, z]) => g(x, z)));
    const depth = kind === 'hotel' ? 8 : kind === 'ruin' ? 5.8 + hash(seed) * 1.6 : 6.8 + hash(seed) * 1.2;
    const coat = kind === 'hotel' ? depth - 1.1 : kind === 'ruin' ? 0 : kind === 'museum' ? 3 : 2.5 + hash(seed * 1.7) * 0.6;
    return { p, c, r, floor: rimLo - depth, rimLo, kind, doors: [], coat };
  };
  // mapped pits: the three nearest the hotel's point are Hotel Sidi Driss, the one nearest Dar Khadija its museum
  const mapped = OSM_PITS.map(smoothOutline).filter((o) => inside(o.c, o.r));
  const dTo = (o: { c: P2 }, q: P2) => Math.hypot(o.c[0] - q[0], o.c[1] - q[1]);
  const hotelSet = new Set([...mapped].sort((a, b) => dTo(a, SIDI_DRISS_POI) - dTo(b, SIDI_DRISS_POI)).slice(0, 3).filter((o) => dTo(o, SIDI_DRISS_POI) < 70));
  const museum = [...mapped].filter((o) => !hotelSet.has(o)).sort((a, b) => dTo(a, KHADIJA_POI) - dTo(b, KHADIJA_POI))[0];
  mapped.forEach((o, i) => pits.push(mk(o.p, o.c, o.r, hotelSet.has(o) ? 'hotel' : o === museum ? 'museum' : 'house', i + 1)));
  PLAN.hotel = pits.filter((p) => p.kind === 'hotel').sort((a, b) => dTo(a, SIDI_DRISS_POI) - dTo(b, SIDI_DRISS_POI))[0] ?? null;
  PLAN.museum = pits.find((p) => p.kind === 'museum') ?? null;

  // more pits on open ground near the mapped ones: the hills hold many more than are mapped
  const roadClear = (x: number, z: number, d: number) => ROADS.every((r) => r.p.every((q, i) => i === 0 || segDist(x, z, r.p[i - 1], q) > d + r.w / 2));
  const bldClear = (x: number, z: number, d: number) => BUILDINGS.every((b) => { const c = centroidOf(b.p); return Math.hypot(c[0] - x, c[1] - z) > d + 6 && !inPoly(x, z, b.p); });
  for (let z = -lim + 20; z < lim - 20; z += 23) for (let x = -lim + 20; x < lim - 20; x += 23) {
    const c: P2 = [x + (hash(x * 0.13 + z * 0.7) - 0.5) * 14, z + (hash(z * 0.29 - x * 0.41) - 0.5) * 14];
    const r = 5.6 + hash(c[0] * 1.3 + c[1]) * 2.8;
    const near = Math.min(...mapped.map((o) => dTo(o, c)));
    if (near > 170 || hash(c[0] * 0.77 - c[1] * 0.31) > 0.3) continue;
    if (!inside(c, r + 4)) continue;
    if (pits.some((p) => Math.hypot(p.c[0] - c[0], p.c[1] - c[1]) < p.r + r + 22)) continue;
    const slope = Math.max(Math.abs(g(c[0] + 12, c[1]) - g(c[0] - 12, c[1])), Math.abs(g(c[0], c[1] + 12) - g(c[0], c[1] - 12))) / 24;
    if (slope > 0.2 || !roadClear(c[0], c[1], r + 5) || !bldClear(c[0], c[1], r + 4)) continue;
    const N = Math.max(12, Math.min(22, Math.round((2 * Math.PI * r) / 2.8)));
    pits.push(mk(circle(c, r, N), c, r, hash(c[0] + c[1] * 0.37) < 0.7 ? 'ruin' : 'house', pits.length + 1));
  }

  // entrance tunnels: out of the side of the courtyard towards lower ground, rising to meet the hillside in a sunken lane
  const strips: P2[][] = [];
  const clearOf = (x: number, z: number, self: Pit) =>
    !pits.some((q) => q !== self && Math.hypot(q.c[0] - x, q.c[1] - z) < q.r + 8) && !strips.some((s) => inPoly(x, z, s)) && bldClear(x, z, 0);
  const keep: Pit[] = [];
  for (const pit of pits) {
    let best: { tun: Tunnel; score: number } | null = null;
    for (let k = 0; k < pit.p.length; k++) {
      const e = edgeOf(pit.p, k);
      if (e.L < 2.5) continue;
      const W = 2.0, S = 1.9;
      for (const slope of [0.3, 0.38, 0.48]) {
        let t1 = -1, t2 = -1, bad = false;
        for (let t = 0.5; t < 60; t += 0.5) {
          const x = e.m[0] + e.n[0] * t, z = e.m[1] + e.n[1] * t, f = pit.floor + slope * t;
          const gl = g(x + e.u[0] * 1.2, z + e.u[1] * 1.2), gr = g(x - e.u[0] * 1.2, z - e.u[1] * 1.2), gc = g(x, z), gm = Math.min(gl, gr, gc);
          if (t > 1.5 && !clearOf(x, z, pit)) { bad = true; break; }
          if (t1 < 0) { if (f + S + W / 2 + 1.6 > gm && t >= 2.5) t1 = t - 0.5; }
          else if (f >= gm - 0.05) { t2 = t; break; }
        }
        if (bad || t1 < 2 || t2 < 0) continue;
        const score = t2 + slope * 20;
        if (!best || score < best.score) best = { tun: { edge: k, M: e.m, n: e.n, u: e.u, W, S, slope, t1, t2, hole: [] }, score };
        break;
      }
    }
    if (!best) { if (pit.kind === 'ruin' || pit.kind === 'house') continue; } // generated pit with no way in: leave it out
    if (best) {
      const t = best.tun, st: number[] = [];
      for (let s = t.t1; s < t.t2 - 0.5; s += 2) st.push(s);
      st.push(t.t2);
      const L = st.map((s) => [t.M[0] + t.n[0] * s + t.u[0] * (t.W / 2), t.M[1] + t.n[1] * s + t.u[1] * (t.W / 2)] as P2);
      const R = st.map((s) => [t.M[0] + t.n[0] * s - t.u[0] * (t.W / 2), t.M[1] + t.n[1] * s - t.u[1] * (t.W / 2)] as P2);
      t.hole = [...L, ...R.reverse()];
      strips.push(t.hole);
      pit.tunnel = t;
      pit.doors.push({ edge: t.edge, s: edgeOf(pit.p, t.edge).L / 2, w: t.W, S: t.S, sill: 0, kind: 'tunnel' });
    }
    keep.push(pit);
  }
  pits.length = 0; pits.push(...keep);

  // the hotel's pits are joined underground
  const hotel = pits.filter((p) => p.kind === 'hotel');
  for (let i = 0; i < hotel.length; i++) for (let j = i + 1; j < hotel.length; j++) {
    const A = hotel[i], B = hotel[j], d = Math.hypot(B.c[0] - A.c[0], B.c[1] - A.c[1]);
    if (d - A.r - B.r > 40) continue;
    const facing = (P: Pit, Q: Pit) => {
      let bk = 0, bd = -2;
      const dx = (Q.c[0] - P.c[0]) / d, dz = (Q.c[1] - P.c[1]) / d;
      P.p.forEach((_, k) => { const e = edgeOf(P.p, k); const dd = e.n[0] * dx + e.n[1] * dz; if (dd > bd && !P.doors.some((o) => Math.abs(o.edge - k) <= 1 || Math.abs(o.edge - k) >= P.p.length - 1)) { bd = dd; bk = k; } });
      return bk;
    };
    const ka = facing(A, B), kb = facing(B, A);
    const da: Door = { edge: ka, s: edgeOf(A.p, ka).L / 2, w: 1.5, S: 1.9, sill: 0, kind: 'passage' };
    const db: Door = { edge: kb, s: edgeOf(B.p, kb).L / 2, w: 1.5, S: 1.9, sill: 0, kind: 'passage' };
    // only if the corridor stays well under the ground
    let ok = true;
    const ea = edgeOf(A.p, ka), eb = edgeOf(B.p, kb);
    for (let f = 0; f <= 1; f += 0.05) {
      const x = ea.m[0] + (eb.m[0] - ea.m[0]) * f, z = ea.m[1] + (eb.m[1] - ea.m[1]) * f, y = A.floor + (B.floor - A.floor) * f;
      if (y + 3.4 > g(x, z) - 1 || strips.some((s) => inPoly(x, z, s))) { ok = false; break; }
    }
    if (!ok) continue;
    A.doors.push(da); B.doors.push(db);
    PLAN.passages.push({ a: A, b: B, da, db });
  }

  // rooms at the floor on every other edge, granaries above the others; white steps up to one granary
  for (const pit of pits) {
    const N = pit.p.length, t0 = pit.tunnel?.edge ?? 0, depth = pit.rimLo - pit.floor;
    const used = (k: number, r = 0) => pit.doors.some((o) => { const d = Math.abs(o.edge - k) % N; return Math.min(d, N - d) <= r; });
    const sd = pit.c[0] * 0.17 + pit.c[1] * 0.31;
    if (pit.kind !== 'ruin' && depth > 5.4) {
      for (let k = 1; k < N; k += 2) {
        const kk = (t0 + k) % N, e = edgeOf(pit.p, kk);
        if (e.L < 1.8 || used(kk) || used((kk - 1 + N) % N) || used((kk - 2 + N) % N)) continue;
        const sill = Math.min(depth - 2.6, 3.7 + hash(sd + k) * 0.5);
        if (sill < 3.3) break;
        pit.stairs = { edge: kk, s: e.L / 2, w: 0.95, S: 1.05, sill, kind: 'loft', D: 2.4, W: 1.9, Sr: 1.2 };
        pit.doors.push(pit.stairs);
        break;
      }
    }
    const stairsBlock = (k: number) => !!pit.stairs && [(pit.stairs.edge - 1 + N) % N, (pit.stairs.edge - 2 + N) % N].includes(k);
    for (let k = 0; k < N; k++) {
      const kk = (t0 + k) % N, e = edgeOf(pit.p, kk), h = hash(sd * 1.9 + k * 7.3);
      if (k % 2 === 0) {
        if (k === 0 || used(kk, 1) || stairsBlock(kk) || e.L < 1.7 || h > (pit.kind === 'ruin' ? 0.6 : 0.85)) continue;
        const W = Math.min(3.4, 2.6 + hash(sd + k) * 0.8);
        pit.doors.push({ edge: kk, s: e.L / 2, w: 1.1, S: 1.5, sill: 0, kind: 'room', W, D: 3.2 + hash(sd * 3 + k) * 2.3, Sr: 1.5, leaf: pit.kind === 'house' && hash(sd + k * 2.1) < 0.5 });
      } else if (!used(kk) && e.L > 1.6 && h < (pit.kind === 'ruin' ? 0.4 : 0.55)) {
        const sill = Math.min(depth - 2.3, 3.6 + hash(sd * 2.3 + k) * 0.6);
        if (sill > 3.2) pit.doors.push({ edge: kk, s: e.L / 2, w: 0.85, S: 0.85, sill, kind: 'loft', D: 1.8 + hash(sd + k * 5) * 0.8, W: 1.7, Sr: 1.0 });
      }
    }
  }
  PLAN.pits = pits;
  // an abandoned pit near the hotel
  PLAN.ruin = pits.filter((p) => p.kind === 'ruin').sort((a, b) => dTo(a, SIDI_DRISS_POI) - dTo(b, SIDI_DRISS_POI))[0] ?? null;
  // a rise looking down on as many pits as possible, for the view over the village
  let best = -Infinity;
  for (let z = -lim + 20; z <= lim - 20; z += 10) for (let x = -lim + 20; x <= lim - 20; x += 10) {
    if (pits.some((p) => Math.hypot(p.c[0] - x, p.c[1] - z) < p.r + 8) || !roadClear(x, z, 2) || !bldClear(x, z, 2)) continue;
    const y = g(x, z);
    let sc = 0;
    for (const p of pits) { const d = Math.hypot(p.c[0] - x, p.c[1] - z); if (d > 30 && d < 200 && y - p.rimLo > 0) sc += Math.min(1, (y - p.rimLo) / (d * 0.16)) * (1 - d / 220); }
    if (sc > best) { best = sc; PLAN.high = [x, z]; PLAN.highY = y; }
  }
  // look towards the side with the most pits in view
  let bestDir = 0, bestN = -1;
  const ang = (p: Pit) => Math.atan2(p.c[1] - PLAN.high[1], p.c[0] - PLAN.high[0]);
  const inView = pits.filter((p) => { const d = Math.hypot(p.c[0] - PLAN.high[0], p.c[1] - PLAN.high[1]); return d > 40 && d < 200; });
  for (let k = 0; k < 24; k++) {
    const a0 = (k / 24) * Math.PI * 2;
    const cnt = inView.filter((p) => Math.abs(Math.atan2(Math.sin(ang(p) - a0), Math.cos(ang(p) - a0))) < 0.5).length;
    if (cnt > bestN) { bestN = cnt; bestDir = a0; }
  }
  const seen = inView.filter((p) => Math.abs(Math.atan2(Math.sin(ang(p) - bestDir), Math.cos(ang(p) - bestDir))) < 0.5);
  PLAN.seen = seen.length ? [seen.reduce((s, p) => s + p.c[0], 0) / seen.length, seen.reduce((s, p) => s + p.rimLo, 0) / seen.length - 2, seen.reduce((s, p) => s + p.c[1], 0) / seen.length] : [0, 400, 0]; // x, y, z
  return [...pits.map((p) => p.p), ...strips];
}

// ---------------------------------------------------------------------------
// geometry

const WHITE = new THREE.Color('#f4f1ea'), CREAM = new THREE.Color('#e4d9c4'), BED = new THREE.Color('#8f3b2a'), BLUE_DOOR = new THREE.Color('#2f6fae'), JAR = new THREE.Color('#b9875a');

function buildPits(k: TownKit) {
  const A = { rock: new Acc(), roof: new Acc(), ground: new Acc() };
  const white = A.roof;
  const ruinTint = new THREE.Color('#d9c3a0');
  const lights: [number, number, number, number, number][] = [];
  const gAt = (v: THREE.Vector3) => k.groundAt(v.x, v.z);
  for (const pit of PLAN.pits) {
    const N = pit.p.length, F = pit.floor, inhabited = pit.kind !== 'ruin';
    const inn = (k2: number) => { const e = edgeOf(pit.p, k2); return new THREE.Vector3(-e.n[0], 0, -e.n[1]); };
    // ---- the walls, with the coat of lime-wash below ----
    for (let e = 0; e < N; e++) {
      const E = edgeOf(pit.p, e), n = inn(e);
      const ga = k.groundAt(E.a[0], E.a[1]), gb = k.groundAt(E.b[0], E.b[1]);
      const low = pit.doors.filter((d) => d.edge === e && d.sill === 0).sort((a, b) => a.s - b.s);
      const high = pit.doors.filter((d) => d.edge === e && d.sill > 0);
      const piece = (top0: number, top1: number) => {
        const out: P2[] = [[0, F]];
        for (const d of low) out.push(...doorPath(d.s, F, d.w, d.S));
        out.push([E.L, F], [E.L, top1], [0, top0]);
        return out;
      };
      const holes = (top: number) => high.filter((d) => F + d.sill + d.S + d.w / 2 < top - 0.15).map((d) => doorPath(d.s, F + d.sill, d.w, d.S));
      planar(A.rock, piece(ga, gb), holes(Math.min(ga, gb)), new THREE.Vector3(E.a[0], 0, E.a[1]), E.u, n);
      if (pit.coat > 0) {
        const ca = F + pit.coat + (hash(E.a[0] * 1.7 + E.a[1]) - 0.5) * 0.5, cb = F + pit.coat + (hash(E.b[0] * 1.7 + E.b[1]) - 0.5) * 0.5;
        const O = new THREE.Vector3(E.a[0] + n.x * 0.025, 0, E.a[1] + n.z * 0.025);
        planar(white, piece(ca, cb), holes(Math.min(ca, cb)), O, E.u, n, WHITE);
      }
      // a low ridge of earth round the rim of the lived-in courtyards
      if (inhabited) {
        const oa = [E.a[0] - pit.c[0], E.a[1] - pit.c[1]], ob = [E.b[0] - pit.c[0], E.b[1] - pit.c[1]];
        const la = Math.hypot(oa[0], oa[1]), lb = Math.hypot(ob[0], ob[1]);
        const pa = (d: number, y: number) => new THREE.Vector3(E.a[0] + (oa[0] / la) * d, y, E.a[1] + (oa[1] / la) * d);
        const pb = (d: number, y: number) => new THREE.Vector3(E.b[0] + (ob[0] / lb) * d, y, E.b[1] + (ob[1] / lb) * d);
        const out = new THREE.Vector3(-n.x, 0.3, -n.z);
        const rows: [THREE.Vector3, THREE.Vector3][] = [[pa(0, ga), pb(0, gb)], [pa(0, ga + 0.62), pb(0, gb + 0.62)], [pa(0.4, ga + 0.66), pb(0.4, gb + 0.66)], [pa(1.1, gAt(pa(1.1, 0)) - 0.15), pb(1.1, gAt(pb(1.1, 0)) - 0.15)]];
        for (let r = 0; r < rows.length - 1; r++) {
          const [p0, p1] = rows[r], [q0, q1] = rows[r + 1];
          const nn = r === 0 ? n : out;
          A.rock.tri(p0, p1, q1, [0, r], [E.L, r], [E.L, r + 1], nn);
          A.rock.tri(p0, q1, q0, [0, r], [E.L, r + 1], [0, r + 1], nn);
        }
      }
    }
    // ---- floor ----
    const fl = k.flat(pit.p, F);
    if (fl) k.C.add(pit.kind === 'hotel' ? 'paving' : 'ground', fl);

    // ---- rooms and granaries behind the doors ----
    for (const d of pit.doors) {
      if (d.kind !== 'room' && d.kind !== 'loft') continue;
      const E = edgeOf(pit.p, d.edge), y0 = F + d.sill;
      const M: P2 = [E.a[0] + E.u[0] * d.s, E.a[1] + E.u[1] * d.s];
      const P = (t: number) => new THREE.Vector3(M[0] + E.n[0] * t, y0, M[1] + E.n[1] * t);
      const lit = d.kind === 'room' && inhabited;
      const walls = lit ? white : A.rock, col = lit ? CREAM : pit.kind === 'ruin' ? ruinTint : undefined;
      const T = 0.6, W = d.W!, D = d.D!, Sr = d.Sr!;
      const door = doorPath(0, 0, d.w, d.S);
      loft(walls, lit ? A.ground : A.rock, [{ P: P(0), u: E.u }, { P: P(T), u: E.u }], door, col, d.S * 0.6);
      const room = doorPath(0, 0, W, Sr);
      loft(walls, lit ? A.ground : A.rock, [{ P: P(T), u: E.u }, { P: P(T + D), u: E.u }], room, col, Sr * 0.7);
      const front: P2[] = [[-W / 2, 0], ...doorPath(0, 0, d.w, d.S), [W / 2, 0], ...doorPath(0, 0, W, Sr).slice(1, -1).reverse()];
      planar(walls, front, [], P(T), E.u, new THREE.Vector3(E.n[0], 0, E.n[1]), col);
      planar(walls, room, [], P(T + D), E.u, new THREE.Vector3(-E.n[0], 0, -E.n[1]), col);
      if (d.leaf) {
        // a blue wooden door, shut
        const m = new THREE.Matrix4().makeRotationY(-Math.atan2(E.u[1], E.u[0])).setPosition(M[0] + E.n[0] * 0.3, y0, M[1] + E.n[1] * 0.3);
        k.C.add('roof', k.paint(box(d.w - 0.04, d.S + 0.32, 0.07, 0, (d.S + 0.32) / 2, 0), BLUE_DOOR), m);
      }
      if (pit.kind === 'hotel' && d.kind === 'room') {
        // a bed on a platform along one side, as in the hotel's rooms
        const side = hash(M[0]) < 0.5 ? 1 : -1, bw = Math.min(1.5, W * 0.48), cx = side * (W / 2 - bw / 2 - 0.05);
        const m = new THREE.Matrix4().makeRotationY(-Math.atan2(E.u[1], E.u[0])).setPosition(M[0] + E.n[0] * (T + D / 2 + 0.3), y0, M[1] + E.n[1] * (T + D / 2 + 0.3));
        k.C.add('roof', k.paint(box(bw, 0.45, D - 1.0, cx, 0.225, 0), WHITE), m);
        k.C.add('roof', k.paint(box(bw - 0.1, 0.16, D - 1.3, cx, 0.53, 0.1), BED), m, false);
        lights.push([M[0] + E.n[0] * (T + D * 0.6), M[1] + E.n[1] * (T + D * 0.6), y0 - k.groundAt(M[0] + E.n[0] * (T + D * 0.6), M[1] + E.n[1] * (T + D * 0.6)) + 2.2, 6, 6]);
      }
    }

    // ---- white steps up the wall to a granary ----
    if (pit.stairs) {
      const d = pit.stairs, sill = d.sill;
      const n = Math.ceil(sill / 0.24), rise = sill / n;
      // walk back along the wall from the door
      const along = (dist: number) => {
        let e = d.edge, s = d.s - dist;
        while (s < 0) { e = (e - 1 + N) % N; s += edgeOf(pit.p, e).L; }
        const E = edgeOf(pit.p, e);
        return { x: E.a[0] + E.u[0] * s, z: E.a[1] + E.u[1] * s, u: E.u, n: E.n };
      };
      for (let i = 0; i <= n; i++) {
        const dist = i === 0 ? 0 : 0.45 + i * 0.3, top = i === 0 ? sill : sill - i * rise;
        if (top <= 0.05) break;
        const q = along(dist), len = i === 0 ? 1.2 : 0.32;
        const m = new THREE.Matrix4().makeRotationY(-Math.atan2(q.u[1], q.u[0])).setPosition(q.x - q.n[0] * 0.62, F, q.z - q.n[1] * 0.62);
        k.C.add('roof', k.paint(box(len, top, 1.1, 0, top / 2, 0), WHITE), m);
      }
    }

    // ---- the entrance tunnel and its sunken lane ----
    if (pit.tunnel) {
      const t = pit.tunnel, col = inhabited ? WHITE : pit.kind === 'ruin' ? ruinTint : undefined;
      const walls = inhabited ? white : A.rock;
      const at = (s: number, lat = 0, y?: number) => new THREE.Vector3(t.M[0] + t.n[0] * s + t.u[0] * lat, y ?? F + t.slope * s, t.M[1] + t.n[1] * s + t.u[1] * lat);
      const st: { P: THREE.Vector3; u: P2 }[] = [];
      for (let s = 0; s < t.t1; s += 2.5) st.push({ P: at(s), u: t.u });
      st.push({ P: at(t.t1), u: t.u });
      const prof = doorPath(0, 0, t.W, t.S);
      loft(walls, A.ground, st, prof, col, t.S * 0.7);
      // the lane: walls of bare earth up to the ground, the floor rising to meet it
      const ss: number[] = [];
      for (let s = t.t1; s < t.t2 - 0.5; s += 2) ss.push(s);
      ss.push(t.t2);
      const ys = ss.map((s, i) => i === ss.length - 1 ? null : F + t.slope * s);
      const gL = ss.map((s) => gAt(at(s, t.W / 2, 0)));
      const gR = ss.map((s) => gAt(at(s, -t.W / 2, 0)));
      for (let i = 0; i < ss.length - 1; i++) {
        const fy0 = ys[i]!, fy1 = ys[i + 1];
        const L0 = at(ss[i], t.W / 2, Math.min(fy0, gL[i])), L1 = at(ss[i + 1], t.W / 2, fy1 ?? gL[i + 1]);
        const R0 = at(ss[i], -t.W / 2, Math.min(fy0, gR[i])), R1 = at(ss[i + 1], -t.W / 2, fy1 ?? gR[i + 1]);
        const upN = UP.clone();
        A.ground.tri(L0, R0, R1, [0, ss[i]], [t.W, ss[i]], [t.W, ss[i + 1]], upN);
        A.ground.tri(L0, R1, L1, [0, ss[i]], [t.W, ss[i + 1]], [0, ss[i + 1]], upN);
        for (const [B0, B1, top0, top1, sgn] of [[L0, L1, gL[i], gL[i + 1], -1], [R0, R1, gR[i], gR[i + 1], 1]] as [THREE.Vector3, THREE.Vector3, number, number, number][]) {
          const T0 = B0.clone().setY(top0), T1 = B1.clone().setY(top1), nn = new THREE.Vector3(t.u[0] * sgn, 0, t.u[1] * sgn);
          A.rock.tri(B0, B1, T1, [ss[i], B0.y], [ss[i + 1], B1.y], [ss[i + 1], top1], nn);
          A.rock.tri(B0, T1, T0, [ss[i], B0.y], [ss[i + 1], top1], [ss[i], top0], nn);
        }
      }
      // the lime-washed portal over the tunnel mouth
      const f1 = F + t.slope * t.t1;
      // (local x along u: +W/2 is the lane's 'left' wall, whose top is gL)
      const portal: P2[] = [...doorPath(0, f1, t.W, t.S).slice(1, -1), [t.W / 2, gL[0]], [-t.W / 2, gR[0]]];
      const O = at(t.t1, 0, 0);
      planar(inhabited ? white : A.rock, portal, [], new THREE.Vector3(O.x + t.n[0] * 0.02, 0, O.z + t.n[1] * 0.02), t.u, new THREE.Vector3(t.n[0], 0, t.n[1]), col);
      if (inhabited) {
        // a door frame painted blue
        const m = new THREE.Matrix4().makeRotationY(-Math.atan2(t.u[1], t.u[0])).setPosition(O.x + t.n[0] * 0.05, f1, O.z + t.n[1] * 0.05);
        k.C.add('roof', k.paint(box(t.W + 0.3, 0.12, 0.08, 0, t.S + t.W / 2 + 0.12, 0), BLUE_DOOR), m, false);
      }
    }

    // ---- things in the courtyard ----
    const rnd = (i: number) => hash(pit.c[0] * 0.91 + pit.c[1] * 0.37 + i * 3.1);
    if (inhabited) {
      // the cistern mouth in the middle, a few oil jars against the wall
      k.C.add('roof', k.paint(cylinder(0.55, 0.6, 0.55, 14, F).translate(pit.c[0] + (rnd(1) - 0.5) * 2, 0, pit.c[1] + (rnd(2) - 0.5) * 2), WHITE));
      for (let i = 0; i < 4; i++) {
        const e = edgeOf(pit.p, Math.floor(rnd(i + 5) * N));
        if (pit.doors.some((d) => d.edge === pit.p.indexOf(e.a))) continue;
        const x = e.m[0] - e.n[0] * 0.6, z = e.m[1] - e.n[1] * 0.6;
        const jar = new THREE.LatheGeometry([0.12, 0.3, 0.38, 0.36, 0.25, 0.14, 0.16].map((r, j) => new THREE.Vector2(r, j * 0.15)), 12).translate(x, F, z);
        k.C.add('roof', k.paint(jar, JAR), undefined, false);
      }
      const ox = (rnd(3) - 0.5) * pit.r * 0.6, oz = (rnd(4) - 0.5) * pit.r * 0.6;
      if (pit.kind === 'hotel' || rnd(9) < 0.35) k.props.palms.push(new THREE.Vector3(pit.c[0] + ox, F, pit.c[1] + oz));
      // a warm lamp on the far side from the palm
      const ol = Math.hypot(ox, oz) || 1, lx = pit.c[0] - (ox / ol) * pit.r * 0.55, lz = pit.c[1] - (oz / ol) * pit.r * 0.55;
      if (pit.kind === 'hotel') lights.push([lx, lz, F - k.groundAt(lx, lz) + 3.4, 70, 18]);
    } else {
      // fallen earth heaped against the wall of an abandoned courtyard
      for (let i = 0; i < 3; i++) {
        const e = edgeOf(pit.p, Math.floor(rnd(i + 11) * N));
        const g = new THREE.IcosahedronGeometry(1.6 + rnd(i) * 1.2, 1).scale(1.3, 0.45, 1).translate(e.m[0] - e.n[0] * 0.8, F, e.m[1] - e.n[1] * 0.8);
        k.C.add('ground', g);
      }
    }
    // keep generated houses, trees and scrub off the pits and their lanes
    k.markPoly(pit.p, k.flags.BLD, 2.5);
    if (pit.tunnel) k.markPoly(pit.tunnel.hole, k.flags.BLD, 1.5);
  }

  // ---- passages between the hotel's courtyards ----
  for (const ps of PLAN.passages) {
    const ea = edgeOf(ps.a.p, ps.da.edge), eb = edgeOf(ps.b.p, ps.db.edge);
    const Ma = new THREE.Vector3(ea.m[0], ps.a.floor, ea.m[1]), Mb = new THREE.Vector3(eb.m[0], ps.b.floor, eb.m[1]);
    const Ia = Ma.clone().add(new THREE.Vector3(ea.n[0], 0, ea.n[1]).multiplyScalar(1.2)), Ib = Mb.clone().add(new THREE.Vector3(eb.n[0], 0, eb.n[1]).multiplyScalar(1.2));
    const dir = Ib.clone().sub(Ia).setY(0).normalize();
    const lat = (u: P2): P2 => (u[0] * -dir.z + u[1] * dir.x > 0 ? u : [-u[0], -u[1]]); // the same left-hand side all along
    const ul = lat([-dir.z, dir.x]);
    loft(white, A.ground, [{ P: Ma, u: lat(ea.u) }, { P: Ia, u: ul }, { P: Ib, u: ul }, { P: Mb, u: lat(eb.u) }], doorPath(0, 0, ps.da.w, ps.da.S), WHITE, 1.3);
  }

  for (const [key, acc] of Object.entries(A)) if (acc.pos.length) k.C.add(key as MatKey, acc.geo());
  return lights;
}

// ---------------------------------------------------------------------------

let LIGHTS: [number, number, number, number, number][] = [];

export async function buildMatmata(materials: Materials, site: SiteDef): Promise<BuildResult> {
  LIGHTS = [];
  if (import.meta.env.DEV) (window as unknown as { __matmata: typeof PLAN }).__matmata = PLAN; // for dev captures
  return buildTerrainTown(materials, site, {
    data: TOWN as unknown as TownData,
    core: 0,
    fill: false,
    inland: true,
    domes: 0.5,
    flowers: 0.15,
    treeR: 260,
    scrub: 0.55,
    palette: { soil: '#efdcb6', scrub: '#c2b486' },
    terrainStep: 2,
    smooth: 26,       // (the elevation data is striped here: bumps of 1-2 m every 50 m)
    // the national road is asphalt; village streets and tracks are packed earth
    paved: (r) => r.k === 'primary' || r.k === 'secondary' || r.s === 'asphalt',
    // houses of local stone and cement, some lime-washed
    houseColors: { walls: ['#d9c7a5', '#cdb894', '#ece4d4', '#c9b391', '#dfd2b8'], roofs: ['#d8c9ad', '#cfbf9f', '#e6dccb'] },
    holes: plan,
    // in the hotel's sunken entrance lane, looking down it to the tunnel
    get spawn() {
      const t = PLAN.hotel?.tunnel;
      if (!t) return { x: SIDI_DRISS_POI[0], z: SIDI_DRISS_POI[1] + 20 };
      return { x: t.M[0] + t.n[0] * (t.t2 + 5), z: t.M[1] + t.n[1] * (t.t2 + 5) };
    },
    get look() {
      const h = PLAN.hotel;
      return h ? { x: h.c[0], z: h.c[1], h: -2 } : { x: SIDI_DRISS_POI[0], z: SIDI_DRISS_POI[1], h: 0 };
    },
    get lights() { return LIGHTS; },
    special: (b: Building) => PLAN.pits.some((p) => Math.hypot(...(centroidOf(b.p).map((v, i) => v - p.c[i]) as P2)) < p.r + 3),
    extras: (k) => {
      LIGHTS = buildPits(k);
      LIGHTS.push([MOSQUE[0], MOSQUE[1], 6, 40, 25]);
      // palms and olive trees in the hollows where the rain water gathers, behind small earth dams (jessour)
      for (let z = -HALF + 10; z < HALF - 10; z += 12) for (let x = -HALF + 10; x < HALF - 10; x += 12) {
        const px = x + (hash(x * 0.13 + z * 0.71) - 0.5) * 9, pz = z + (hash(z * 0.37 - x * 0.19) - 0.5) * 9;
        if (k.at(px, pz)) continue;
        const y = k.groundAt(px, pz);
        const around = (k.groundAt(px + 28, pz) + k.groundAt(px - 28, pz) + k.groundAt(px, pz + 28) + k.groundAt(px, pz - 28)) / 4;
        const hollow = around - y;
        if (hollow < 0.8) continue;
        const h = hash(px * 1.7 + pz * 0.3);
        if (h < 0.22) k.props.palms.push(new THREE.Vector3(px, y, pz));
        else if (h < 0.75) (Math.hypot(px, pz) < 260 ? k.props.trees : k.props.groves).push({ x: px, z: pz, y, yaw: h * 40 });
      }
    },
  });
}
