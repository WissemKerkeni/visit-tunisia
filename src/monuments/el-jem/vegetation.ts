import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hash } from './geometry';

/** Canvas texture of dry grass blades with alpha. */
function grassTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 46; i++) {
    const x = 10 + Math.random() * 108;
    const h = 50 + Math.random() * 74;
    const lean = (Math.random() - 0.5) * 34;
    const tone = Math.random();
    g.strokeStyle = tone < 0.55 ? `hsl(${42 + Math.random() * 10}, ${35 + Math.random() * 20}%, ${52 + Math.random() * 18}%)`
      : `hsl(${70 + Math.random() * 25}, ${22 + Math.random() * 18}%, ${34 + Math.random() * 14}%)`;
    g.lineWidth = 1.4 + Math.random() * 1.6;
    g.beginPath();
    g.moveTo(x, 128);
    g.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Three crossed quads = one tuft. */
function tuftGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 3; k++) {
    const q = new THREE.PlaneGeometry(0.9, 0.6);
    q.translate(0, 0.3, 0);
    q.rotateY((k / 3) * Math.PI);
    parts.push(q);
  }
  const g = mergeGeometries(parts)!;
  // normals pointing up give soft, consistent lighting on thin cards
  const n = g.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

export interface Spot { x: number; y: number; z: number; scale?: number; color?: string }

export function buildVegetation(grass: Spot[], shrubs: Spot[], olives: Spot[]) {
  const group = new THREE.Group();
  let seed = 77;
  const rnd = () => hash(seed++ * 1.37);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();

  // dry grass tufts
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: '#d8c8a4' });
  const tufts = new THREE.InstancedMesh(tuftGeometry(), grassMat, grass.length);
  grass.forEach((p, i) => {
    const sc = (p.scale ?? 1) * (0.35 + rnd() * 0.55);
    m4.compose(v.set(p.x, p.y, p.z), q.setFromEuler(e.set(0, rnd() * 6.28, 0)), s.set(sc, sc * (0.7 + rnd() * 0.6), sc));
    tufts.setMatrixAt(i, m4);
  });
  tufts.receiveShadow = true;
  group.add(tufts);

  // low shrubs (squashed, jittered icosahedra), green and dry
  const shrubGeo = new THREE.IcosahedronGeometry(1, 1);
  const pos = shrubGeo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(0.8 + 0.35 * hash(i * 3.3));
    pos.setXYZ(i, v.x, Math.max(-0.2, v.y), v.z);
  }
  shrubGeo.computeVertexNormals();
  const shrubMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  const bushes = new THREE.InstancedMesh(shrubGeo, shrubMat, shrubs.length);
  const greens = ['#5d6440', '#6b6f48', '#7a7552', '#4f5a36', '#867a58', '#8c7f5c'].map((c) => new THREE.Color(c));
  shrubs.forEach((p, i) => {
    const sc = (p.scale ?? 1) * (0.25 + rnd() * 0.35);
    m4.compose(v.set(p.x, p.y + sc * 0.2, p.z), q.setFromEuler(e.set(0, rnd() * 6, 0)), s.set(sc * (1 + rnd() * 0.5), sc * 0.65, sc * (1 + rnd() * 0.5)));
    bushes.setMatrixAt(i, m4);
    bushes.setColorAt(i, p.color ? new THREE.Color(p.color) : greens[Math.floor(rnd() * greens.length)]);
  });
  bushes.castShadow = true; bushes.receiveShadow = true;
  group.add(bushes);

  // olive trees: twisted trunk + clumped silver-green canopy
  const trunk = new THREE.CylinderGeometry(0.16, 0.32, 1, 6).translate(0, 0.5, 0);
  const canopyParts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 14; k++) {
    const b = new THREE.IcosahedronGeometry(0.75, 1);
    const p = b.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const f = 0.75 + 0.5 * hash(i * 1.7 + k * 31); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f); }
    b.scale(1 + hash(k) * 0.5, 0.6, 1 + hash(k + 9) * 0.5);
    b.translate((hash(k * 2.1) - 0.5) * 3.0, 2.4 + hash(k * 4.3) * 1.3, (hash(k * 5.7) - 0.5) * 3.0);
    canopyParts.push(b);
  }
  const canopy = mergeGeometries(canopyParts)!;
  canopy.computeVertexNormals();
  const trunks = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 1 }), olives.length);
  const crowns = new THREE.InstancedMesh(canopy, new THREE.MeshStandardMaterial({ color: '#6f785a', roughness: 0.95, flatShading: true }), olives.length);
  olives.forEach((p, i) => {
    const sc = (p.scale ?? 1) * (0.8 + rnd() * 0.5);
    const tilt = q.setFromEuler(e.set((rnd() - 0.5) * 0.25, rnd() * 6, (rnd() - 0.5) * 0.25));
    trunks.setMatrixAt(i, m4.compose(v.set(p.x, p.y, p.z), tilt, s.set(sc, sc * 2.4, sc)));
    crowns.setMatrixAt(i, m4.compose(v.set(p.x, p.y, p.z), q.setFromEuler(e.set(0, rnd() * 6, 0)), s.set(sc, sc, sc)));
  });
  for (const m of [trunks, crowns]) { m.castShadow = true; m.receiveShadow = true; group.add(m); }

  return group;
}
