import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hash } from './geometry';

export interface Placement { x: number; z: number; yaw: number; y?: number }

const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

/** Low-poly hatchback/sedan: body, cabin with dark glass, four wheels. Returns [paint, glass+tyres] geometries. */
function carGeometry() {
  const body = new THREE.BoxGeometry(4.2, 0.75, 1.75).translate(0, 0.62, 0);
  const cabin = new THREE.BoxGeometry(2.3, 0.62, 1.6).translate(-0.2, 1.3, 0);
  // taper the cabin roof
  const p = cabin.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 1.4) p.setX(i, p.getX(i) * 0.78 - 0.1);
  const paint = mergeGeometries([body.toNonIndexed(), cabin.toNonIndexed()])!;
  const glass = new THREE.BoxGeometry(2.0, 0.46, 1.64).translate(-0.25, 1.28, 0);
  const wheels = [[-1.35, 0.8], [1.35, 0.8], [-1.35, -0.8], [1.35, -0.8]].map(([x, z]) =>
    new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12).rotateX(Math.PI / 2).translate(x, 0.32, z).toNonIndexed());
  const dark = mergeGeometries([glass.toNonIndexed(), ...wheels])!;
  return { paint, dark };
}

export function buildCars(spots: Placement[]) {
  const g = new THREE.Group();
  const { paint, dark } = carGeometry();
  const paintMesh = new THREE.InstancedMesh(paint, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.55 }), spots.length);
  const darkMesh = new THREE.InstancedMesh(dark, new THREE.MeshStandardMaterial({ color: '#1c2024', roughness: 0.3, metalness: 0.4 }), spots.length);
  const colours = ['#f2f2f0', '#e9e9e6', '#c9cbcd', '#8d9195', '#2b2d30', '#7a1f1f', '#1f3c6e', '#d8c9a8', '#f4f4f4', '#b0b4b8'].map((c) => new THREE.Color(c));
  spots.forEach((s, i) => {
    m4.compose(v.set(s.x, s.y ?? 0, s.z), q.setFromAxisAngle(up, s.yaw), sc.set(1, 1, 1));
    paintMesh.setMatrixAt(i, m4); darkMesh.setMatrixAt(i, m4);
    paintMesh.setColorAt(i, colours[Math.floor(hash(i * 7.31) * colours.length)]);
  });
  for (const m of [paintMesh, darkMesh]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  return g;
}

/** Street lamps: pole, arm and a head that glows at night. */
export function buildLamps(spots: Placement[]) {
  const pole = mergeGeometries([
    new THREE.CylinderGeometry(0.07, 0.11, 7, 8).translate(0, 3.5, 0).toNonIndexed(),
    new THREE.BoxGeometry(1.6, 0.08, 0.08).translate(0.75, 6.9, 0).toNonIndexed(),
  ])!;
  const head = new THREE.BoxGeometry(0.55, 0.16, 0.3).translate(1.5, 6.82, 0);
  const poles = new THREE.InstancedMesh(pole, new THREE.MeshStandardMaterial({ color: '#4a4d50', roughness: 0.5, metalness: 0.7 }), spots.length);
  const headMat = new THREE.MeshStandardMaterial({ color: '#ddd', emissive: '#ffcf8a', emissiveIntensity: 0 });
  const heads = new THREE.InstancedMesh(head, headMat, spots.length);
  spots.forEach((s, i) => { m4.compose(v.set(s.x, s.y ?? 0, s.z), q.setFromAxisAngle(up, s.yaw), sc.set(1, 1, 1)); poles.setMatrixAt(i, m4); heads.setMatrixAt(i, m4); });
  poles.castShadow = true;
  const g = new THREE.Group();
  g.add(poles, heads);
  return { group: g, headMaterial: headMat };
}

/**
 * Instances drawn with a detailed model near the camera and a simpler one beyond `near` metres.
 * Re-sorted when the main camera has moved a few metres (shadow cameras are orthographic and ignored).
 * `nearMeshes` and `farMeshes` share placements; their counts are managed here.
 */
