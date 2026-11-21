/**
 * The Medina of Tunis: the Zitouna Mosque, the vaulted souks around it, the Kasbah, the Ottoman mosques with
 * their octagonal minarets, the Sidi Mahrez Mosque, the Tourbet el Bey and the gates.
 * Outlines, lanes and positions from OpenStreetMap (the medina is its UNESCO World Heritage outline), terrain
 * from AWS Terrain Tiles; built on the shared terrain-town builder (courtyard houses packed along the mapped
 * lanes and inside the blocks; the modern city around it is packed too, 3 to 5 storeys).
 * - The Zitouna Mosque in its mapped outline and courtyard: arcades on columns round the court, the prayer hall
 *   with its naves of columns and arches, the dome over the entrance of the hall and the one over the mihrab,
 *   the arcaded east front on the souks, and the square minaret of 1894 (43 m) with its lozenge-net panels.
 * - The covered souks round the mosque (El Attarine, the chechia makers, El Berka, El Trouk...): barrel vaults
 *   over the mapped lanes, shopfronts, skylights, the painted columns of the perfume souk.
 * - The Kasbah Mosque (1230s) and its Almohad-style minaret; the Youssef Dey (c. 1615), Hammouda Pacha (1655)
 *   and Dyers' mosques with their octagonal minarets; the Sidi Mahrez Mosque (from 1692) and its domes;
 *   the Tourbet el Bey and its green-tiled domes; Bab Bhar, Bab Jedid and Bab Mnara.
 * Shapes are simplified. Scene frame: origin 36.7985 N, 10.1712 E, x = east, z = south.
 */
import * as THREE from 'three';
import TOWN from '../../content/tunis-medina-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type Building, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { box, cylinder } from '../el-jem/geometry';
import { arcade, frame, merlons, nearestRoad, ribbedDome, type Road } from '../common/islamic';

// ---------------------------------------------------------------------------
// data-derived positions (shared with the site's hotspots)

const BLDS = TOWN.buildings as Building[];
const ROADS = TOWN.roads as (Road & { name?: string })[];
/** The medina and its two suburbs (Bab Souika, Bab Jazira): the UNESCO World Heritage outline. */
export const MEDINA = (TOWN as unknown as { heritage: P2[][] }).heritage[0];

const byId = (id: number) => BLDS.find((b) => b.id === id)!;
const cen = (p: P2[]): P2 => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const add2 = (a: P2, b: P2, s = 1): P2 => [a[0] + b[0] * s, a[1] + b[1] * s];
const sub2 = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const unit = (a: P2): P2 => { const L = Math.hypot(a[0], a[1]) || 1; return [a[0] / L, a[1] / L]; };
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function inside(p: P2[], x: number, z: number) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
/** Vertex of `p` nearest to `q`, pulled `inset` metres towards the centre. */
function cornerNear(p: P2[], q: P2, inset: number): P2 {
  let best = p[0];
  for (const v of p) if (Math.hypot(v[0] - q[0], v[1] - q[1]) < Math.hypot(best[0] - q[0], best[1] - q[1])) best = v;
  const c = cen(p);
  return add2(best, unit(sub2(c, best)), inset);
}
/** A point on the street nearest to `p`, `dist` metres along it (for views of a monument from its street). */
export function streetView(p: P2, dist: number): P2 {
  const r = nearestRoad(ROADS, p), d = unit(r.dir);
  return add2(r.q, d, dist);
}

// The Zitouna Mosque: mapped outline, courtyard (its inner ring, simplified to four corners), the prayer hall
// on the south-east side of the court (towards the qibla)
const ZIT = byId(1552764);
// (without the small annex mapped on the Souk el Attarine side: it juts across the lane)
const OUT = ZIT.p.filter(([x, z]) => !(x > -24 && x < -15 && z > 96 && z < 104));
const CS: P2 = [-17.2, 148.8], CE: P2 = [21.8, 120.8], CN: P2 = [6.1, 92.6], CW: P2 = [-35.0, 117.0];
const COURT: P2[] = [CS, CE, CN, CW];
const ZU = unit(sub2(CE, CS));                    // along the hall's court front
const ZV: P2 = [-ZU[1], ZU[0]].map((v) => -v) as P2;
/** Unit vector from the court into the prayer hall. */
const QIBLA: P2 = (() => { const m = lerp2(CS, CE, 0.5), c = cen(COURT); return Math.sign((m[0] - c[0]) * ZV[0] + (m[1] - c[1]) * ZV[1]) >= 0 ? ZV : [-ZV[0], -ZV[1]] as P2; })();
export const ZIT_COURT = cen(COURT);
/** The minaret: at the north corner of the court, where the Souk el Attarine meets the street from Bab Bhar. */
export const ZIT_MINARET: P2 = lerp2(CN, [17.7, 84.1], 0.45);
export const ZIT_MINARET_H = 43;
/** The east front, with its arcade and the door from the souks. */
const ZIT_DOOR: P2 = [36.7, 114];

export const KASBAH = byId(95130022);
export const KASBAH_MINARET = cornerNear(KASBAH.p, [-330, 140], 4.2);
export const YOUSSEF_DEY = byId(95130052);
export const YD_MINARET = cornerNear(YOUSSEF_DEY.p, [-117.3, 154.7], 3.2);
export const HAMMOUDA = byId(95197164);
export const HP_MINARET = cornerNear(HAMMOUDA.p, nearestRoad(ROADS, cen(HAMMOUDA.p)).q, 3.2);
const DYERS = byId(95197168);
const DYERS_MINARET = cornerNear(DYERS.p, nearestRoad(ROADS, cen(DYERS.p)).q, 3.2);
export const MAHREZ = byId(95130047);
export const TOURBET = byId(95197173);
/** Bab Bhar is mapped as an island in the Place Bab Bhar (not exported as a building): its outline from OSM. */
export const BAB_BHAR: P2[] = [[388.6, -68.3], [397.2, -67.3], [398, -73.6], [399.1, -82.5], [390.4, -83.5], [389.3, -74.3]];
export const BAB_BHAR_C = cen(BAB_BHAR);

/** A rooftop café terrace over the souks, looking at the Youssef Dey minaret (as from the cafés of the Souk el Trouk). */
export const TERRACE: P2 = [-104.7, 130.4];
export const TERRACE_H = 10.2;

/** Covered souks: the mapped lanes named Souk… round the Zitouna Mosque. */
const SOUKS = ROADS.filter((r) => /^(Rue )?Souk|^سوق/i.test(r.name ?? '') && r.w <= 5 && r.p.some((q) => Math.hypot(q[0] - ZIT_COURT[0], q[1] - ZIT_COURT[1]) < 260));
const ATTARINE = ROADS.filter((r) => /Attarine/i.test(r.name ?? ''));
/** A view inside the Souk el Attarine, and a point further along it. */
// (the mapped lane runs along the mosque's wall and overlaps its outline a little: stand clear of the wall)
function inLane(t: number): P2 {
  const A: P2 = [-49, 116.9], B: P2 = [64.8, 57.8], d = unit(sub2(B, A)), q = lerp2(A, B, t);
  let n: P2 = [-d[1], d[0]];
  if (inside(OUT, q[0] + n[0] * 3, q[1] + n[1] * 3)) n = [-n[0], -n[1]];
  let s = 0;
  while (s < 4 && inside(OUT, q[0] + n[0] * (s - 1.3), q[1] + n[1] * (s - 1.3))) s += 0.1;
  return add2(q, n, s);
}
export const ATT_VIEW: P2 = inLane(0.12);
export const ATT_LOOK: P2 = inLane(0.42);

