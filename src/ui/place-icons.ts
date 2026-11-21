/**
 * Map icons for the places that are cards only: a white pictogram for the kind of place (beach, oasis,
 * fort, lighthouse…) drawn on a disc in the colour of its category. Each fits a 24 × 24 box centred on (0, 0).
 */
const NS = 'http://www.w3.org/2000/svg';
const W = '#ffffff';
type Part = [tag: 'path' | 'rect' | 'circle', attrs: Record<string, string | number>];
/** Filled shape. */
const F = (d: string): Part => ['path', { d, fill: W }];
/** Line. */
const L = (d: string, w = 1.7): Part => ['path', { d, fill: 'none', stroke: W, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }];
const R = (x: number, y: number, w: number, h: number): Part => ['rect', { x, y, width: w, height: h, fill: W }];
const C = (cx: number, cy: number, r: number): Part => ['circle', { cx, cy, r, fill: W }];
/** A hole in a white shape, painted in the disc's colour. */
const H = (d: string): Part => ['path', { d, fill: 'var(--c)' }];
const wave = (y: number) => L(`M-9,${y} q2.25,-2 4.5,0 t4.5,0 t4.5,0 t4.5,0`, 1.6);

const KINDS: Record<string, Part[]> = {
  ruins: [R(-10, 7, 20, 2.2), R(-8.4, -1, 3.2, 8), R(-1.6, -6, 3.2, 13), R(5.2, 2, 3.2, 5), R(-3.4, -8.4, 9.4, 2.2), F('M-8.4,-1 l1.6,-1.6 l1.6,1.6Z')],
  fort: [F('M-9,8 V-1 h2 v-2 h2 v2 h2 v-2 h1.4 V-9 h2 v2 h1.6 v-2 h2 V-1 h1 v-2 h2 v2 h1.4 V8Z'), H('M-1.6,8 v-3.6 a1.6,1.6 0 0 1 3.2,0 V8Z')],
  gate: [F('M-9,8 V-6 h2 v-2 h2 v2 h2 v-2 h2 v2 h2 v-2 h2 v2 h2 v-2 h1 V8Z'), H('M-3.6,8 V0.4 a3.6,3.6 0 0 1 7.2,0 V8Z')],
  minaret: [R(-1.2, -6.4, 7, 14.4), C(2.3, -8, 2), R(1.9, -11.4, 0.8, 2), F('M-9,8 V2.4 h7 V8Z M-8.4,2.4 a2.9,2.9 0 0 1 5.8,0Z'), H('M1.6,-3 h1.4 v2.4 h-1.4Z')],
  temple: [F('M-10,-3.6 L0,-9.6 L10,-3.6Z'), R(-10, -3, 20, 1.8), R(-8, -0.6, 2.4, 7.4), R(-3.4, -0.6, 2.4, 7.4), R(1, -0.6, 2.4, 7.4), R(5.6, -0.6, 2.4, 7.4), R(-10.5, 7, 21, 2.2)],
  arch: [F('M-9,9 V-5 h18 V9Z'), R(-10, -8.4, 20, 3), H('M-4,9 V0.4 a4,4 0 0 1 8,0 V9Z')],
  museum: [F('M-3,-9 h6 v2 l3,3 c3,3 3,9 0,12 v1 h-12 v-1 c-3,-3 -3,-9 0,-12 l3,-3Z'), L('M-3,-6 c-4,0 -5,3 -4,5 M3,-6 c4,0 5,3 4,5', 1.4), H('M-5,1 h10 v1.4 h-10Z')],
  village: [F('M-10,9 C-7,0 -3,-3 0,-3 C4,-3 7,1 10,9Z'), R(-4.6, -7.6, 4, 4.4), R(0.6, -9.6, 4.2, 6.4), H('M-3.4,-5.4 h1.6 v2.2 h-1.6Z M2,-7 h1.4 v2 h-1.4Z')],
  beach: [F('M-8,-2.4 A8.4,7 0 0 1 8.6,-4.4 Z'), L('M0.4,-3.4 L3,8', 1.7), wave(9)],
  marina: [F('M-1,-10 V3 h-8Z'), F('M1,-8 V3 h7Z'), F('M-10,5 h20 l-3,4 h-14Z')],
  island: [F('M-9,8 C-6,3 6,3 9,8Z'), L('M0,5 C0.6,1 0.4,-3 -1,-6', 1.7), F('M-1,-6 c-4,-2 -7,0 -7,2 c3,-1.4 5,-1 7,-2Z M-1,-6 c3,-3 6,-2 7,0 c-3,-0.6 -5,-0.4 -7,0Z M-1,-6 c-1,-3 1,-5 3,-5 c-1.6,1.4 -2.4,3 -3,5Z')],
  spa: [L('M-5,-2 c-2,-2.4 2,-4.4 0,-7.4 M0,-2 c-2,-2.4 2,-4.4 0,-7.4 M5,-2 c-2,-2.4 2,-4.4 0,-7.4', 1.6), F('M-9,2 h18 a2,2 0 0 1 0,0 c0,4 -4,7 -9,7 c-5,0 -9,-3 -9,-7Z')],
  diving: [F('M-9,0 C-5,-6 4,-6 7,0 C4,6 -5,6 -9,0Z M6,0 L10.5,-4.4 V4.4Z'), H('M-5.4,-1.6 a1.2,1.2 0 1 0 0.01,0Z')],
  birds: [L('M-9,-4 q2.2,-3 4.4,0 q2.2,-3 4.4,0 M1.6,-7 q2,-2.6 4,0 q2,-2.6 4,0', 1.6), wave(4), wave(8.4)],
  forest: [F('M-4,-10 L-10,2 h4 L-9,6 h10 l-3,-4 h4Z'), R(-5, 6, 2, 3.4), F('M5,-6 L0,4 h3 L1,7 h8 l-2,-3 h3Z'), R(4, 7, 2, 2.4)],
  falcon: [F('M0,-4 C-3,-7 -7,-7 -10.5,-4 C-7,-4 -4,-2 -2,1 L-1,6 L0,9 L1,6 L2,1 C4,-2 7,-4 10.5,-4 C7,-7 3,-7 0,-4Z'), C(0, -5.6, 1.8)],
  cape: [F('M-2.6,8 L-1.6,-5 h3.2 L2.6,8Z'), F('M-3,-5.4 h6 v-1.6 h-6Z M-2,-7 h4 l-2,-3Z'), H('M-1.9,-1 h3.8 v1.6 h-3.8Z M-2.2,3 h4.4 v1.6 h-4.4Z'), L('M4,-6 l5,-2 M4,-3.4 l5,0.6', 1.3), wave(9.4)],
  mountain: [F('M-10.5,8 L-3,-6 L1,0.6 L4,-3 L10.5,8Z'), H('M-3,-6 L-5.4,-1.6 L-3.6,-2.6 L-2.4,-1.2 L-0.8,-2.6Z')],
  savanna: [F('M-9,-3 C-9,-7 9,-7 9,-3 C5,-2 -5,-2 -9,-3Z'), L('M0,-2.4 V9 M0,3 L-4,-2.4 M0,1 L4,-2.4', 1.6), L('M-10,9 H10', 1.4)],
  mesa: [F('M-10.5,8 L-7,1 L-6,-3 L6,-3 L7,1 L10.5,8Z'), L('M-6,-3 H6', 1.2), H('M-4,1 h8 v1 h-8Z')],
  oasis: [L('M1,9 C1.6,4 1,-1 -0.6,-4', 1.9), F('M-0.6,-4 c-4,-2.4 -8,-0.6 -8.6,2 c3.2,-1.6 6,-1.4 8.6,-2Z M-0.6,-4 c3,-3.6 7.6,-2.4 8.4,0.2 c-3,-1 -5.6,-0.8 -8.4,-0.2Z M-0.6,-4 c-1.4,-3.6 0.6,-6.4 3.6,-6.6 c-1.8,1.6 -2.8,3.6 -3.6,6.6Z M-0.6,-4 c-3.4,-1 -6.2,-4.4 -5,-6.4 c1.2,2.4 2.6,4.2 5,6.4Z'), F('M-10,9 C-6,6 6,6 10,9Z')],
  waterfall: [F('M-10.5,-9.5 H2.6 V-5.6 H-3.4 V9.5 H-10.5Z'), L('M2.6,-7.6 C7.4,-7 8.4,-2 8.2,5.4 M1.4,-5 C4.2,-3.6 4.6,0.4 4.4,5.4', 1.8), L('M-1.6,8.6 q2,-2 4,0 t4,0 t4,0', 1.5)],
  canyon: [F('M-10.5,-9 L-3.4,-9 L-1.2,9.5 L-10.5,9.5Z M10.5,-9 L3.4,-9 L1.2,9.5 L10.5,9.5Z'), H('M-10.5,-5 L-3,-5.6 L-2.8,-4.4 L-10.5,-3.6Z M-10.5,1 L-2.2,0.2 L-2,1.4 L-10.5,2.4Z M10.5,-3 L2.7,-3.6 L2.5,-2.4 L10.5,-1.6Z M10.5,3.4 L1.9,2.6 L1.7,3.8 L10.5,4.8Z')],
  saltlake: [F('M-10,3 C-10,-2 10,-2 10,3 C10,8 -10,8 -10,3Z'), H('M-4,2.6 l1.4,-2 l1.4,2 l-1.4,2Z M3,4.2 l1,-1.4 l1,1.4 l-1,1.4Z'), F('M2,-10 l1,3 l3,1 l-3,1 l-1,3 l-1,-3 l-3,-1 l3,-1Z M-6,-8 l0.6,1.8 l1.8,0.6 l-1.8,0.6 l-0.6,1.8 l-0.6,-1.8 l-1.8,-0.6 l1.8,-0.6Z')],
  camel: [F('M-9,1 c0,-3 2,-5 4,-5 c1.6,0 2,-2 4,-2 c2,0 2.4,2 3.6,2.6 c1,0.4 2,-2.4 2,-4.4 c0,-1.4 1,-2.2 2.2,-2 l2.2,0.6 l-0.4,1.4 h-1.4 c0,3 -0.6,6 -2.6,8.6 c-0.4,0.6 -0.6,1.4 -0.6,2.4 V9 h-1.4 V3.4 h-1 V9 h-1.4 V3.6 c-2.4,0.4 -4.6,0.4 -6.4,0 V9 h-1.4 V3 h-1 V9 h-1.4Z')],
  dunes: [C(5, -5, 3), F('M-10.5,8 C-7,0 -3,-1 1,4 C3,1 7,0 10.5,5 V8Z'), H('M-6,6.4 c1.6,-2 3,-2.6 4.6,-1.6')],
  film: [F('M-9,-2 H9 V9 H-9Z'), F('M-9.4,-3.4 L8.2,-8.2 L8.8,-5.6 L-8.8,-0.8Z'), H('M-5.6,-2.4 l-1.6,-2.6 l2.4,-0.6 l1.6,2.6Z M0.4,-4 l-1.6,-2.6 l2.4,-0.6 l1.6,2.6Z M6.2,-5.6 l-1.4,-2.2 l1.6,-0.4 l1.2,2.2Z')],
  train: [F('M-7,-9 h14 a2,2 0 0 1 2,2 V5 a2,2 0 0 1 -2,2 h-14 a2,2 0 0 1 -2,-2 V-7 a2,2 0 0 1 2,-2Z'), H('M-6,-6.6 h12 v5 h-12Z'), H('M-5.6,2 a1.4,1.4 0 1 0 0.01,0Z M5.6,2 a1.4,1.4 0 1 0 0.01,0Z'), L('M-5,8 l-3,2.6 M5,8 l3,2.6', 1.5)],
};

