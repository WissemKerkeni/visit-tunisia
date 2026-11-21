import * as THREE from 'three';
import { HOUSE_STYLES, type HouseStyle } from './house-styles';
import { weather, type WeatherOpts } from './weathering';

export type MatKey = 'facade' | 'attic' | 'block' | 'plazaBlock' | 'townSteel' | 'rubble' | 'rock' | 'sand' | 'ground' | 'paving' | 'plaster' | 'roof' | 'plasterFar' | 'roofFar'
  | 'asphalt' | 'urban' | 'fields' | 'fence' | 'glass' | 'steel' | 'stage' | 'palmTrunk' | 'palmLeaf'
  | 'whitewash' | 'whitewashFar' | 'terrain' | 'water' | 'cobbles' | 'woodwork'
  /** A house wall in a town's style with one joinery colour: wall:<style>:<colour index>, plus :Far for distant houses (no shadows). */
  | `wall:${string}`;

/** Alpha texture of vertical railing bars (one tile = 0.6 m × 1.52 m; UVs in metres). */
function fenceTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, 64, 128);
  x.fillStyle = '#2f3336';
  x.fillRect(0, 0, 64, 7); x.fillRect(0, 112, 64, 6);
  for (let i = 0; i < 4; i++) x.fillRect(i * 16 + 6, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 0.6, 1 / 1.52);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Date-palm bark: stacked diamond leaf scars. Wraps once around the trunk, repeats ~40 times up it. */
function palmBarkTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 32;
  const g = c.getContext('2d')!;
  g.fillStyle = '#76604a'; g.fillRect(0, 0, 128, 32);
  for (let i = 0; i < 8; i++) {
    const x = i * 16 + 8 + (Math.random() - 0.5) * 4;
    g.fillStyle = `hsl(30, ${18 + Math.random() * 10}%, ${36 + Math.random() * 8}%)`;
    g.beginPath(); g.moveTo(x - 10, 31); g.lineTo(x + (Math.random() - 0.5) * 4, 6 + Math.random() * 6); g.lineTo(x + 10, 31); g.closePath(); g.fill();
    g.fillStyle = 'rgba(40,28,18,0.28)'; g.fillRect(x - 10, 29, 20, 3);
  }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,20,12' : '200,180,150'},0.12)`; g.fillRect(Math.random() * 128, Math.random() * 32, 3, 1); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 40);
  return t;
}

/**
 * Procedural plaster wall, 8 m wide × 9.6 m tall (three storeys; UVs are in metres):
 * ground floor with a painted door and a barred window, upper floors with shuttered windows.
 */