// ---------------------------------------------------------------------------

const PLASTER = new THREE.Color('#ddcca9');
const STONE = new THREE.Color('#c9ad7c');
const OCHRE = new THREE.Color('#c99a5b');
const MARBLE = new THREE.Color('#ece6da');
const COURT_C = new THREE.Color('#cbc1ad');
const DARK = new THREE.Color('#2b241e');
const WOOD = new THREE.Color('#5a3a22');
const GREEN = new THREE.Color('#2f7552');
const WHITE = new THREE.Color('#f6f3ec');
const ARCH = new THREE.Color('#c9a774');    // honey sandstone of the Zitouna's court arcades
const DOME = new THREE.Color('#eee8dc');
const TILE = new THREE.Color('#24563f');    // the Tourbet's dark green glazed tiles

export function buildTunis(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  const spawn: P2 = [432, -77], att = ATT_VIEW;
  return buildTerrainTown(materials, site, {
    houseStyle: 'medina', // src/viewer/house-styles.ts
    data: TOWN as unknown as TownData,
    core: 0,
    corePoly: MEDINA,
    blockYaw: Math.atan2(ZU[1], ZU[0]),
    urban: true,
    packTight: true,
    palette: { soil: '#b8ad99', scrub: '#7d8160' },
    flowers: 0.3,
    domes: 0.6,
    terrainStep: 2,
    smooth: 24,
    treeR: 160,
    scrub: 0.15,
    inland: true,
    houseColors: {
      walls: ['#f3efe6', '#eee7d8', '#e9dfca', '#f5f2ea', '#e6d6b6', '#efe9dd'],
      roofs: ['#e9e4da', '#ddd6c8', '#d8cfbd', '#e2dccf'],
    },
    flatten: [{ p: OUT, pad: 10, level: 'mean' }, { p: MAHREZ.p, pad: 8, level: 'mean' }],
    spawn: { x: spawn[0], z: spawn[1] },
    look: { x: BAB_BHAR_C[0], z: BAB_BHAR_C[1], h: 7 },
    lights: [
      [ZIT_COURT[0], ZIT_COURT[1], 6, 120, 50],
      [att[0], att[1], 3.2, 25, 18],
      [ATT_LOOK[0], ATT_LOOK[1], 3.2, 25, 18],
      [BAB_BHAR_C[0] + 18, BAB_BHAR_C[1], 5, 60, 30],
      [KASBAH_MINARET[0] - 20, KASBAH_MINARET[1] - 25, 5, 60, 40],
    ],
    minaretFor: (b) => !/Cath|Église|Eglise|كنيسة|كاتدرائية/i.test(b.name ?? ''),
    special: (b: Building, k: TownKit) => {
      if (b.id === ZIT.id) { zitouna(k); return true; }
      if (b.id === KASBAH.id) { mosqueBody(k, b, 8); almohadMinaret(k, KASBAH_MINARET, 7.0, 25, [b.p[1][0] - b.p[0][0], b.p[1][1] - b.p[0][1]]); return true; }
      if (b.id === YOUSSEF_DEY.id) { mosqueBody(k, b, 7, true); octagonalMinaret(k, YD_MINARET, 2.4, 19); return true; }
      if (b.id === HAMMOUDA.id) { mosqueBody(k, b, 7, true); octagonalMinaret(k, HP_MINARET, 2.3, 18); return true; }
      if (b.id === DYERS.id) { mosqueBody(k, b, 7); octagonalMinaret(k, DYERS_MINARET, 2.2, 17); return true; }
      if (b.id === MAHREZ.id) { sidiMahrez(k, b); return true; }
      if (b.id === TOURBET.id) { tourbet(k, b); return true; }
      if (/^Bab /i.test(b.name ?? '') && b.p.length <= 6) { gateOf(k, b.p, /Jedid/i.test(b.name ?? '') ? 11 : 8); return true; }
      if (/Cath|Église|كاتدرائية/i.test(b.name ?? '')) { k.house(b.p, b.id, { lv: 4, h: 15 }); return true; }
      return false;
    },
    extras: (k) => {
      gateOf(k, BAB_BHAR, 11.5, true);
      terrace(k, TERRACE);
      for (const r of SOUKS) souk(k, r, ATTARINE.includes(r));
    },
  });
}

// ---------------------------------------------------------------------------
// helpers

/** Collision only (for pieces drawn with their own textured material). */
function collideOnly(k: TownKit, g: THREE.BufferGeometry, m?: THREE.Matrix4) {
  const geo = (g.index ? g.toNonIndexed() : g.clone());
  if (m) geo.applyMatrix4(m);
  const c = new THREE.BufferGeometry();
  c.setAttribute('position', geo.getAttribute('position'));
  k.C.collide.push(c);
}
/** The same geometry facing the other way (to see a shell from inside). */
function flipped(g: THREE.BufferGeometry) {
  const f = (g.index ? g.toNonIndexed() : g.clone());
  for (const name of ['position', 'normal', 'uv', 'color']) {
    const a = f.getAttribute(name) as THREE.BufferAttribute | undefined;
    if (!a) continue;
    for (let i = 0; i < a.count; i += 3) for (let c = 0; c < a.itemSize; c++) {
      const t = a.getComponent(i + 1, c); a.setComponent(i + 1, c, a.getComponent(i + 2, c)); a.setComponent(i + 2, c, t);
    }
  }
  const n = f.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return f;
}
/** Horizontal slab over a polygon (with holes), from y to y + t. */
function slab(p: P2[], holes: P2[][], y: number, t: number) {
  const s = new THREE.Shape(p.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, y, 0);
}
const yawM = (x: number, y: number, z: number, d: P2) => new THREE.Matrix4().makeRotationY(-Math.atan2(d[1], d[0])).setPosition(x, y, z);

/**
 * Stone of the Almohad and Hafsid minarets: ochre limestone, panels of a lozenge net (sebka) in pale stone over
 * rows of blind arches, a frieze at the top. One tile covers a whole face.
 */
