/**
 * Small drawn icons of the twelve monuments built in 3D, for their pins on the home map.
 * Each fits in a 24 × 24 box centred on (0, 0), drawn in stone, ink and the blue of Sidi Bou Said.
 */
const NS = 'http://www.w3.org/2000/svg';
const STONE = '#d8a867', SAND = '#ecd2a0', INK = '#5a2f17', BLUE = '#1f6fb5', WHITE = '#ffffff', GREEN = '#3f8a5a', DARK = '#3a2214';

type Part = [tag: 'path' | 'rect' | 'circle' | 'ellipse', attrs: Record<string, string | number>];
const P = (d: string, fill = STONE, stroke = INK, w = 1.1): Part => ['path', { d, fill, stroke, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }];
const R = (x: number, y: number, w: number, h: number, fill = STONE, stroke = INK, sw = 1.1): Part => ['rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': sw }];
/** A small arched opening (dark), as in walls of arcades. */
const arch = (x: number, y: number, w: number, h: number, fill = DARK): Part =>
  P(`M${x - w / 2},${y + h} L${x - w / 2},${y + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w / 2},${y + w / 2} L${x + w / 2},${y + h}Z`, fill, 'none', 0);

const ICONS: Record<string, Part[]> = {
  // the amphitheatre: a curved wall with three tiers of arches
  'el-jem': [
    P('M-10.5,7.5 L-10.5,-4 Q0,-9.5 10.5,-4 L10.5,7.5Z'),
    P('M-10.5,0.6 Q0,-4.6 10.5,0.6 M-10.5,4.2 Q0,-0.8 10.5,4.2', 'none', INK, 0.8),
    ...[-7.5, -3.8, 0, 3.8, 7.5].flatMap((x) => [arch(x, -4.2 + Math.abs(x) * 0.17, 2, 3.4), arch(x, 0.2 + Math.abs(x) * 0.17, 2, 3.4), arch(x, 4.6, 2.2, 2.9)]),
  ],
  // Sidi Bou Said: a white house with a dome, a blue arched door and a blue window
  'sidi-bou-said': [
    P('M-6,-1.6 A6,6 0 0 1 6,-1.6Z', WHITE),
    R(-9.5, -1.6, 19, 9.6, WHITE),
    P('M-2.6,8 L-2.6,2.6 A2.6,2.6 0 0 1 2.6,2.6 L2.6,8Z', BLUE, INK, 0.8),
    R(-7.6, 0.6, 2.8, 2.8, BLUE, INK, 0.7), R(4.8, 0.6, 2.8, 2.8, BLUE, INK, 0.7),
    R(-0.5, -11, 1, 3.6, INK, 'none', 0),
  ],
  // Carthage: columns of the Antonine Baths under their entablature
  carthage: [
    R(-10.5, 7, 21, 2.4, SAND), R(-10, -8.2, 20, 3),
    ...[-6.6, 0, 6.6].flatMap((x) => [R(x - 1.4, -5.2, 2.8, 12.2, SAND), R(x - 2.1, -5.8, 4.2, 1.3, STONE, INK, 0.8)]),
  ],
  // the Medina of Tunis: the Zitouna minaret with its lozenge panels and lantern
  'tunis-medina': [
    R(-3.6, -7, 7.2, 16, STONE),
    P('M-3.6,-4 L0,-1 L3.6,-4 M-3.6,-1 L0,2 L3.6,-1 M-3.6,2 L0,5 L3.6,2', 'none', INK, 0.7),
    R(-4.4, -8.4, 8.8, 1.6, SAND), R(-1.9, -12, 3.8, 3.6, STONE),
    ['circle', { cx: 0, cy: -13, r: 1.6, fill: GREEN, stroke: INK, 'stroke-width': 0.8 }],
    R(-10.5, 3.6, 6.4, 5.4, WHITE, INK, 0.9), R(4.1, 3.6, 6.4, 5.4, WHITE, INK, 0.9),
  ],
  // Dougga: the Capitol, a pediment on four columns over steps
  dougga: [
    P('M-10,-4.6 L0,-10.6 L10,-4.6Z', SAND), R(-10, -4.6, 20, 2.4),
    ...[-7.4, -2.5, 2.5, 7.4].map((x) => R(x - 1.2, -2.2, 2.4, 8.4, SAND)),
    R(-11, 6.2, 22, 1.6, STONE), R(-12, 7.8, 24, 1.8, SAND),
  ],
  // Bulla Regia: an underground house, columns under the ground line and a light well
  'bulla-regia': [
    P('M-12,-3 L-4.4,-3 M4.4,-3 L12,-3', 'none', GREEN, 2.2),
    R(-11, -2, 22, 11, SAND),
    P('M-8,9 L-8,1.5 A8,5.5 0 0 1 8,1.5 L8,9Z', DARK, 'none', 0),
    ...[-4.4, 0, 4.4].map((x) => R(x - 0.9, 0.4, 1.8, 8.6, WHITE, INK, 0.7)),
    P('M-4.4,-3 L-4.4,-6 M4.4,-3 L4.4,-6', 'none', INK, 1),
  ],
  // Kairouan: the three-tiered minaret of the Great Mosque
  kairouan: [
    R(-6.8, -1.6, 13.6, 10.6), R(-4.6, -6.4, 9.2, 4.8), R(-2.8, -9.8, 5.6, 3.4),
    P('M-2.8,-9.8 A2.8,2.8 0 0 1 2.8,-9.8Z', SAND),
    arch(0, 3, 2.6, 6), arch(-3.6, -5.2, 1.4, 2.8), arch(3.6, -5.2, 1.4, 2.8),
  ],
  // Sousse: the ribat's watchtower above its crenellated wall
  sousse: [
    R(-10.5, 1, 21, 8),
    ...[-9.5, -6, 6, 9.5].map((x) => R(x - 1, -1.2, 2, 2.2)),
    R(-3.8, -9, 7.6, 18),
    ...[-2.6, 0, 2.6].map((x) => R(x - 0.8, -11, 1.6, 2)),
    arch(0, 4.2, 3, 4.8), arch(0, -5.4, 1.4, 2.6),
  ],
  // Sbeitla: the three temples of the forum side by side
  sbeitla: [
    ...[-7, 0, 7].flatMap((x, i) => {
      const y = i === 1 ? -2 : 0;
      return [P(`M${x - 3.6},${y - 4} L${x},${y - 7.4} L${x + 3.6},${y - 4}Z`, SAND), R(x - 3.6, y - 4, 7.2, 1.6), R(x - 2.8, y - 2.4, 1.6, 9.4 - y, SAND, INK, 0.8), R(x + 1.2, y - 2.4, 1.6, 9.4 - y, SAND, INK, 0.8)];
    }),
    R(-11.5, 7, 23, 2, STONE),
  ],
  // Matmata: a pit house seen from above, rooms opening on its round courtyard
  matmata: [
    ['circle', { cx: 0, cy: 0, r: 10.5, fill: SAND, stroke: INK, 'stroke-width': 1.1 }],
    ['circle', { cx: 0, cy: 0, r: 6, fill: '#b98a52', stroke: INK, 'stroke-width': 1 }],
    ...[0, 72, 144, 216, 288].map((a): Part => { const r = (a * Math.PI) / 180; return ['circle', { cx: Math.cos(r) * 6, cy: Math.sin(r) * 6, r: 1.4, fill: DARK }]; }),
    P('M6,0 L10.5,0', 'none', DARK, 2.2),
  ],
  // Djerba: a white domed mosque beside a palm
  djerba: [
    P('M5.6,9 C5.2,3 6,-2 7.6,-6', 'none', '#7a5230', 1.5),
    P('M7.6,-6 C4.6,-8 2.4,-6.4 1.8,-4.6 M7.6,-6 C9.6,-9 12,-7.6 12.4,-5.8 M7.6,-6 C6.6,-10 8.4,-11.6 10,-11 M7.6,-6 C4.2,-5 3.6,-2.4 4,-1', 'none', GREEN, 1.6),
    P('M-10,9 L-10,0 L3.6,0 L3.6,9Z', WHITE),
    P('M-7.6,0 A4,4 0 0 1 0.4,0Z', WHITE),
    R(-4.2, -8.4, 1.6, 4.6, WHITE, INK, 0.8),
    P('M-5,9 L-5,5 A1.8,1.8 0 0 1 -1.4,5 L-1.4,9Z', BLUE, 'none', 0),
  ],
  // Ksar Ouled Soltane: ghorfas, vaulted cells stacked four high
  'ksar-ouled-soltane': [
    ...[0, 1, 2].flatMap((r) => [-1, 0, 1].map((c): Part => {
      const x = c * 6.6, y = 4.4 - r * 5.4;
      return P(`M${x - 3.1},${y + 4.4} L${x - 3.1},${y} A3.1,2.6 0 0 1 ${x + 3.1},${y} L${x + 3.1},${y + 4.4}Z`, c === 0 && r === 1 ? SAND : STONE);
    })),
    ...[0, 1, 2].map((r) => R(-0.8, 6 - r * 5.4, 1.6, 2, DARK, 'none', 0)),
  ],
};

export function monumentIcon(id: string): SVGGElement {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'micon');
  for (const [tag, attrs] of ICONS[id] ?? []) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    g.append(el);
  }
  return g;
}