function facadeTexture(anisotropy: number) {
  const PX = 64; // pixels per metre
  const W = 8 * PX, H = Math.round(9.6 * PX);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f2ede4';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 3500; i++) {
    const v = 222 + Math.random() * 33;
    g.fillStyle = `rgba(${v},${v - 6},${v - 18},0.3)`;
    g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 10, 2 + Math.random() * 10);
  }
  const yOf = (m: number) => H - m * PX; // canvas y for a height in metres
  // storey bands: dirt near the ground, faint moulding between floors
  const grad = g.createLinearGradient(0, yOf(1.0), 0, H);
  grad.addColorStop(0, 'rgba(130,100,62,0)'); grad.addColorStop(1, 'rgba(130,100,62,0.35)');
  g.fillStyle = grad; g.fillRect(0, yOf(1.0), W, PX);
  g.fillStyle = 'rgba(160,140,110,0.18)';
  for (const m of [3.2, 6.4]) g.fillRect(0, yOf(m) - 4, W, 6);
  const shutterWindow = (cx: number, base: number) => {
    const x0 = cx * PX, w = 0.7 * PX, h = 1.0 * PX, y = yOf(base + 1.0);
    g.fillStyle = '#2a2622'; g.fillRect(x0 - w / 2, y, w, h);
    g.fillStyle = '#2f6fa8'; g.fillRect(x0 - w / 2 - 0.22 * PX, y, 0.22 * PX, h); g.fillRect(x0 + w / 2, y, 0.22 * PX, h);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let k = 4; k < h - 2; k += 7) { g.fillRect(x0 - w / 2 - 0.2 * PX, y + k, 0.18 * PX, 2); g.fillRect(x0 + w / 2 + 0.02 * PX, y + k, 0.18 * PX, 2); }
    g.fillStyle = '#d9cdb8'; g.fillRect(x0 - w / 2 - 0.3 * PX, y + h, w + 0.6 * PX, 5);
  };
  // ground floor: arched blue door with studs, and a small barred window
  {
    const x0 = 1.6 * PX, w = 1.1 * PX, h = 2.1 * PX, y = yOf(2.1);
    g.fillStyle = '#d4c6ad'; g.fillRect(x0 - w / 2 - 8, y - 8, w + 16, h + 8);
    g.fillStyle = Math.random() < 0.5 ? '#2c64a0' : '#3c7a63';
    g.beginPath(); g.moveTo(x0 - w / 2, yOf(0)); g.lineTo(x0 - w / 2, y + w / 2); g.arc(x0, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x0 + w / 2, yOf(0)); g.fill();
    g.fillStyle = 'rgba(20,20,20,0.6)';
    for (let yy = y + w / 2 + 10; yy < yOf(0.1); yy += 14) for (let xx = x0 - w / 2 + 8; xx < x0 + w / 2 - 4; xx += 14) g.fillRect(xx, yy, 3, 3);
    g.fillStyle = '#2a2622'; g.fillRect(5.4 * PX, yOf(2.1), 0.8 * PX, 0.8 * PX);
    g.fillStyle = '#1b1a18'; for (let k = 1; k < 5; k++) g.fillRect(5.4 * PX + (k * 0.8 * PX) / 5, yOf(2.1), 2, 0.8 * PX);
  }
  for (const base of [3.2, 6.4]) { shutterWindow(2.0, base + 0.2); shutterWindow(6.0, base + 0.2); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 8, 1 / 9.6);
  t.anisotropy = anisotropy;
  return t;
}

/** A darker shade of a colour (for frames and shadows of the joinery). */
function shade(hex: string, k: number) {
  const c = new THREE.Color(hex).multiplyScalar(k);
  return `#${c.getHexString()}`;
}

/** Where the windows of the house wall are (metres: centre x, sill height, width, height), per window kind. */
function wallWindows(style: HouseStyle) {
  if (style.windows === 'small') return { ground: [5.2, 1.5, 0.7, 0.7], up: [[2.0, 4.4, 0.7, 0.75], [7.6, 4.4, 0.7, 0.75]], upMid: [5.2, 4.5, 0.6, 0.6] };
  return { ground: [5.2, 0.9, 1.1, 1.2], up: [[2.0, 4.1, 0.75, 1.15], [7.6, 4.1, 0.75, 1.15]], upMid: [5.2, 4.0, 0.9, 1.0] };
}

/**
 * House wall, 9 m wide × 9.6 m tall (two storeys and a plain band above, so taller walls and walls below street
 * level stay plain; UVs in metres), drawn in a town's style (src/viewer/house-styles.ts) with one joinery colour:
 * plaster with mottling and a damp plinth; an arched or square door, studded or of planks, in a stone or plaster
 * surround; windows behind bulging ironwork cages, flat grilles or small wooden screens; shutters upstairs.
 */
