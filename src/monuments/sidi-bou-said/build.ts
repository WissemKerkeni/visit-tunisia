/**
 * Sidi Bou Said: the shared terrain-town builder (../common/terrain-town.ts) with the village's data and
 * its own landmark, the Café des Nattes steps and striped arch. The minaret, lighthouse, Ennejma Ezzahra
 * palace, the Café des Délices terraces, the marina and the night lights come from the shared builder.
 * Scene frame: origin = Café des Nattes, x = east, z = south, y = metres above sea level.
 */
import * as THREE from 'three';
import TOWN from '../../content/sidi-bou-said-town.json';
import type { Materials } from '../../viewer/materials';
import type { BuildResult, SiteDef } from '../../sites/types';
import { buildTerrainTown, type P2, type TownData, type TownKit } from '../common/terrain-town';
import { box } from '../el-jem/geometry';

export function buildSidiBouSaid(materials: Materials, site?: SiteDef): Promise<BuildResult> {
  return buildTerrainTown(materials, site, {
    data: TOWN as unknown as TownData,
    core: 330,
    // on Rue Habib Thameur, below the Café des Nattes, looking up the lane
    spawn: { x: -62, z: 27.5 },
    look: { x: 0, z: 0, h: 3 },
    lights: [
      [-10, 9, 3.2, 70, 24],     // Café des Nattes steps
      [-42, 22, 3.2, 55, 22],    // Rue Habib Thameur
      [-70, 30, 3.2, 55, 22],
      [16, -18, 3.2, 50, 20],    // Rue Sidi Bou Fares
      [262, 118, 3.0, 70, 26],   // Café des Délices terraces
      [256, 104, 3.0, 50, 20],
      [300, 415, 4.0, 60, 30],   // marina
    ],
    minaretFor: (b) => /Sidi Bou Said/i.test(b.name || ''),
    special: (b, kit) => {
      if (/Café des Nattes/i.test(b.name || '')) cafeDesNattes(b.p, kit);
      return false; // still built as a house
    },
  });
}

/** Café des Nattes: the broad flight of steps up from the lane and the black-and-white striped arch. */
function cafeDesNattes(p: P2[], k: TownKit) {
  const { C, paint, groundAt, WHITE } = k;
  const c = k.centroid(p);
  let best: P2 = [0, 0], bd = Infinity;
  for (const r of k.roads) if (r.k === 'pedestrian') for (const q of r.p) { const d = Math.hypot(q[0] - c[0], q[1] - c[1]); if (d < bd) { bd = d; best = q; } }
  const dx = best[0] - c[0], dz = best[1] - c[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
  const yaw = -Math.atan2(uz, ux);
  const g0 = groundAt(best[0], best[1]);
  const steps = 9, run = 0.38, rise = 0.18, w = 5.5;
  for (let i = 0; i < steps; i++) {
    const along = L - 1.5 - i * run;
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(c[0] + ux * along, 0, c[1] + uz * along);
    C.add('roof', paint(box(run + 0.02, rise * (i + 1) + 0.6, w, 0, g0 - 0.6 + (rise * (i + 1) + 0.6) / 2, 0), new THREE.Color(i % 2 ? '#e8e3d7' : '#e1dbcd')), m);
  }
  // striped arch on the wall facing the steps
  const top = g0 + steps * rise;
  const wallD = Math.max(1, L - 1.5 - steps * run);
  const ax = c[0] + ux * wallD, az = c[1] + uz * wallD;
  const m = new THREE.Matrix4().makeRotationY(yaw + Math.PI / 2).setPosition(ax, 0, az);
  const R = 1.05, n = 13;
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI - (i / n) * Math.PI, t1 = Math.PI - ((i + 1) / n) * Math.PI;
    const shape = new THREE.Shape();
    shape.moveTo(Math.cos(t0) * R, Math.sin(t0) * R); shape.lineTo(Math.cos(t0) * (R + 0.42), Math.sin(t0) * (R + 0.42));
    shape.lineTo(Math.cos(t1) * (R + 0.42), Math.sin(t1) * (R + 0.42)); shape.lineTo(Math.cos(t1) * R, Math.sin(t1) * R); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false }).translate(0, top + 2.2, 0.02);
    C.add('roof', paint(g, i % 2 ? new THREE.Color('#1b1b1b') : WHITE), m, false);
  }
  for (const sx of [-1, 1]) C.add('roof', paint(box(0.42, 2.2, 0.14, sx * (R + 0.21), top + 1.1, 0.06), new THREE.Color('#ece6d8')), m, false);
  C.add('roof', paint(box(R * 2, 2.2, 0.06, 0, top + 1.1, 0.03), new THREE.Color('#1e5f3c')), m, false);
}