function sebkaTexture() {
  const W = 128, H = 640, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b8874e'; g.fillRect(0, 0, W, H);
  // courses of ashlar
  g.strokeStyle = 'rgba(80,50,25,0.25)'; g.lineWidth = 1;
  for (let y = 0; y < H; y += 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const pale = '#e3cf9f';
  const panel = (y0: number, y1: number) => {
    g.strokeStyle = pale; g.lineWidth = 5; g.strokeRect(12, y0, W - 24, y1 - y0);
    g.save(); g.beginPath(); g.rect(16, y0 + 4, W - 32, y1 - y0 - 8); g.clip();
    g.lineWidth = 3.5;
    const s = 22;
    for (let k = -H; k < H; k += s) {
      g.beginPath(); g.moveTo(16, y0 + k); g.lineTo(W - 16, y0 + k + (W - 32)); g.stroke();
      g.beginPath(); g.moveTo(W - 16, y0 + k); g.lineTo(16, y0 + k + (W - 32)); g.stroke();
    }
    g.restore();
    // blind arches under the net
    g.fillStyle = 'rgba(60,35,15,0.55)';
    for (let i = 0; i < 3; i++) {
      const cx = 30 + i * 34, y = y1 - 6;
      g.beginPath(); g.moveTo(cx - 11, y); g.lineTo(cx - 11, y - 22); g.arc(cx, y - 22, 11, Math.PI, 0); g.lineTo(cx + 11, y); g.fill();
    }
  };
  panel(70, 250);
  panel(300, 520);
  // frieze of small arches and a band at the top
  g.fillStyle = pale; g.fillRect(0, 20, W, 10); g.fillRect(0, 50, W, 6);
  g.fillStyle = 'rgba(60,35,15,0.6)';
  for (let x = 8; x < W; x += 16) { g.beginPath(); g.moveTo(x - 5, 48); g.lineTo(x - 5, 38); g.arc(x, 38, 5, Math.PI, 0); g.lineTo(x + 5, 48); g.fill(); }
  g.fillStyle = pale; g.fillRect(0, 560, W, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** Square minaret of the Almohad type (Kasbah Mosque, Zitouna): textured shaft, crenellated top, lantern, dome. */
function almohadMinaret(k: TownKit, c: P2, S: number, shaft: number, dir: P2) {
  const { C, paint } = k;
  const g0 = k.groundAt(c[0], c[1]) - 0.6;
  const tex = sebkaTexture();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 });
  const m = yawM(c[0], g0, c[1], dir);
  const shaftG = new THREE.BoxGeometry(S, shaft, S).translate(0, shaft / 2, 0);
  const mesh = new THREE.Mesh(shaftG.clone().applyMatrix4(m), mat);
  mesh.castShadow = mesh.receiveShadow = true;
  k.C.extra.push(mesh);
  collideOnly(k, shaftG, m);
  // projecting cornice and merlons round the platform
  C.add('block', box(S + 0.5, 0.5, S + 0.5, 0, shaft + 0.25, 0), m, false);
  const top = g0 + shaft + 0.5;
  for (let side = 0; side < 4; side++) {
    const a = (side * Math.PI) / 2, d: P2 = [Math.cos(a), Math.sin(a)], n: P2 = [-d[1], d[0]];
    const loc = (u: number, v: number) => { const e = new THREE.Vector3(u, 0, v).applyMatrix4(new THREE.Matrix4().extractRotation(m)); return [c[0] + e.x, c[1] + e.z] as P2; };
    const a0 = loc(-d[0] * S / 2 - n[0] * S / 2 + n[0] * 0.15, -d[1] * S / 2 - n[1] * S / 2 + n[1] * 0.15);
    const a1 = loc(d[0] * S / 2 - n[0] * S / 2 + n[0] * 0.15, d[1] * S / 2 - n[1] * S / 2 + n[1] * 0.15);
    merlons(k, frame(a0[0], top, a0[1], sub2(a1, a0)), S);
  }
  // lantern with the same stone, a small ribbed dome and the brass finial (jamour)
  const L = S * 0.48, lh = S * 0.75;
  const lant = new THREE.BoxGeometry(L, lh, L).translate(0, shaft + 0.5 + lh / 2, 0);
  const lm = new THREE.Mesh(lant.applyMatrix4(m), mat); lm.castShadow = true; k.C.extra.push(lm);
  C.add('block', box(L + 0.3, 0.35, L + 0.3, 0, shaft + 0.5 + lh + 0.17, 0), m, false);
  C.add('roof', paint(ribbedDome(L * 0.45, 12), GREEN), m.clone().multiply(new THREE.Matrix4().makeTranslation(0, shaft + 0.85 + lh, 0)), false);
  const fin = shaft + 0.85 + lh + L * 0.45;
  C.add('townSteel', cylinder(0.04, 0.05, 1.6, 6), m.clone().multiply(new THREE.Matrix4().makeTranslation(0, fin, 0)), false);
  for (const y of [0.45, 0.85, 1.2]) C.add('townSteel', new THREE.SphereGeometry(0.17, 8, 6), m.clone().multiply(new THREE.Matrix4().makeTranslation(0, fin + y, 0)), false);
  k.markSeg(c, c, S * 0.75, k.flags.BLD);
}

/**
 * Octagonal minaret of the Ottoman (Hanafi) mosques of Tunis: an eight-sided shaft with bands of green tiles,
 * a balcony on brackets under a wooden canopy, a slimmer lantern and a pointed green-tiled roof.
 */
function octagonalMinaret(k: TownKit, c: P2, r: number, h: number) {
  const { C, paint } = k;
  const g0 = k.groundAt(c[0], c[1]) - 0.6;
  const at = (y: number) => new THREE.Matrix4().makeTranslation(c[0], g0 + y, c[1]);
  const oct = (rt: number, rb: number, hh: number) => new THREE.CylinderGeometry(rt, rb, hh, 8).rotateY(Math.PI / 8).translate(0, hh / 2, 0);
  C.add('roof', paint(oct(r, r * 1.04, h), STONE), at(0));
  for (const y of [h * 0.45, h * 0.72, h - 1.4]) C.add('roof', paint(oct(r + 0.04, r + 0.04, 0.5), GREEN), at(y), false);
  // windows up the shaft
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 8 + i * 0.4, y = 4 + i * (h - 7) / 4;
    C.add('roof', paint(box(0.12, 1.2, 0.55, 0, 0.6, 0).rotateY(-a).translate(Math.cos(a) * r * 0.93, 0, Math.sin(a) * r * 0.93), DARK), at(y), false);
  }
  // balcony, its railing and the canopy
  C.add('roof', paint(oct(r + 0.9, r + 0.2, 0.55), STONE), at(h), false);
  C.add('roof', paint(oct(r + 0.85, r + 0.85, 0.9).translate(0, 0.55, 0), MARBLE), at(h), false);
  const lr = r * 0.62, lh = 4.2;
  C.add('roof', paint(oct(lr, lr, lh), STONE), at(h + 0.55), false);
  C.add('roof', paint(new THREE.ConeGeometry(r + 1.1, 1.0, 8, 1, true).rotateY(Math.PI / 8).translate(0, 0.5, 0), GREEN), at(h + 2.9), false);
  C.add('roof', paint(new THREE.ConeGeometry(lr + 0.35, 2.8, 8).rotateY(Math.PI / 8).translate(0, 1.4, 0), GREEN), at(h + 0.55 + lh), false);
  const fin = h + 0.55 + lh + 2.8;
  C.add('townSteel', cylinder(0.04, 0.05, 1.4, 6), at(fin), false);
  for (const y of [0.4, 0.75, 1.05]) C.add('townSteel', new THREE.SphereGeometry(0.15, 8, 6), at(fin + y), false);
  k.markSeg(c, c, r + 1, k.flags.BLD);
}