function wallTexture(anisotropy: number, style: HouseStyle, joinery: string) {
  const PX = 64, W = 9 * PX, H = Math.round(9.6 * PX);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = style.base; g.fillRect(0, 0, W, H);
  const [sr, sg, sb] = style.speck;
  for (let i = 0; i < 4000; i++) {
    const v = (Math.random() - 0.5) * 26;
    g.fillStyle = `rgba(${sr + v},${sg + v},${sb + v},0.35)`;
    g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 12, 2 + Math.random() * 8);
  }
  const yOf = (m: number) => H - m * PX;
  // plinth wash and faint damp at the foot of the wall
  const grad = g.createLinearGradient(0, yOf(0.8), 0, H);
  grad.addColorStop(0, 'rgba(120,110,95,0)'); grad.addColorStop(1, `rgba(120,110,95,${style.relief === 'clay' ? 0.22 : 0.28})`);
  g.fillStyle = grad; g.fillRect(0, yOf(0.8), W, 0.8 * PX);
  const dark = shade(joinery, 0.78);
  // the door: surround, leaf, studs or planks
  {
    const x0 = 2.0 * PX, w = (style.door === 'arch' ? 1.15 : 1.05) * PX, top = yOf(style.door === 'arch' ? 2.25 : 2.1), r = w / 2;
    const leaf = (pad: number) => {
      g.beginPath();
      if (style.door === 'arch') { g.moveTo(x0 - r - pad, yOf(0)); g.lineTo(x0 - r - pad, top + r); g.arc(x0, top + r, r + pad, Math.PI, 0); g.lineTo(x0 + r + pad, yOf(0)); }
      else g.rect(x0 - r - pad, top - pad, w + pad * 2, yOf(0) - top + pad);
      g.fill();
    };
    g.fillStyle = style.frame; leaf(12);
    g.fillStyle = joinery; leaf(0);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0 - 1, top + (style.door === 'arch' ? r * 0.4 : 4), 2, yOf(0) - top - 4);
    if (style.studs) {
      g.fillStyle = '#111';
      for (let yy = top + r + 10; yy < yOf(0.12); yy += 13) for (let k = -3; k <= 3; k++) { const xx = x0 + k * 9; if (Math.abs(k) === 3 || (Math.round(yy / 13) + k) % 3 === 0) { g.beginPath(); g.arc(xx, yy, 2, 0, Math.PI * 2); g.fill(); } }
      if (style.door === 'arch') { g.beginPath(); for (let a = 0; a < 7; a++) { const px = x0 + Math.cos(Math.PI + a * Math.PI / 6) * (r - 8), py = top + r + Math.sin(Math.PI + a * Math.PI / 6) * (r - 8); g.moveTo(px, py); g.arc(px, py, 2, 0, Math.PI * 2); } g.fill(); }
    } else {
      // planks, a crossbar and a small iron knocker
      g.fillStyle = 'rgba(0,0,0,0.22)';
      for (let xx = x0 - r + 9; xx < x0 + r - 3; xx += 11) g.fillRect(xx, top + 4, 2, yOf(0) - top - 6);
      g.fillStyle = dark; g.fillRect(x0 - r + 3, yOf(1.15), w - 6, 6);
      g.fillStyle = '#2a2622'; g.beginPath(); g.arc(x0 + r * 0.55, yOf(1.05), 4, 0, Math.PI * 2); g.fill();
    }
  }
  // windows
  const win = wallWindows(style);
  const opening = (cx: number, base: number, w: number, h: number) => {
    const x0 = cx * PX - (w * PX) / 2, y0 = yOf(base + h), ww = w * PX, hh = h * PX;
    if (style.windows === 'cages') {
      g.fillStyle = '#20262c'; g.fillRect(x0 + 6, y0 + 6, ww - 12, hh - 12);
      g.strokeStyle = joinery; g.lineWidth = 3;
      g.strokeRect(x0, y0, ww, hh);
      for (let xx = x0 + 10; xx < x0 + ww - 4; xx += 12) { g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx, y0 + hh); g.stroke(); }
      g.lineWidth = 2;
      for (let yy = y0 + 14; yy < y0 + hh - 6; yy += 22) for (let xx = x0 + 16; xx < x0 + ww - 8; xx += 24) { g.beginPath(); g.arc(xx, yy, 6, 0, Math.PI * 1.6); g.stroke(); }
      g.fillStyle = dark; g.fillRect(x0 - 6, y0 + hh, ww + 12, 7); g.fillRect(x0 - 6, y0 - 6, ww + 12, 6);
    } else if (style.windows === 'grilles') {
      g.fillStyle = style.frame; g.fillRect(x0 - 6, y0 - 6, ww + 12, hh + 12);
      g.fillStyle = '#20262c'; g.fillRect(x0, y0, ww, hh);
      g.fillStyle = joinery;
      for (let xx = x0 + 8; xx < x0 + ww - 2; xx += 11) g.fillRect(xx, y0, 3, hh);
      for (let yy = y0 + hh / 3; yy < y0 + hh - 2; yy += hh / 3) g.fillRect(x0, yy, ww, 3);
    } else {
      // small opening with a wooden screen
      g.fillStyle = style.frame; g.fillRect(x0 - 5, y0 - 5, ww + 10, hh + 10);
      g.fillStyle = '#1e1a16'; g.fillRect(x0, y0, ww, hh);
      g.strokeStyle = joinery; g.lineWidth = 3;
      for (let k = -hh; k < ww; k += 10) { g.beginPath(); g.moveTo(x0 + k, y0); g.lineTo(x0 + k + hh, y0 + hh); g.stroke(); g.beginPath(); g.moveTo(x0 + k + hh, y0); g.lineTo(x0 + k, y0 + hh); g.stroke(); }
      g.strokeRect(x0, y0, ww, hh);
    }
  };
  opening(win.ground[0], win.ground[1], win.ground[2], win.ground[3]);
  // upstairs: shuttered windows (or small screens) and a middle opening
  const shutters = (cx: number, base: number, w0: number, h0: number) => {
    if (style.windows === 'small') { opening(cx, base, w0, h0); return; }
    const x0 = cx * PX, w = w0 * PX, h = h0 * PX, y = yOf(base + h0);
    g.fillStyle = '#2a2a2a'; g.fillRect(x0 - w / 2, y, w, h);
    g.fillStyle = joinery; g.fillRect(x0 - w / 2 - 0.3 * PX, y, 0.3 * PX, h); g.fillRect(x0 + w / 2, y, 0.3 * PX, h);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let k = 4; k < h - 2; k += 7) { g.fillRect(x0 - w / 2 - 0.28 * PX, y + k, 0.26 * PX, 2); g.fillRect(x0 + w / 2 + 0.02 * PX, y + k, 0.26 * PX, 2); }
    g.fillStyle = style.frame; g.fillRect(x0 - w / 2 - 0.34 * PX, y + h, w + 0.68 * PX, 5);
  };
  for (const [cx, base, w, h] of win.up) shutters(cx, base, w, h);
  opening(win.upMid[0], win.upMid[1], win.upMid[2], win.upMid[3]);
  // small high vent
  g.fillStyle = joinery; g.fillRect(7.6 * PX - 14, yOf(2.4), 28, 22); g.fillStyle = '#20262c'; g.fillRect(7.6 * PX - 9, yOf(2.4) + 5, 18, 12);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 9, 1 / 9.6);
  t.anisotropy = anisotropy;
  return t;
}

