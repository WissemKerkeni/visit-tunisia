/**
 * Vaulted rooms, passages and walls with openings, for sites built of dug or plastered rooms (Matmata's pits,
 * the ghorfas of the ksour): triangles are collected per material and each is turned to face a given way.
 */
import * as THREE from 'three';
import type { P2 } from './terrain-town';

export const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
/** Triangles collected per material, each turned to face a given direction. */
export class Acc {
  pos: number[] = []; uv: number[] = []; col: number[] = [];
  tri(A: THREE.Vector3, B: THREE.Vector3, C: THREE.Vector3, ua: P2, ub: P2, uc: P2, n: THREE.Vector3, c?: THREE.Color) {
    if (_a.subVectors(B, A).cross(_b.subVectors(C, A)).dot(n) < 0) { [B, C] = [C, B]; [ub, uc] = [uc, ub]; }
    for (const [v, t] of [[A, ua], [B, ub], [C, uc]] as [THREE.Vector3, P2][]) {
      this.pos.push(v.x, v.y, v.z); this.uv.push(t[0], t[1]);
      this.col.push(c?.r ?? 1, c?.g ?? 1, c?.b ?? 1);
    }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    return g;
  }
}

/** The outline of an arched opening of width w and springing height S from (cx, y0): up the left side, over, down. */
export function doorPath(cx: number, y0: number, w: number, S: number, seg = 8): P2[] {
  const r = w / 2, out: P2[] = [[cx - r, y0]];
  for (let i = 0; i <= seg; i++) { const a = Math.PI * (1 - i / seg); out.push([cx + Math.cos(a) * r, y0 + S + Math.sin(a) * r]); }
  out.push([cx + r, y0]);
  return out;
}

/** A flat piece in the vertical plane through O along u, from an outline in (along, height) with holes. */
export function planar(acc: Acc, outline: P2[], holes: P2[][], O: THREE.Vector3, u: P2, n: THREE.Vector3, c?: THREE.Color) {
  const v2 = (q: P2) => new THREE.Vector2(q[0], q[1]);
  const tris = THREE.ShapeUtils.triangulateShape(outline.map(v2), holes.map((h) => h.map(v2)));
  const all = [...outline, ...holes.flat()];
  const P = (q: P2) => new THREE.Vector3(O.x + u[0] * q[0], O.y + q[1], O.z + u[1] * q[0]);
  for (const [a, b, d] of tris) acc.tri(P(all[a]), P(all[b]), P(all[d]), all[a], all[b], all[d], n, c);
}

/** A passage of constant section between stations (floor centre, lateral axis); faces turned inwards. */
export function loft(walls: Acc, floor: Acc, st: { P: THREE.Vector3; u: P2 }[], prof: P2[], c?: THREE.Color, mid = 1.4) {
  let along = 0;
  for (let s = 0; s < st.length - 1; s++) {
    const S0 = st[s], S1 = st[s + 1], len = S0.P.distanceTo(S1.P);
    const ctr = S0.P.clone().add(S1.P).multiplyScalar(0.5).addScaledVector(UP, mid);
    let per = 0;
    for (let i = 0; i < prof.length; i++) {
      const p = prof[i], q = prof[(i + 1) % prof.length], pl = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const at = (S: typeof S0, v: P2) => new THREE.Vector3(S.P.x + S.u[0] * v[0], S.P.y + v[1], S.P.z + S.u[1] * v[0]);
      const A = at(S0, p), B = at(S0, q), C = at(S1, q), D = at(S1, p);
      const n = ctr.clone().sub(A.clone().add(C).multiplyScalar(0.5));
      const acc = i === prof.length - 1 ? floor : walls;
      acc.tri(A, B, C, [along, per], [along, per + pl], [along + len, per + pl], n, c);
      acc.tri(A, C, D, [along, per], [along + len, per + pl], [along + len, per], n, c);
      per += pl;
    }
    along += len;
  }
}