/** A mosque's prayer hall: the mapped outline in lime plaster; some carry green-tiled pyramid roofs (Ottoman mosques). */
function mosqueBody(k: TownKit, b: Building, h: number, greenRoofs = false) {
  k.house(b.p, b.id, { lv: 1, h });
  if (!greenRoofs) return;
  const { hi } = k.footprintGround(b.p), c = cen(b.p);
  const bb = k.bbox(b.p), s = Math.min(bb.x1 - bb.x0, bb.z1 - bb.z0) * 0.32;
  for (const q of [c, lerp2(c, b.p[0], 0.45)]) {
    if (!k.inPoly(q[0], q[1], b.p)) continue;
    k.C.add('roof', k.paint(new THREE.ConeGeometry(s * 0.42, s * 0.36, 4).rotateY(Math.PI / 4).translate(q[0], hi + h + 0.6 + s * 0.18, q[1]), GREEN), undefined, false);
  }
}

// ---------------------------------------------------------------------------
// the Zitouna Mosque

function zitouna(k: TownKit) {
  const { C, paint } = k;
  const { lo, hi } = k.footprintGround(OUT);
  const base = lo - 0.8, F = hi + 0.3, HR = 8.2;     // floor and roof of the halls and galleries
  // the floor platform; the court paved in pale marble
  const floor = k.flat(OUT, F); if (floor) C.add('paving', floor);
  C.add('block', k.walls(OUT, base, F, 0));
  const court = k.flat(COURT, F + 0.03); if (court) C.add('roof', paint(court, COURT_C), undefined, false);
  // the roof over the galleries and the prayer hall (the court open to the sky)
  C.add('roof', paint(slab(OUT, [COURT], F + HR, 0.7), PLASTER), undefined, false);

  // outer walls; the east front on the souks is an arcade (the Hafsid colonnade) with the door
  let door = 0, best = Infinity;
  for (let i = 0; i < OUT.length; i++) {
    const a = OUT[i], b = OUT[(i + 1) % OUT.length], d = unit(sub2(b, a));
    const t = Math.max(0, Math.min(Math.hypot(b[0] - a[0], b[1] - a[1]), (ZIT_DOOR[0] - a[0]) * d[0] + (ZIT_DOOR[1] - a[1]) * d[1]));
    const dist = Math.hypot(a[0] + d[0] * t - ZIT_DOOR[0], a[1] + d[1] * t - ZIT_DOOR[1]);
    if (dist < best) { best = dist; door = i; }
  }
  const top = F + HR + 1.2;
  for (let i = 0; i < OUT.length; i++) {
    const a = OUT[i], b = OUT[(i + 1) % OUT.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 0.3) continue;
    const d = unit(sub2(b, a)), mid = lerp2(a, b, 0.5);
    let n: P2 = [-d[1], d[0]];
    if (!inside(OUT, mid[0] + n[0] * 1.5, mid[1] + n[1] * 1.5)) n = [-n[0], -n[1]];
    if (i === door) {
      const bays = Math.max(3, Math.round(L / 3.4));
      const o = add2(a, n, 0.4);
      C.add('roof', paint(arcade(L, top - F, bays, { pier: 0.55, spring: 3.6, thick: 0.6 }), PLASTER), frame(o[0], F, o[1], d));
      for (let j = 0; j <= bays; j++) {
        const q = add2(o, d, (j * L) / bays);
        C.add('roof', paint(cylinder(0.2, 0.23, 3.4, 10), MARBLE), new THREE.Matrix4().makeTranslation(q[0] - n[0] * 0.45, F, q[1] - n[1] * 0.45));
      }
      // steps up from the souks along the whole front (the floor of the mosque stands above the lane, which slopes):
      // a flight for each bay, from the street in front of it
      for (let j = 0; j < bays; j++) {
        const bc = add2(a, d, ((j + 0.5) * L) / bays), sm = add2(bc, n, -2.6), street = k.groundAt(sm[0], sm[1]), rise = F - street;
        if (rise < 0.2) continue;
        const steps = Math.ceil(rise / 0.27), tread = 0.4;
        for (let i2 = 0; i2 < steps; i2++) {
          const top = F - (i2 * rise) / steps, q = add2(bc, n, -(0.05 + tread * (i2 + 0.5)));
          C.add('paving', box(L / bays + 0.04, top - street + 0.8, tread + 0.02, 0, (top - street + 0.8) / 2, 0), yawM(q[0], street - 0.8, q[1], d));
        }
      }
      continue;
    }
    C.add('roof', paint(box(L + 0.6, top - base, 1.0, 0, (top - base) / 2, 0), PLASTER), yawM(mid[0] + n[0] * 0.5, base, mid[1] + n[1] * 0.5, d));
  }

  // arcades round the court, on marble columns, the prayer hall's front with a taller central arch
  for (let i = 0; i < 4; i++) {
    const a = COURT[i], b = COURT[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = unit(sub2(b, a));
    let n: P2 = [-d[1], d[0]];
    if (inside(COURT, (a[0] + b[0]) / 2 + n[0], (a[1] + b[1]) / 2 + n[1])) n = [-n[0], -n[1]];
    const o = add2(a, n, 0.35), bays = Math.max(4, Math.round(L / 3.5));
    C.add('roof', paint(arcade(L, HR, bays, { pier: 0.42, spring: 4.4, thick: 0.5 }), ARCH), frame(o[0], F, o[1], d));
    for (let j = 0; j <= bays; j++) {
      const q = add2(o, d, (j * L) / bays);
      C.add('roof', paint(cylinder(0.21, 0.24, 4.1, 10), MARBLE), new THREE.Matrix4().makeTranslation(q[0], F, q[1]));
      C.add('roof', paint(box(0.6, 0.45, 0.6, 0, 4.32, 0), MARBLE), new THREE.Matrix4().makeTranslation(q[0], F, q[1]), false);
    }
  }

  // the forest of columns: naves running towards the qibla wall, arches along them in the prayer hall
  const clearOf = (p: P2) => {
    for (const [dx, dz] of [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]]) {
      if (!inside(OUT, p[0] + dx, p[1] + dz)) return false;
      if (inside(COURT, p[0] + dx * 0.9, p[1] + dz * 0.9)) return false;
    }
    return Math.hypot(p[0] - ZIT_MINARET[0], p[1] - ZIT_MINARET[1]) > 5.5;
  };
  const NAVE = 4.0, BAY = 4.6;
  for (let u = -30; u <= 80; u += NAVE) {
    const run: P2[] = [];
    const flush = () => {
      if (run.length >= 2) {
        const L = Math.hypot(run[run.length - 1][0] - run[0][0], run[run.length - 1][1] - run[0][1]);
        C.add('roof', paint(arcade(L, HR, run.length - 1, { pier: 0.4, spring: 4.6, thick: 0.4 }), PLASTER), frame(run[0][0], F, run[0][1], QIBLA), false);
      }
      run.length = 0;
    };
    for (let v = -30; v <= 45; v += BAY) {
      const p = add2(add2(CS, ZU, u), QIBLA, v);
      if (!clearOf(p)) { flush(); continue; }
      C.add('roof', paint(cylinder(0.2, 0.23, 4.4, 8), MARBLE), new THREE.Matrix4().makeTranslation(p[0], F, p[1]));
      C.add('roof', paint(box(0.55, 0.4, 0.55, 0, 4.6, 0), MARBLE), new THREE.Matrix4().makeTranslation(p[0], F, p[1]), false);
      if (v > 0) run.push(p); else flush();
    }
    flush();
  }
  // red mats on the floor of the prayer hall, lamps down the central nave
  const midFront = lerp2(CS, CE, 0.5);
  let depth = 2; while (inside(OUT, ...add2(midFront, QIBLA, depth + 1)) && depth < 60) depth += 1;
  {
    const q: P2[] = [add2(CS, QIBLA, 1.2), add2(CE, QIBLA, 1.2), add2(CE, QIBLA, depth - 1.2), add2(CS, QIBLA, depth - 1.2)].filter((p) => inside(OUT, p[0], p[1]));
    if (q.length === 4) { const mat = k.flat(k.signedArea(q) < 0 ? q.reverse() : q, F + 0.03); if (mat) C.add('roof', paint(mat, new THREE.Color('#7a3328')), undefined, false); }
  }
  for (let s2 = 4; s2 < depth - 3; s2 += 5) { const q = add2(midFront, QIBLA, s2 + 0.6); C.add('townSteel', cylinder(0.45, 0.22, 0.35, 10), new THREE.Matrix4().makeTranslation(q[0], F + 5.4, q[1]), false); }
  // mihrab niche on the qibla wall
  const mih = add2(midFront, QIBLA, depth - 0.2);
  C.add('roof', paint(box(2.2, 4.6, 0.5, 0, 2.3, 0), new THREE.Color('#5b4636')), yawM(mih[0], F, mih[1], ZU), false);
  // the domes: over the entrance of the hall (the Bahu) and over the mihrab
  // (the Bahu dome rises on a tall square drum of stone with arched windows over the hall's front; white ribbed caps)
  for (const [q, r, sq] of [[add2(midFront, QIBLA, 2.2), 2.9, 4.2], [add2(midFront, QIBLA, depth - 4), 3.4, 1.4]] as [P2, number, number][]) {
    const y = F + HR + 0.7, m = yawM(q[0], y, q[1], ZU);
    C.add('roof', paint(box(r * 2.4, sq, r * 2.4, 0, sq / 2, 0), STONE), m, false);
    if (sq > 2) for (let i = 0; i < 4; i++) for (const o of [-1, 0, 1]) {
      const a = (i * Math.PI) / 2, cx = Math.cos(a) * r * 1.21, cz = Math.sin(a) * r * 1.21, tx = -Math.sin(a), tz = Math.cos(a);
      C.add('roof', paint(box(0.08, 1.5, 0.7, 0, 0, 0).rotateY(-a).translate(cx + tx * o * 1.6, sq * 0.55, cz + tz * o * 1.6), DARK), m, false);
    }
    C.add('roof', paint(new THREE.CylinderGeometry(r * 1.02, r * 1.05, 1.8, 8).rotateY(Math.PI / 8).translate(0, sq + 0.9, 0), STONE), m, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; C.add('roof', paint(box(0.12, 0.9, 0.6, 0, 0, 0).rotateY(-a).translate(Math.cos(a) * r * 1.02, sq + 0.9, Math.sin(a) * r * 1.02), DARK), m, false); }
    C.add('roof', paint(ribbedDome(r, 20), DOME), yawM(q[0], y + sq + 1.8, q[1], ZU), false);
    C.add('townSteel', cylinder(0.04, 0.05, 1.1, 6), new THREE.Matrix4().makeTranslation(q[0], y + sq + 1.8 + r, q[1]), false);
  }

  // the minaret (1894), on the pattern of the Kasbah Mosque's
  almohadMinaret(k, ZIT_MINARET, 6.6, ZIT_MINARET_H - 7.8, ZU);
  k.markPoly(OUT, k.flags.BLD, 0.5);
}