function distanceLod(spots: Placement[], scaleOf: (i: number) => number, nearMeshes: THREE.InstancedMesh[], farMeshes: THREE.InstancedMesh[], near: number) {
  const N = spots.length, mats = new Float32Array(N * 16), pos = new Float32Array(N * 3);
  spots.forEach((s, i) => {
    const k = scaleOf(i);
    m4.compose(v.set(s.x, s.y ?? 0, s.z), q.setFromAxisAngle(up, s.yaw), sc.set(k, k, k));
    m4.toArray(mats, i * 16);
    pos[i * 3] = s.x; pos[i * 3 + 1] = s.y ?? 0; pos[i * 3 + 2] = s.z;
  });
  const last = new THREE.Vector3(Infinity, 0, 0), n2 = near * near;
  const sort = (cam: THREE.Camera) => {
    if (last.distanceToSquared(cam.position) < 64) return;
    last.copy(cam.position);
    let n = 0, f = 0;
    const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    for (let i = 0; i < N; i++) {
      const dx = pos[i * 3] - cx, dy = pos[i * 3 + 1] - cy, dz = pos[i * 3 + 2] - cz;
      const isNear = dx * dx + dy * dy + dz * dz < n2;
      const list = isNear ? nearMeshes : farMeshes, dst = (isNear ? n++ : f++) * 16, src = mats.subarray(i * 16, i * 16 + 16);
      for (const m of list) m.instanceMatrix.array.set(src, dst);
    }
    for (const m of nearMeshes) m.count = n;
    for (const m of farMeshes) m.count = f;
    for (const m of [...nearMeshes, ...farMeshes]) m.instanceMatrix.needsUpdate = true;
  };
  const hook = farMeshes[farMeshes.length - 1];
  hook.onBeforeRender = (_r, _s, cam) => { if ((cam as THREE.PerspectiveCamera).isPerspectiveCamera) sort(cam); };
  for (const m of [...nearMeshes, ...farMeshes]) { m.frustumCulled = false; m.count = 0; }
  // drawn (so the hook runs) until the first sort, with a real placement
  if (N) { hook.instanceMatrix.array.set(mats.subarray(0, 16), 0); hook.count = 1; }
}

/** Rounded street trees (ficus-like) and far olive groves (cheap, one blob each); both simplified with distance. */
export function buildTrees(street: Placement[], groves: Placement[]) {
  const g = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2.6, 6).translate(0, 1.3, 0);
  const crownParts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 12; k++) {
    const b = new THREE.IcosahedronGeometry(0.75, 1);
    const p = b.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const f = 0.8 + 0.4 * hash(i * 2.3 + k * 17); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f); }
    b.translate((hash(k * 3.1) - 0.5) * 2.4, 3.0 + hash(k * 1.7) * 1.4, (hash(k * 5.3) - 0.5) * 2.4);
    crownParts.push(b);
  }
  const crownGeo = mergeGeometries(crownParts)!;
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5b4a3a', roughness: 1 });
  const crownMat = new THREE.MeshStandardMaterial({ color: '#435430', roughness: 0.95, flatShading: true });
  // the same tree simplified for distance: a few coarse clumps (about 100 triangles instead of 960)
  const farParts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    farParts.push(new THREE.IcosahedronGeometry(1.25, 0).translate((hash(k * 3.1 + 1) - 0.5) * 1.8, 3.2 + hash(k * 1.7 + 1) * 1.0, (hash(k * 5.3 + 1) - 0.5) * 1.8).toNonIndexed());
  }
  const farCrown = mergeGeometries(farParts)!;
  const farTrunk = new THREE.CylinderGeometry(0.15, 0.25, 2.6, 4).translate(0, 1.3, 0).toNonIndexed();
  const L = street.length;
  const trees = [new THREE.InstancedMesh(trunkGeo, trunkMat, L), new THREE.InstancedMesh(crownGeo, crownMat, L)];
  const farTrees = [new THREE.InstancedMesh(farTrunk, trunkMat, L), new THREE.InstancedMesh(farCrown, crownMat, L)];
  for (const m of [...trees, ...farTrees]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  distanceLod(street, (i) => 0.85 + hash(i * 2.2) * 0.4, trees, farTrees, 140);

  // groves: trunk and blob crown near; beyond, the crown alone as an 8-triangle shape
  const oliveMat = new THREE.MeshStandardMaterial({ color: '#7d8562', roughness: 1, flatShading: true });
  const olive = mergeGeometries([
    new THREE.CylinderGeometry(0.12, 0.2, 1.4, 5).translate(0, 0.7, 0).toNonIndexed(),
    new THREE.IcosahedronGeometry(1.6, 0).scale(1.1, 0.75, 1.1).translate(0, 2.3, 0).toNonIndexed(),
  ])!;
  const farOlive = new THREE.OctahedronGeometry(1.75, 0).scale(1.1, 0.75, 1.1).translate(0, 2.2, 0);
  const G = groves.length;
  const grove = new THREE.InstancedMesh(olive, oliveMat, G), farGrove = new THREE.InstancedMesh(farOlive, oliveMat, G);
  grove.receiveShadow = true; farGrove.receiveShadow = true;
  g.add(grove, farGrove);
  distanceLod(groves, (i) => 0.8 + hash(i * 1.3) * 0.5, [grove], [farGrove], 350);
  return g;
}