/** Night glow for a house wall: some windows lit warm (same layout as wallTexture), the rest dark. */
function wallNightTexture(style: HouseStyle) {
  const PX = 64, W = 9 * PX, H = Math.round(9.6 * PX);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const yOf = (m: number) => H - m * PX;
  const lit = ([cx, base, w, h]: number[], bars: boolean) => {
    const x0 = cx * PX - (w * PX) / 2, y0 = yOf(base + h), ww = w * PX, hh = h * PX;
    const grad = g.createRadialGradient(x0 + ww / 2, y0 + hh / 2, 2, x0 + ww / 2, y0 + hh / 2, ww * 0.7);
    grad.addColorStop(0, '#ffd08a'); grad.addColorStop(1, '#e8892e');
    g.fillStyle = grad; g.fillRect(x0 + 6, y0 + 6, ww - 12, hh - 12);
    if (bars) { g.fillStyle = '#000'; for (let xx = x0 + 10; xx < x0 + ww - 4; xx += 12) g.fillRect(xx - 1.5, y0, 3, hh); }
  };
  const win = wallWindows(style), bars = style.windows !== 'small';
  lit(win.ground, bars);
  lit(win.up[0], false);
  lit(win.upMid, bars);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 9, 1 / 9.6);
  return t;
}

/** Sea surface ripples: tileable normal map built from a few summed waves. */
function waterNormals() {
  const S = 256, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!, img = g.createImageData(S, S);
  const waves = Array.from({ length: 9 }, (_, i) => ({ kx: Math.round(Math.cos(i * 2.3) * (2 + i)), kz: Math.round(Math.sin(i * 2.3) * (2 + i)), a: 1 / (1 + i * 0.6), p: i * 1.7 }));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let dx = 0, dz = 0;
    for (const w of waves) { const ph = ((w.kx * x + w.kz * y) / S) * Math.PI * 2 + w.p; const d = Math.cos(ph) * w.a; dx += d * w.kx; dz += d * w.kz; }
    const k = (y * S + x) * 4;
    img.data[k] = 128 + dx * 4; img.data[k + 1] = 128 + dz * 4; img.data[k + 2] = 255; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 18, 1 / 18);
  return t;
}