/** The kind of each place. */
export const PLACE_KIND: Record<string, string> = {
  kerkouane: 'ruins', monastir: 'fort', mahdia: 'gate', 'le-kef': 'fort', testour: 'minaret', zaghouan: 'temple', 'thuburbo-majus': 'temple',
  oudhna: 'ruins', makthar: 'arch', bardo: 'museum', chenini: 'village', chemtou: 'ruins',
  hammamet: 'beach', 'mahdia-beach': 'beach', kelibia: 'beach', tabarka: 'diving', 'ghar-el-melh': 'beach', 'raf-raf': 'beach', 'la-marsa': 'beach',
  kantaoui: 'marina', kerkennah: 'island', 'djerba-beach': 'beach', zarzis: 'beach', korbous: 'spa',
  ichkeul: 'birds', 'ain-draham': 'forest', 'el-haouaria': 'falcon', 'cape-angela': 'cape', chambi: 'mountain', 'bou-hedma': 'savanna', zembra: 'island', jugurtha: 'mesa',
  tozeur: 'oasis', nefta: 'oasis', chebika: 'waterfall', tamerza: 'waterfall', mides: 'canyon', 'chott-el-djerid': 'saltlake', douz: 'camel', 'ksar-ghilane': 'dunes', 'ong-jemel': 'film', selja: 'train',
};

export function placeIcon(id: string): SVGGElement {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'picon');
  for (const [tag, attrs] of KINDS[PLACE_KIND[id] ?? 'ruins']) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    g.append(el);
  }
  return g;
}