// ---------------------------------------------------------------------------
// the covered souks

const SHUTTERS = ['#2f6b8f', '#7a2f2a', '#3c6e4a', '#6b4a2a', '#8a6d2c'].map((c) => new THREE.Color(c));
const GOODS = ['#b8322a', '#d9a441', '#efe6d2', '#2c5d8a', '#8c2b5a', '#c46a2b', '#3d7a4f'].map((c) => new THREE.Color(c));

/**
 * A covered souk on a mapped lane: walls of shopfronts on both sides and a whitewashed barrel vault, cut by
 * skylights every few bays. Where the lane runs beside the Zitouna's wall, the vault rests on that wall.
 */
function souk(k: TownKit, r: Road, painted: boolean) {
  const { C, paint } = k;
  const vaultCol = new THREE.Color('#ece3cf');
  let piece = 0;
  for (let i = 0; i < r.p.length - 1; i++) {
    const a = r.p[i], b = r.p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1) continue;
    const d = unit(sub2(b, a)), n: P2 = [-d[1], d[0]];
    const parts = Math.max(1, Math.round(L / 3.6)), pl = L / parts;
    for (let j = 0; j < parts; j++, piece++) {
      const m = lerp2(a, b, (j + 0.5) / parts);
      // the vault stops short of the mosque's front (its steps)
      if ([0, 3.5, -3.5].some((t) => inside(OUT, m[0] + d[0] * t, m[1] + d[1] * t))) continue;
      const g = k.groundAt(m[0], m[1]);
      // how far the vault reaches on each side: the shopfront walls, or the mosque's wall where it is nearer
      const ext = [1, -1].map((s) => {
        for (let o = 0.4; o <= r.w / 2 + 0.3; o += 0.2) if (inside(OUT, m[0] + n[0] * o * s, m[1] + n[1] * o * s)) return { e: o, wall: false };
        // a crossing lane: no wall on that side
        const cross = (k.at(m[0] + n[0] * s * (r.w / 2 + 1.4), m[1] + n[1] * s * (r.w / 2 + 1.4)) & k.flags.ROAD) !== 0;
        return { e: r.w / 2 + 0.3, wall: !cross };
      });
      const R = (ext[0].e + ext[1].e) / 2, off = (ext[0].e - ext[1].e) / 2;
      const c = add2(m, n, off), spring = g + 3.6;
      const mm = yawM(c[0], spring, c[1], d);
      if (piece % 5 !== 4) {
        const shell = new THREE.CylinderGeometry(R, R, pl + 0.05, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2);
        // (in the collision mesh too, high over the walker's head, so that views are not found under a vault)
        C.add('roof', paint(shell, vaultCol), mm);
        C.add('roof', paint(flipped(shell), vaultCol.clone().multiplyScalar(0.93)), mm);
      } else {
        // a skylight between two transverse arches
        for (const t of [-pl / 2 + 0.2, pl / 2 - 0.2]) C.add('roof', paint(box(0.4, 0.5, 2 * R, t, R - 0.1, 0), vaultCol), mm, false);
      }
      for (const [si, s] of [[0, 1], [1, -1]] as const) {
        if (!ext[si].wall) continue;
        const wx = m[0] + n[0] * s * (r.w / 2 + 0.3), wz = m[1] + n[1] * s * (r.w / 2 + 0.3);
        const wm = yawM(wx, g - 0.6, wz, d);
        C.add('roof', paint(box(pl + 0.05, 3.9 + 0.6, 0.6, 0, (3.9 + 0.6) / 2, 0), new THREE.Color('#e8ddc6')), wm);
        // a shop: dark opening, painted shutters folded open, goods hanging or stacked
        const h = Math.abs(Math.sin(wx * 12.9898 + wz * 78.233) * 43758.5453) % 1;
        const face = (o: number) => -s * (0.3 + o);
        C.add('roof', paint(box(pl * 0.62, 2.3, 0.05, 0, 0.6 + 1.15, face(0.03)), DARK), wm, false);
        C.add('roof', paint(box(0.12, 2.4, 0.06, -pl * 0.31 - 0.06, 0.6 + 1.2, face(0.05)), SHUTTERS[Math.floor(h * 5)]), wm, false);
        C.add('roof', paint(box(0.12, 2.4, 0.06, pl * 0.31 + 0.06, 0.6 + 1.2, face(0.05)), SHUTTERS[Math.floor(h * 5)]), wm, false);
        if (h < 0.55) for (let q = 0; q < 3; q++) C.add('roof', paint(box(0.42, 0.5 + ((h * 7 + q) % 1) * 0.5, 0.06, (q - 1) * 0.55, 0.6 + 1.6, face(0.12)), GOODS[Math.floor(((h * 13 + q * 0.37) % 1) * GOODS.length)]), wm, false);
        else C.add('roof', paint(box(pl * 0.5, 0.5, 0.5, 0, 0.6 + 0.25, face(0.3)), GOODS[Math.floor(((h * 5) % 1) * GOODS.length)]), wm, false);
        // the perfume souk: columns painted in red and green bands at each bay
        if (painted) for (let y = 0; y < 3.3; y += 0.55) C.add('roof', paint(cylinder(0.11, 0.11, 0.55, 8, y), Math.round(y / 0.55) % 2 ? new THREE.Color('#3c6b4f') : new THREE.Color('#7e3a2e')), yawM(wx - d[0] * pl / 2 - n[0] * s * 0.45, g, wz - d[1] * pl / 2 - n[1] * s * 0.45, d), false);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Sidi Mahrez, Tourbet el Bey, the gates

/** Plan of the Sidi Mahrez Mosque: the square prayer hall stands against the side facing the qibla (east-south-east). */
function mahrezPlan(p: P2[]) {
  const c = cen(p), Q: P2 = [0.94, 0.34];
  let qi = 0, qd = -Infinity;
  for (let i = 0; i < p.length; i++) { const m = lerp2(p[i], p[(i + 1) % p.length], 0.5), o = unit(sub2(m, c)), dot = o[0] * Q[0] + o[1] * Q[1]; if (dot > qd) { qd = dot; qi = i; } }
  const A = p[qi], B = p[(qi + 1) % p.length], u = unit(sub2(B, A)), Lq = Math.hypot(B[0] - A[0], B[1] - A[1]);
  let v: P2 = [-u[1], u[0]]; if (!inside(p, ...add2(lerp2(A, B, 0.5), v, 2))) v = [-v[0], -v[1]];
  let depth = 4; while (inside(p, ...add2(lerp2(A, B, 0.5), v, depth + 1)) && depth < 90) depth++;
  const side = Math.min(Lq - 4, 26), hall = [0.5 * (Lq - side), 0.5 * (Lq + side)];
  const P = (s: number, t: number) => add2(add2(A, u, s), v, t);
  const hallPoly: P2[] = [P(hall[0], 0.5), P(hall[1], 0.5), P(hall[1], side + 0.5), P(hall[0], side + 0.5)];
  // the entrance: in the far wall, opposite the hall
  let fi = 0, fd = Infinity;
  for (let i = 0; i < p.length; i++) { const m = lerp2(p[i], p[(i + 1) % p.length], 0.5), o = unit(sub2(m, c)), dot = o[0] * Q[0] + o[1] * Q[1]; if (dot < fd) { fd = dot; fi = i; } }
  return { Q, qi, fi, Lq, u, depth, side, hall, P, hallPoly, dome: P((hall[0] + hall[1]) / 2, side / 2 + 0.5), court: P(Lq * 0.32, depth - 8) };
}
/** Centre of the great dome of the Sidi Mahrez Mosque. */
export const MAHREZ_DOME: P2 = mahrezPlan(MAHREZ.p).dome;
/** In its courtyard, facing the hall. */
export const MAHREZ_COURT: P2 = mahrezPlan(MAHREZ.p).court;

/** The Sidi Mahrez Mosque: a white prayer hall under a great dome with four corner domes, in the Ottoman manner; a court with domed galleries. */
function sidiMahrez(k: TownKit, b: Building) {
  const { C, paint } = k;
  const p = b.p;
  const { lo, hi } = k.footprintGround(p);
  const base = lo - 0.8, F = hi + 0.4;
  const { qi, fi, side, hall, P, hallPoly } = mahrezPlan(p);
  // platform and walls of the whole enclosure
  const fl = k.flat(p, F); if (fl) C.add('paving', fl);
  for (let i = 0; i < p.length; i++) {
    const a = p[i], e = p[(i + 1) % p.length], L = Math.hypot(e[0] - a[0], e[1] - a[1]), d = unit(sub2(e, a)), m = lerp2(a, e, 0.5);
    let n: P2 = [-d[1], d[0]]; if (!inside(p, m[0] + n[0], m[1] + n[1])) n = [-n[0], -n[1]];
    const Hw = F + 5.9 - base, wm = yawM(m[0] + n[0] * 0.4, base, m[1] + n[1] * 0.4, d);
    if (i !== fi) { C.add('roof', paint(box(L + 0.8, Hw, 0.8, 0, Hw / 2, 0), WHITE), wm); continue; }
    // the door: a 3 m opening with green leaves folded back, a lintel over it
    const half = (L + 0.8) / 2 - 1.5;
    for (const s of [1, -1]) {
      C.add('roof', paint(box(half, Hw, 0.8, s * (1.5 + half / 2), Hw / 2, 0), WHITE), wm);
      C.add('roof', paint(box(0.1, 3.4, 1.4, s * 1.45, F - base + 1.7, -1.1), GREEN), wm, false);
    }
    C.add('roof', paint(box(3.2, Hw - (F - base) - 3.8, 0.8, 0, (Hw + F - base + 3.8) / 2, 0), WHITE), wm);
  }
  // the hall: a white cube, the great dome on a drum and the corner domes
  const H = 9;
  C.add('roof', paint(k.walls(k.signedArea(hallPoly) < 0 ? hallPoly.slice().reverse() : hallPoly, F, F + H, 0), WHITE));
  const hr = k.flat(k.signedArea(hallPoly) < 0 ? hallPoly.slice().reverse() : hallPoly, F + H); if (hr) C.add('roof', paint(hr, WHITE), undefined, false);
  const hc = P((hall[0] + hall[1]) / 2, side / 2 + 0.5), R = side * 0.31;
  C.add('roof', paint(new THREE.CylinderGeometry(R, R * 1.05, 3.2, 16).translate(hc[0], F + H + 1.6, hc[1]), WHITE), undefined, false);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; C.add('roof', paint(box(0.14, 1.2, 0.7, 0, 0, 0).rotateY(-a).translate(hc[0] + Math.cos(a) * R * 1.01, F + H + 1.7, hc[1] + Math.sin(a) * R * 1.01), DARK), undefined, false); }
  C.add('roof', paint(new THREE.SphereGeometry(R, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(hc[0], F + H + 3.2, hc[1]), WHITE), undefined, false);
  C.add('townSteel', cylinder(0.05, 0.06, 1.6, 6, F + H + 3.2 + R).translate(hc[0], 0, hc[1]), undefined, false);
  for (const [s, t] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) {
    const q = P(hall[0] + side * s, 0.5 + side * t), r = side * 0.12;
    C.add('roof', paint(cylinder(r, r, 1.2, 14, F + H).translate(q[0], 0, q[1]), WHITE), undefined, false);
    C.add('roof', paint(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(q[0], F + H + 1.2, q[1]), WHITE), undefined, false);
  }
  // a domed portico on the court side, windows and the door of the hall
  {
    const t0 = side + 0.5, t1 = t0 + 3.6, a = P(hall[0], t1), e = P(hall[1], t1), d = unit(sub2(e, a));
    C.add('roof', paint(arcade(side, 5.6, 5, { pier: 0.6, spring: 3.3, thick: 0.5 }), WHITE), frame(a[0], F, a[1], d));
    const q: P2[] = [P(hall[0], t0), P(hall[1], t0), P(hall[1], t1 + 0.25), P(hall[0], t1 + 0.25)];
    C.add('roof', paint(slab(k.signedArea(q) < 0 ? q.slice().reverse() : q, [], F + 5.6, 0.45), WHITE), undefined, false);
    for (let i = 0; i < 5; i++) {
      const m = P(hall[0] + (side * (i + 0.5)) / 5, (t0 + t1) / 2);
      C.add('roof', paint(cylinder(1.5, 1.5, 0.5, 14, F + 6.05).translate(m[0], 0, m[1]), WHITE), undefined, false);
      C.add('roof', paint(new THREE.SphereGeometry(1.5, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2).translate(m[0], F + 6.55, m[1]), WHITE), undefined, false);
      const w = P(hall[0] + (side * (i + 0.5)) / 5, t0 + 0.05);
      if (i === 2) C.add('roof', paint(box(2.0, 3.4, 0.1, 0, 1.7, 0), GREEN), yawM(w[0], F, w[1], d), false);
      else C.add('roof', paint(box(1.1, 1.8, 0.1, 0, 2.2, 0), DARK), yawM(w[0], F, w[1], d), false);
    }
  }
  // half domes on the four sides of the great dome
  for (const [s, t, a] of [[0.5, 0.18, 0], [0.5, 0.82, Math.PI], [0.18, 0.5, Math.PI / 2], [0.82, 0.5, -Math.PI / 2]]) {
    const q = P(hall[0] + side * s, 0.5 + side * t), r = side * 0.17;
    void a;
    C.add('roof', paint(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.75, 1).translate(q[0], F + H, q[1]), WHITE), undefined, false);
  }
  // the court beyond, ringed by galleries on arcades under rows of small domes
  const inner = insetPoly(p, 4.4);
  C.add('roof', paint(slab(p, [inner], F + 5.0, 0.5), WHITE), undefined, false);
  const inHall = (q: P2) => inside(hallPoly, q[0], q[1]) || inside(hallPoly, q[0] + 1.5, q[1]) || inside(hallPoly, q[0] - 1.5, q[1]) || inside(hallPoly, q[0], q[1] + 1.5) || inside(hallPoly, q[0], q[1] - 1.5);
  for (let i = 0; i < p.length; i++) {
    if (i === qi) continue;                         // the hall stands on the qibla side
    const a = inner[i], e = inner[(i + 1) % inner.length], L = Math.hypot(e[0] - a[0], e[1] - a[1]), d = unit(sub2(e, a));
    let bays = Math.max(2, Math.round(L / 3.6));
    if (i === fi && bays % 2 === 0) bays++;          // an arch, not a pier, in front of the door
    C.add('roof', paint(arcade(L, 5.0, bays, { pier: 0.5, spring: 2.9, thick: 0.5 }), WHITE), frame(a[0], F, a[1], d));
    const o = p[i], oe = p[(i + 1) % p.length], od = unit(sub2(oe, o)), oL = Math.hypot(oe[0] - o[0], oe[1] - o[1]);
    let n: P2 = [-od[1], od[0]]; if (!inside(p, ...add2(lerp2(o, oe, 0.5), n, 1))) n = [-n[0], -n[1]];
    for (let t = 2.6; t < oL - 2; t += 4.0) {
      const q = add2(add2(o, od, t), n, 2.2);
      if (inHall(q)) continue;
      C.add('roof', paint(cylinder(1.45, 1.45, 0.5, 14, F + 5.5).translate(q[0], 0, q[1]), WHITE), undefined, false);
      C.add('roof', paint(new THREE.SphereGeometry(1.45, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2).translate(q[0], F + 6.0, q[1]), WHITE), undefined, false);
    }
  }
}

/** The Tourbet el Bey: ochre sandstone walls with pilasters, and the green-tiled domes over the burial chambers. */
function tourbet(k: TownKit, b: Building) {
  const { C, paint } = k;
  const p = b.p, c = cen(p);
  const { lo, hi } = k.footprintGround(p);
  const base = lo - 0.8, top = hi + 8.5;
  C.add('roof', paint(k.walls(p, base, top + 0.8, 0), OCHRE));
  const roof = k.flat(p, top); if (roof) C.add('roof', paint(roof, new THREE.Color('#d8cdb6')), undefined, false);
  C.add('roof', paint(k.walls(p, top, top + 0.8, 0, top, true), OCHRE), undefined, false);
  // pilasters and a cornice along the street fronts
  for (let i = 0; i < p.length; i++) {
    const a = p[i], e = p[(i + 1) % p.length], L = Math.hypot(e[0] - a[0], e[1] - a[1]);
    if (L < 4) continue;
    const d = unit(sub2(e, a)); let n: P2 = [-d[1], d[0]];
    if (inside(p, ...add2(lerp2(a, e, 0.5), n, 1))) n = [-n[0], -n[1]];
    if (!(k.at(...add2(lerp2(a, e, 0.5), n, 2.6)) & k.flags.ROAD)) continue;
    for (let s = 1.5; s < L - 1; s += 2.6) {
      const q = add2(add2(a, d, s), n, 0.12);
      C.add('roof', paint(box(0.55, top - lo + 0.6, 0.25, 0, (top - lo + 0.6) / 2, 0), new THREE.Color('#b88a50')), yawM(q[0], lo - 0.6, q[1], d), false);
    }
    const q = add2(lerp2(a, e, 0.5), n, 0.2);
    C.add('roof', paint(box(L, 0.45, 0.4, 0, 0, 0), new THREE.Color('#b88a50')), yawM(q[0], top - 0.3, q[1], d), false);
  }
  // domes: a large one over the main chamber, smaller ones over the others, on octagonal drums
  const bb = k.bbox(p), ax: P2 = bb.x1 - bb.x0 > bb.z1 - bb.z0 ? [1, 0] : [0, 1];
  let far = 0; for (const q of p) far = Math.max(far, Math.abs((q[0] - c[0]) * ax[0] + (q[1] - c[1]) * ax[1]));
  const spots: [P2, number][] = [[c, 4.2], [add2(c, ax, far * 0.55), 2.8], [add2(c, ax, -far * 0.55), 2.8], [add2(add2(c, ax, far * 0.15), [-ax[1], ax[0]], 7), 2.2]];
  for (const [q, r] of spots) {
    if (!inside(p, q[0], q[1])) continue;
    C.add('roof', paint(new THREE.CylinderGeometry(r * 1.03, r * 1.06, 1.6, 8).rotateY(Math.PI / 8).translate(q[0], top + 0.8, q[1]), OCHRE), undefined, false);
    C.add('roof', paint(ribbedDome(r, 16).translate(q[0], top + 1.6, q[1]), TILE), undefined, false);
    C.add('townSteel', cylinder(0.04, 0.05, 0.9, 6, top + 1.6 + r).translate(q[0], 0, q[1]), undefined, false);
  }
  k.markPoly(p, k.flags.BLD, 0.4);
}

/**
 * A city gate from its mapped outline: a stone block pierced by a horseshoe arch, the passage across the long side.
 * Bab Bhar (the Sea Gate) stands alone in its square, crenellated.
 */
function gateOf(k: TownKit, p: P2[], H: number, alone = false) {
  const { C } = k;
  let ei = 0, el = 0;
  for (let i = 0; i < p.length; i++) { const L = Math.hypot(p[(i + 1) % p.length][0] - p[i][0], p[(i + 1) % p.length][1] - p[i][1]); if (L > el) { el = L; ei = i; } }
  const d = unit(sub2(p[(ei + 1) % p.length], p[ei])), n: P2 = [-d[1], d[0]], c = cen(p);
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const q of p) { const u = (q[0] - c[0]) * d[0] + (q[1] - c[1]) * d[1], v = (q[0] - c[0]) * n[0] + (q[1] - c[1]) * n[1]; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const W = u1 - u0, D = v1 - v0, cc = add2(add2(c, d, (u0 + u1) / 2), n, (v0 + v1) / 2);
  const g = k.footprintGround(p).lo, open = Math.min(5.6, W * 0.5);
  const start = add2(cc, d, -W / 2);
  C.add('block', arcade(W, H, 1, { pier: W - open, spring: Math.min(5.4, H - open * 0.6 - 1.4), thick: D }), frame(start[0], g - 0.6, start[1], d));
  for (const s of [1, -1]) { const q = add2(start, n, s * (D / 2 - 0.3)); merlons(k, frame(q[0], g - 0.6 + H, q[1], d), W); }
  if (alone) {
    // a cornice, and pale voussoirs round the arch on both faces
    C.add('block', box(W + 0.4, 0.5, D + 0.4, 0, H - 0.6, 0), yawM(cc[0], g, cc[1], d), false);
  }
  k.markSeg(add2(cc, d, -W / 2), add2(cc, d, W / 2), D / 2, k.flags.BLD);
  k.markSeg(add2(cc, n, -12), add2(cc, n, 12), 3, k.flags.KEEP);
}

/** A three-storey house with a café on its roof terrace: parasols, tables and chairs. */
function terrace(k: TownKit, c: P2) {
  const { C, paint } = k;
  const S = 3.6;
  const q: P2[] = [[c[0] - S, c[1] - S], [c[0] + S, c[1] - S], [c[0] + S, c[1] + S], [c[0] - S, c[1] + S]];
  if (k.signedArea(q) < 0) q.reverse();
  k.markPoly(q, k.flags.BLD, 0.3);
  k.house(q, 777200, { lv: 3, h: TERRACE_H });
  const top = k.footprintGround(q).hi + TERRACE_H;
  const cols = [new THREE.Color('#b8322a'), new THREE.Color('#efe6d2'), new THREE.Color('#2c5d8a')];
  // (parasols on the side away from the minaret, so they do not stand in the view)
  const f = unit(sub2(YD_MINARET, c)), r: P2 = [-f[1], f[0]];
  [[-2.2, -1.8], [-2.2, 1.8], [0.2, 2.7], [0.2, -2.7]].forEach(([a, b], i) => {
    const x = c[0] + f[0] * a + r[0] * b, z = c[1] + f[1] * a + r[1] * b;
    C.add('townSteel', cylinder(0.03, 0.03, 2.3, 6, top).translate(x, 0, z), undefined, false);
    C.add('roof', paint(new THREE.ConeGeometry(1.2, 0.45, 10, 1, true).translate(x, top + 2.4, z), cols[i % 3]), undefined, false);
    C.add('roof', paint(cylinder(0.38, 0.38, 0.05, 12, top + 0.72).translate(x, 0, z), WHITE), undefined, false);
    C.add('townSteel', cylinder(0.04, 0.04, 0.72, 6, top).translate(x, 0, z), undefined, false);
    for (const a of [0, Math.PI]) C.add('roof', paint(box(0.4, 0.45, 0.4, x + Math.cos(a + i) * 0.7, top + 0.22, z + Math.sin(a + i) * 0.7), WOOD), undefined, false);
  });
}

/** A convex polygon moved inwards by `d` metres on every side. */
function insetPoly(p: P2[], d: number): P2[] {
  const lines = p.map((a, i) => {
    const e = p[(i + 1) % p.length], dir = unit(sub2(e, a)), m = lerp2(a, e, 0.5);
    let n: P2 = [-dir[1], dir[0]]; if (!inside(p, m[0] + n[0] * 0.5, m[1] + n[1] * 0.5)) n = [-n[0], -n[1]];
    return { o: add2(a, n, d), dir };
  });
  return p.map((_, i) => {
    const l1 = lines[(i - 1 + p.length) % p.length], l2 = lines[i];
    const den = l1.dir[0] * l2.dir[1] - l1.dir[1] * l2.dir[0];
    if (Math.abs(den) < 1e-6) return l2.o;
    const t = ((l2.o[0] - l1.o[0]) * l2.dir[1] - (l2.o[1] - l1.o[1]) * l2.dir[0]) / den;
    return add2(l1.o, l1.dir, t);
  });
}