interface TexSet { id: string; tile: number; tint: string; rough?: number; weather: WeatherOpts }

const SETS: Partial<Record<MatKey, TexSet>> = {
  facade: { id: 'sandstone_blocks_05', tile: 3.4, tint: '#ffd9a6', weather: { variation: 0.6, grime: 0.55, streaks: 0.6, dust: 0.45, bleach: 0.35, blockScale: 1.1 } },
  block: { id: 'sandstone_blocks_05', tile: 2.2, tint: '#f7d9ac', weather: { variation: 0.5, grime: 0.35, streaks: 0.25, dust: 0.65, blockScale: 0.9 } },
  rubble: { id: 'medieval_blocks_05', tile: 3.2, tint: '#ffe2bb', weather: { variation: 0.45, grime: 0.4, streaks: 0.3, dust: 0.7, blockScale: 1.4 } },
  rock: { id: 'rock_surface', tile: 3.5, tint: '#ffe4bd', weather: { variation: 0.4, grime: 0.3, streaks: 0, dust: 0.6 } },
  sand: { id: 'dense_sand', tile: 5.0, tint: '#ffe2b8', weather: { variation: 0.3, patina: 0.08, grime: 0, streaks: 0, dust: 0.5, bleach: 0, blockScale: 5, dustColor: '#f3dcb4' } },
  asphalt: { id: 'worn_asphalt', tile: 6.0, tint: '#d2ccc2', weather: { variation: 0.3, patina: 0.1, grime: 0, streaks: 0, dust: 0.25, bleach: 0, blockScale: 8, dustColor: '#d9c7a6' } },
  // bare ground between houses: packed sandy earth, as in satellite views of the town
  urban: { id: 'dense_sand', tile: 6.0, tint: '#e6cfaa', weather: { variation: 0.25, patina: 0.12, grime: 0, streaks: 0, dust: 0.3, bleach: 0, blockScale: 14, dustColor: '#e2cba5' } },
  fields: { id: 'dense_sand', tile: 9.0, tint: '#e9c9a0', weather: { variation: 0.5, patina: 0.2, grime: 0, streaks: 0, dust: 0, bleach: 0, blockScale: 30 } },
  // the cobbled lanes of the old villages and medinas
  cobbles: { id: 'cobblestone_floor_08', tile: 2.4, tint: '#f6e7cf', weather: { variation: 0.35, patina: 0.15, grime: 0, streaks: 0, dust: 0.45, bleach: 0, blockScale: 3, dustColor: '#e9d6b4' } },
  paving: { id: 'sandstone_blocks_05', tile: 2.0, tint: '#f1dcbc', weather: { variation: 0.45, patina: 0.2, grime: 0, streaks: 0, dust: 0.55, bleach: 0, blockScale: 2.5 } },
  ground: { id: 'dense_sand', tile: 7.0, tint: '#ffe4c2', weather: { variation: 0.35, patina: 0.1, grime: 0, streaks: 0, dust: 0.35, bleach: 0, blockScale: 9, dustColor: '#efd8b2' } },
};

export class Materials {
  private cache = new Map<MatKey, THREE.Material>();
  /** House walls with lit windows at night (the site sets their glow). */
  readonly nightWalls: THREE.MeshStandardMaterial[] = [];
  private loader = new THREE.TextureLoader();
  constructor(private base: string, private anisotropy: number) {}

  private tex(url: string, tile: number, srgb: boolean) {
    const t = this.loader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / tile, 1 / tile);
    t.anisotropy = this.anisotropy;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  get(key: MatKey): THREE.Material {
    if (key === 'attic') return this.get('facade');
    if (key === 'plazaBlock') return this.get('block');
    if (key === 'townSteel') return this.get('steel');
    if (key === 'plasterFar') return this.get('plaster');
    if (key === 'roofFar') return this.get('roof');
    if (key === 'whitewashFar') return this.get('whitewash');
    if (key === 'whitewash') return this.get('wall:sbs:0');
    if (key.startsWith('wall:') && key.endsWith(':Far')) return this.get(key.slice(0, -4) as MatKey);
    let m = this.cache.get(key);
    if (m) return m;
    const set = SETS[key];
    if (set) {
      const dir = `${this.base}textures/${set.id}/`;
      const arm = this.tex(dir + 'arm.jpg', set.tile, false);
      m = new THREE.MeshStandardMaterial({
        color: set.tint,
        map: this.tex(dir + 'diff.jpg', set.tile, true),
        normalMap: this.tex(dir + 'nor.jpg', set.tile, false),
        normalScale: new THREE.Vector2(1.1, 1.1),
        roughnessMap: arm,
        aoMap: arm,
        aoMapIntensity: 0.9,
        roughness: set.rough ?? 1,
        metalness: 0,
      });
      weather(m as THREE.MeshStandardMaterial, set.weather);
    } else if (key === 'plaster') {
      m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, vertexColors: true, map: facadeTexture(this.anisotropy), ...this.relief('plaster') });
    } else if (key.startsWith('wall:')) {
      // a house wall in a town's style (src/viewer/house-styles.ts), with real plaster relief from a scanned texture
      const [, id, n] = key.split(':');
      const style = HOUSE_STYLES[id] ?? HOUSE_STYLES.sbs;
      const joinery = style.joinery[Math.min(style.joinery.length - 1, Number(n) || 0)];
      const w = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, vertexColors: true, map: wallTexture(this.anisotropy, style, joinery),
        emissive: '#ffffff', emissiveMap: wallNightTexture(style), emissiveIntensity: 0, ...this.relief(style.relief) }); // windows light up at night (set by the site)
      this.nightWalls.push(w);
      m = w;
    } else if (key === 'woodwork') {
      // painted wooden balconies and screens: plank relief, colour from the vertex colours
      const dir = `${this.base}textures/distressed_painted_planks/`;
      m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.8, normalMap: this.tex(dir + 'nor.jpg', 1.4, false), normalScale: new THREE.Vector2(1.2, 1.2) });
    } else if (key === 'terrain') {
      const dir = `${this.base}textures/dense_sand/`;
      m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 1, map: this.tex(dir + 'diff.jpg', 6, true), normalMap: this.tex(dir + 'nor.jpg', 6, false) });
    } else if (key === 'water') {
      m = new THREE.MeshStandardMaterial({ color: '#135a78', roughness: 0.3, metalness: 0, normalMap: waterNormals(), normalScale: new THREE.Vector2(0.5, 0.5), envMapIntensity: 0.3 });
    } else if (key === 'roof') {
      m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, vertexColors: true });
    } else if (key === 'glass') {
      m = new THREE.MeshStandardMaterial({ color: '#cfe3ea', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false });
    } else if (key === 'fence') {
      m = new THREE.MeshStandardMaterial({ map: fenceTexture(), alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 });
    } else if (key === 'steel') {
      m = new THREE.MeshStandardMaterial({ color: '#3a3d40', roughness: 0.45, metalness: 0.8 });
    } else if (key === 'stage') {
      m = new THREE.MeshStandardMaterial({ color: '#1d1e22', roughness: 0.7 });
    } else if (key === 'palmTrunk') {
      m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, map: palmBarkTexture(), bumpMap: palmBarkTexture(), bumpScale: 2 });
    } else {
      m = new THREE.MeshStandardMaterial({ color: '#56653a', roughness: 0.85, side: THREE.DoubleSide });
    }
    this.cache.set(key, m);
    return m;
  }

  /** Surface relief of plastered walls (normal and roughness from a scanned texture; UVs in metres). */
  private relief(kind: 'plaster' | 'clay') {
    const dir = `${this.base}textures/${kind === 'clay' ? 'clay_plaster' : 'painted_plaster_wall'}/`;
    return { normalMap: this.tex(dir + 'nor.jpg', 2.6, false), normalScale: new THREE.Vector2(0.9, 0.9), roughnessMap: this.tex(dir + 'arm.jpg', 2.6, false) };
  }

  dispose() { this.cache.forEach((m) => m.dispose()); }
}
