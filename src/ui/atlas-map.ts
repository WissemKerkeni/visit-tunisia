/**
 * The home map as an interactive SVG: Tunisia's real relief (NASA Blue Marble + hill shading), lakes and
 * salt flats, region names, pins by category, animals where they live, transport lines, and small moving
 * things (boats, a caravan, flamingos, clouds). Zoom with the wheel, a pinch, a double click or the
 * buttons; drag to move once zoomed in. Pins and labels keep their size on screen at every zoom.
 */
import { AROUND, LAKES, MEDJERDA, RELIEF } from '../content/atlas-geo';
import { AIRPORTS, ANIMALS, LINES, REGIONS, STATIONS, type Airport, type Animal, type Line } from '../content/atlas';
import { CLIMATE } from '../content/climate';
import type { Cat } from '../content/places';
import { MAP_H, MAP_W, NEIGHBOUR_PATHS, TUNISIA_PATH, project } from '../content/tunisia-map';
import { t, tr, type T3 } from '../i18n';
import { monumentIcon } from './monument-icons';
import { placeIcon } from './place-icons';

const BASE = import.meta.env.BASE_URL;
const NS = 'http://www.w3.org/2000/svg';
type XY = [number, number];
type LL = [number, number];

export interface MapItem { id: string; walk: boolean; cats: Cat[]; lat: number; lon: number; name: T3; label: string; left?: boolean; dy?: number }
export interface Insets { l: number; t: number; r: number; b: number }
export interface AtlasOpts {
  items: MapItem[];
  rtl: boolean;
  reduced: boolean;
  intro: boolean;
  /** Screen space (px from each edge of the map element) covered by panels: the country is framed in what is left. */
  free: () => Insets;
  onPick: (id: string, how: 'hover' | 'click') => void;
  onAnimal: (a: Animal) => void;
  onAirport: (a: Airport) => void;
  onLine: (l: Line) => void;
  onTown: (id: string) => void;
  onView?: (k: number, pxPerUnit: number) => void;
}
export interface AtlasMap {
  el: SVGSVGElement;
  home(): void;
  zoomBy(f: number): void;
  flyTo(lat: number, lon: number, k?: number): void;
  fitTo(pts: LL[]): void;
  setActive(id: string | null): void;
  setFilter(cats: Set<Cat> | null): void;
  setLayer(name: 'wildlife' | 'transport' | 'weather', on: boolean): void;
  /** Weather chips by town id: an icon, a temperature and, for the coast, the sea temperature. */
  setWeather(v: Map<string, { icon: string; t: number; sea?: number | null }>): void;
  setRoute(pts: LL[] | null): void;
  layout(): void;
  destroy(): void;
}

export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...kids: (SVGElement | string)[]) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const k of kids) el.append(k);
  return el;
}
const f1 = (p: XY) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
/** A smooth curve through points (Catmull-Rom as cubic Béziers). */
function smooth(pts: XY[]) {
  if (pts.length < 3) return 'M' + pts.map(f1).join('L');
  let d = `M${f1(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f1([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${f1([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${f1(p2)}`;
  }
  return d;
}
const P = (ll: LL): XY => project(ll[0], ll[1]);
const fmtDeg = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(0)}°${v >= 0 ? pos : neg}`;

/** Small drawn animals for the two that have no emoji (a stork and an oryx). */
export function animalGlyph(id: string): SVGElement | null {
  if (id === 'stork') return svg('g', { class: 'glyph' },
    svg('path', { d: 'M-1,3 L-1.4,8 M1.2,3 L1.8,8', stroke: '#e0523a', 'stroke-width': 0.9, fill: 'none' }),
    svg('ellipse', { cx: -0.5, cy: 0.6, rx: 4.6, ry: 3, fill: '#fff' }),
    svg('path', { d: 'M-5.2,0.2 L-1,-0.6 L-2.2,2.6Z', fill: '#1d1d1d' }),
    svg('path', { d: 'M3,-0.6 L4.6,-6', stroke: '#fff', 'stroke-width': 1.7, 'stroke-linecap': 'round', fill: 'none' }),
    svg('circle', { cx: 4.7, cy: -6.4, r: 1.5, fill: '#fff' }),
    svg('path', { d: 'M5.6,-6.4 L9.4,-5.2', stroke: '#e0523a', 'stroke-width': 1.1, 'stroke-linecap': 'round' }));
  if (id === 'oryx') return svg('g', { class: 'glyph' },
    svg('path', { d: 'M-3.6,3 L-3.8,7.4 M-1.6,3 L-1.6,7.4 M2.2,3 L2.2,7.4 M3.8,3 L4.2,7.4', stroke: '#f3ead8', 'stroke-width': 0.9, fill: 'none' }),
    svg('ellipse', { cx: 0, cy: 1, rx: 5, ry: 2.9, fill: '#f6efe0' }),
    svg('path', { d: 'M3.6,0 L5.4,-3.4 L7.2,-2.2 L5.6,0.6Z', fill: '#c98a52' }),
    svg('path', { d: 'M5.6,-3.2 C3.6,-7.6 0,-9 -4,-8.4 M6.2,-3 C4.6,-6.6 1.4,-8 -2,-7.6', stroke: '#3a2a1c', 'stroke-width': 0.7, fill: 'none', 'stroke-linecap': 'round' }));
  return null;
}

export function createAtlasMap(o: AtlasOpts): AtlasMap {
  const el = svg('svg', { class: `omap${o.intro && !o.reduced ? ' intro' : ''}`, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': t('mapTitle') });

  // ------------------------------------------------------------------ layers
  el.append(svg('defs', {},
    svg('linearGradient', { id: 'landGrad', x1: 0, y1: 0, x2: 0, y2: 1 },
      svg('stop', { offset: '0', 'stop-color': '#a39a63' }), svg('stop', { offset: '0.45', 'stop-color': '#c9a873' }), svg('stop', { offset: '1', 'stop-color': '#dfa962' })),
    svg('radialGradient', { id: 'cloudGrad' },
      svg('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.5' }), svg('stop', { offset: '0.6', 'stop-color': '#fff', 'stop-opacity': '0.16' }), svg('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' })),
    svg('clipPath', { id: 'tnClip' }, svg('path', { d: TUNISIA_PATH })),
    svg('clipPath', { id: 'nbClip' }, ...NEIGHBOUR_PATHS.map((n) => svg('path', { d: n.d }))),
  ));

  // sea swell and the lat / long grid
  const swell = svg('g', { class: 'swell' });
  for (let i = 0; i < 26; i++) {
    const y = -260 + i * 52 + (i % 3) * 9;
    let d = `M-2400,${y}`;
    for (let x = -2400; x < 2400; x += 60) d += ` q15,${i % 2 ? -5 : 5} 30,0 t30,0`;
    swell.append(svg('path', { d, style: `animation-delay:${-i * 1.7}s` }));
  }
  const grid = svg('g', { class: 'grid' });
  for (let lat = 29; lat <= 40; lat++) {
    const [, y] = project(lat, 10);
    grid.append(svg('line', { x1: -3000, y1: y, x2: 3000, y2: y }));
    if (lat % 2 === 1) grid.append(svg('text', { x: o.rtl ? MAP_W + 70 : -30, y: y - 5 }, fmtDeg(lat, 'N', 'S')));
  }
  for (let lon = 2; lon <= 17; lon++) {
    const [x] = project(35, lon);
    grid.append(svg('line', { x1: x, y1: -3000, x2: x, y2: 3000 }));
    if (lon % 2 === 0) grid.append(svg('text', { x: x + 5, y: -14 }, fmtDeg(lon, 'E', 'W')));
  }
  el.append(swell, grid);

  // the land around: real imagery, dimmed
  const nb = svg('g', { class: 'neighbours' });
  nb.append(svg('image', { href: BASE + AROUND.src, x: AROUND.x, y: AROUND.y, width: AROUND.w, height: AROUND.h, preserveAspectRatio: 'none', 'clip-path': 'url(#nbClip)' }));
  for (const n of NEIGHBOUR_PATHS) nb.append(svg('path', { d: n.d }));
  el.append(nb);
  const far = (key: 'algeria' | 'libya' | 'sicily' | 'seaLabel', lat: number, lon: number, cls = 'place') => {
    const [x, y] = project(lat, lon);
    el.append(svg('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, svg('text', { class: `${cls} kz2` }, t(key))));
  };
  far('algeria', 34.6, 6.6); far('libya', 31.6, 12.4); far('sicily', 37.55, 14.1); far('seaLabel', 36.3, 12.3, 'place sea');

  // Tunisia: glow, base colour, the relief image, lakes, the river, surf and the coastline
  el.append(svg('path', { d: TUNISIA_PATH, class: 'land-glow' }), svg('path', { d: TUNISIA_PATH, class: 'surf' }), svg('path', { d: TUNISIA_PATH, class: 'land-fill' }));
  const relief = svg('image', { class: 'relief', x: 0, y: 0, width: MAP_W, height: MAP_H, preserveAspectRatio: 'none', 'clip-path': 'url(#tnClip)' });
  relief.addEventListener('load', () => relief.classList.add('on'));
  relief.setAttribute('href', BASE + RELIEF);
  el.append(relief);
  const lakes = svg('g', { class: 'lakes', 'clip-path': 'url(#tnClip)' });
  LAKES.forEach((l, i) => lakes.append(svg('path', { d: l.d, class: `lake ${l.kind}`, style: `animation-delay:${-(i * 1.3) % 7}s` })));
  lakes.append(svg('path', { d: MEDJERDA, class: 'river' }));
  el.append(lakes, svg('path', { d: TUNISIA_PATH, class: 'coast', pathLength: 1 }));

  // names written on the land
  const names = svg('g', { class: 'names' });
  for (const r of REGIONS) {
    const [x, y] = project(r.lat, r.lon);
    names.append(svg('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${r.rot ?? 0})` },
      svg('text', { class: 'region kz', style: `font-size:${(11 * (r.size ?? 1)).toFixed(1)}px` }, tr(r.name))));
  }
  for (const l of LAKES) if (l.name) names.append(svg('g', { transform: `translate(${l.c[0]},${l.c[1]})` }, svg('text', { class: `lake-name ${l.kind} n-${l.id} kz` }, tr(l.name))));
  el.append(names);

  // transport (off until asked for)
  const transport = svg('g', { class: 'transport' });
  const linePath = new Map<string, string>();
  for (const kind of ['road', 'rail', 'ferry'] as const) for (const ln of LINES.filter((x) => x.kind === kind)) {
    const d = smooth(ln.p.map(P));
    linePath.set(ln.id, d);
    const g = svg('g', { class: `tline ${kind}`, tabindex: 0, role: 'button', 'aria-label': tr(ln.name) });
    g.append(svg('path', { d, class: 'casing' }), svg('path', { d, class: 'stroke' }), svg('path', { d, class: 'hit' }));
    g.addEventListener('click', () => { if (!dragged) o.onLine(ln); });
    g.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') o.onLine(ln); });
    transport.append(g);
  }
  for (const s of STATIONS) {
    const [x, y] = project(s.lat, s.lon);
    transport.append(svg('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, svg('g', { class: 'kz station' }, svg('circle', { r: 3 }), svg('text', { x: 6, y: 3.5 }, tr(s.name)))));
  }
  for (const a of AIRPORTS) {
    const [x, y] = project(a.lat, a.lon);
    const g = svg('g', { class: `airport${a.intl ? ' intl' : ''}`, transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`, tabindex: 0, role: 'button', 'aria-label': `${tr(a.name)} (${a.code})` },
      svg('g', { class: 'kz' }, svg('circle', { r: 9.5 }), svg('text', { class: 'ico', y: 4 }, '✈'), svg('text', { class: 'code', x: 13, y: 4 }, a.code)));
    g.addEventListener('click', () => { if (!dragged) o.onAirport(a); });
    g.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') o.onAirport(a); });
    transport.append(g);
  }
  if (!o.reduced) {
    // trains shuttling on the main lines, planes coming in to land
    for (const [id, dur] of [['rail-south', 64], ['rail-west', 44], ['rail-djerid', 52]] as const) {
      transport.append(svg('g', {}, svg('animateMotion', { dur: `${dur}s`, repeatCount: 'indefinite', path: linePath.get(id)!, keyPoints: '0;1;0', keyTimes: '0;0.5;1', calcMode: 'linear' }),
        svg('circle', { r: 2.4, class: 'train kz2' })));
    }
    for (const [from, to, dur] of [[[39.2, 8.6], [36.851, 10.227], 22], [[37.6, 13.6], [35.758, 10.755], 27], [[35.6, 13.9], [33.875, 10.775], 31]] as [LL, LL, number][]) {
      const a = P(from), b = P(to), m: XY = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.18, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.18];
      transport.append(svg('g', { class: 'plane' }, svg('animateMotion', { dur: `${dur}s`, repeatCount: 'indefinite', rotate: 'auto', path: `M${f1(a)} Q${f1(m)} ${f1(b)}` }),
        svg('text', { class: 'kz2', y: 4 }, '✈')));
    }
  }
  el.append(transport);

  // route (a journey or the visitor's own trip)
  const routeG = svg('g', { class: 'route-layer' });
  el.append(routeG);

  // small moving things
  const life = svg('g', { class: 'life' });
  if (!o.reduced) {
    const boat = (cls = '') => svg('g', { class: `boat kz2 ${cls}` }, svg('path', { d: 'M-4.4,1 L4.4,1 L2.8,3.2 L-2.8,3.2Z', class: 'hull' }), svg('path', { d: 'M0.2,-5.4 L0.2,0.3 L4,0.3Z', class: 'sail' }), svg('path', { d: 'M-0.6,-4 L-0.6,0.3 L-3,0.3Z', class: 'sail' }));
    // fishing boats rocking off the ports
    for (const [lat, lon] of [[36.9, 11.22], [35.53, 11.17], [33.57, 11.22], [37.02, 8.74], [37.36, 9.98], [34.45, 10.95], [36.2, 10.78], [35.05, 11.2]] as LL[]) {
      const [x, y] = project(lat, lon);
      life.append(svg('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, svg('g', { class: 'rock', style: `animation-delay:${-(lat * 7) % 5}s` }, boat())));
    }
    // ferries crossing to Kerkennah and Djerba, a ship leaving La Goulette
    for (const [id, dur, back] of [['ferry-kerkennah', 38, true], ['ferry-djerba', 14, true], ['ferry-europe', 70, false]] as const) {
      const a: Record<string, string> = { dur: `${dur}s`, repeatCount: 'indefinite', path: linePath.get(id)! };
      if (back) Object.assign(a, { keyPoints: '0;1;0', keyTimes: '0;0.5;1', calcMode: 'linear' });
      life.append(svg('g', {}, svg('animateMotion', a), boat('ferry')));
    }
    // a caravan between Douz and Ksar Ghilane
    const caravan = smooth(([[33.42, 9.02], [33.27, 9.14], [33.18, 9.34], [33.06, 9.47], [32.99, 9.62]] as LL[]).map(P));
    for (let i = 0; i < 4; i++) {
      life.append(svg('g', {}, svg('animateMotion', { dur: '150s', begin: `${-i * 2.6}s`, repeatCount: 'indefinite', path: caravan, keyPoints: '0;1;0', keyTimes: '0;0.5;1', calcMode: 'linear' }),
        svg('text', { class: 'camel kz2', y: 3 }, '🐪')));
    }
    // flamingos flying between the lagoons of the north, a bird of prey circling over Cap Bon
    const flock = smooth(([[36.76, 10.12], [36.95, 9.95], [37.14, 9.68], [37.18, 10.0], [37.12, 10.2], [36.9, 10.3], [36.76, 10.12]] as LL[]).map(P));
    for (let i = 0; i < 6; i++) {
      life.append(svg('g', {}, svg('animateMotion', { dur: '52s', begin: `${-i * 0.5}s`, repeatCount: 'indefinite', path: flock }),
        svg('g', { transform: `translate(${(i % 3) * 2.5 - 2.5},${(i % 2) * 2.2})` }, svg('g', { class: 'kz2' }, svg('path', { d: 'M-3,-0.6 Q-1.5,-2.6 0,0 Q1.5,-2.6 3,-0.6', class: 'bird pink', style: `animation-delay:${-i * 0.13}s` })))));
    }
    const [hx, hy] = project(37.08, 11.02);
    life.append(svg('g', {}, svg('animateMotion', { dur: '17s', repeatCount: 'indefinite', path: `M${hx - 9},${hy} a9,7 0 1,1 18,0 a9,7 0 1,1 -18,0` }),
      svg('g', { class: 'kz2' }, svg('path', { d: 'M-3.6,-0.6 Q-1.8,-2.4 0,0 Q1.8,-2.4 3.6,-0.6', class: 'bird dark' }))));
    // clouds drifting over the north
    for (const [y, r, dur, delay] of [[70, 70, 190, 0], [150, 95, 260, -90], [30, 55, 220, -150], [230, 80, 300, -40]]) {
      life.append(svg('ellipse', { class: 'cloud', cx: 0, cy: y, rx: r, ry: r * 0.42, fill: 'url(#cloudGrad)', style: `animation-duration:${dur}s;animation-delay:${delay}s` }));
    }
  }
  el.append(life);

  // animals
  const animals = svg('g', { class: 'animals' });
  ANIMALS.forEach((a, i) => {
    const [x, y] = project(a.lat, a.lon);
    const glyph = animalGlyph(a.id);
    const g = svg('g', { class: 'oanimal', transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`, tabindex: 0, role: 'button', 'aria-label': tr(a.name) },
      svg('g', { class: 'kz' }, svg('g', { class: 'bobbing', style: `animation-delay:${-(i * 0.7) % 4}s` }, svg('circle', { r: 16 }), glyph ? svg('g', { transform: 'scale(1.45)' }, glyph) : svg('text', { y: 6.4 }, a.icon))));
    g.addEventListener('click', () => { if (!dragged) o.onAnimal(a); });
    g.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') o.onAnimal(a); });
    animals.append(g);
  });
  el.append(animals);

  // weather chips at the towns (off until asked for)
  const weather = svg('g', { class: 'weather' });
  const chips = new Map<string, SVGGElement>();
  for (const c of CLIMATE) {
    const [x, y] = project(c.lat, c.lon);
    const major = ['tunis', 'tabarka', 'hammamet', 'sousse', 'mahdia', 'sfax', 'djerba', 'gabes', 'tozeur', 'douz', 'tataouine', 'le-kef', 'kairouan', 'gafsa', 'bizerte', 'kelibia'].includes(c.id);
    const g = svg('g', { class: `wchip${major ? '' : ' minor'}`, transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`, tabindex: 0, role: 'button', 'aria-label': tr(c.name) });
    const body = svg('g', { class: 'kz' });
    g.append(body);
    g.addEventListener('click', () => { if (!dragged) o.onTown(c.id); });
    g.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') o.onTown(c.id); });
    weather.append(g); chips.set(c.id, body);
  }

  // pins: places first, the walkable monuments on top
  const pins = svg('g', { class: 'pins' });
  const pinEls = new Map<string, SVGGElement>();
  const ordered = [...o.items].sort((a, b) => Number(a.walk) - Number(b.walk));
  ordered.forEach((s, i) => {
    const [x, y] = project(s.lat, s.lon);
    const g = svg('g', {
      class: `opin ${s.walk ? 'ready' : `spot c-${s.cats[0]}`}`, transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`,
      tabindex: 0, role: 'button', 'aria-label': tr(s.name), style: `--d:${(1.3 + (i % 26) * 0.06).toFixed(2)}s`,
    });
    const body = svg('g', { class: 'opin-body' });
    if (s.walk) {
      const icon = monumentIcon(s.id);
      icon.setAttribute('transform', 'scale(0.8)');
      body.append(svg('circle', { r: 22, class: 'halo' }), svg('circle', { r: 15.5, class: 'ring r1' }), svg('circle', { r: 15.5, class: 'ring r2' }),
        svg('circle', { r: 15.5, class: 'badge' }), icon);
    } else {
      const icon = placeIcon(s.id);
      icon.setAttribute('transform', 'scale(0.62)');
      body.append(svg('circle', { r: 11.5, class: 'core' }), icon);
    }
    const off = s.walk ? 21 : 16;
    const label = svg('g', { class: 'plabel' });
    label.append(svg('rect', { rx: 4 }), svg('text', { x: s.left ? -off : off, y: 4 + (s.dy ?? 0), 'text-anchor': s.left ? 'end' : 'start' }, s.label));
    body.append(label);
    g.append(svg('g', { class: 'kz' }, body));
    pins.append(g);
    pinEls.set(s.id, g);
    g.addEventListener('pointerenter', (e) => { if ((e as PointerEvent).pointerType === 'mouse' && !panning) o.onPick(s.id, 'hover'); });
    g.addEventListener('focus', () => o.onPick(s.id, 'hover'));
    g.addEventListener('click', () => { if (!dragged) o.onPick(s.id, 'click'); });
    g.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') o.onPick(s.id, 'click'); });
  });
  el.append(pins, weather);

  // ------------------------------------------------------------------ view (zoom and pan)
  const KMAX = 7, KMIN = 0.6;
  // the home view frames the country from the north coast down to the edge of the Grand Erg (lat ~31.8);
  // zooming out (buttons, pinch) shows the far south
  const [hx0, hy0] = project(37.6, 7.45), [hx1, hy1] = project(31.8, 11.55);
  const HOME = { fx: (hx0 + hx1) / 2, fy: (hy0 + hy1) / 2, w: hx1 - hx0, h: hy1 - hy0 };
  const view = { fx: HOME.fx, fy: HOME.fy, k: 1 };
  let W = 1, H = 1, s0 = 1, rx = 0, ry = 0;      // element size, home scale (px per unit), centre of the free region (px)
  let raf = 0, dragged = false, panning = false;
  const clamp = () => {
    view.k = Math.max(KMIN, Math.min(KMAX, view.k));
    view.fx = Math.max(0, Math.min(MAP_W, view.fx)); view.fy = Math.max(0, Math.min(MAP_H, view.fy));
  };
  const apply = () => {
    clamp();
    const s = s0 * view.k;
    el.setAttribute('viewBox', `${(view.fx - rx / s).toFixed(2)} ${(view.fy - ry / s).toFixed(2)} ${(W / s).toFixed(2)} ${(H / s).toFixed(2)}`);
    el.style.setProperty('--inv', (1 / Math.max(1, view.k)).toFixed(4));
    el.style.setProperty('--inv2', (1 / Math.sqrt(Math.max(1, view.k))).toFixed(4));
    el.classList.toggle('z2', view.k >= 1.9);
    el.classList.toggle('z3', view.k >= 3.2);
    el.classList.toggle('zoomed', view.k > 1.01);
    o.onView?.(view.k, s);
  };
  const layout = () => {
    const r = el.getBoundingClientRect();
    W = r.width || 1024; H = r.height || 720;
    const f = o.free(), fw = Math.max(160, W - f.l - f.r), fh = Math.max(200, H - f.t - f.b);
    s0 = Math.min(fw / (HOME.w + 30), fh / HOME.h);
    rx = f.l + fw / 2; ry = f.t + fh / 2;
    apply();
  };
  const animateTo = (to: { fx: number; fy: number; k: number }, ms = 600) => {
    cancelAnimationFrame(raf);
    if (o.reduced) { Object.assign(view, to); apply(); return; }
    const from = { ...view }, t0 = performance.now();
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - u, 3);
      view.k = from.k * Math.pow(to.k / from.k, e);
      view.fx = from.fx + (to.fx - from.fx) * e; view.fy = from.fy + (to.fy - from.fy) * e;
      apply();
      if (u < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  /** Zoom to k keeping the map point under (px, py) in place. */
  const zoomAt = (px: number, py: number, k: number, smoothly: boolean) => {
    k = Math.max(KMIN, Math.min(KMAX, k));
    const s = s0 * view.k, s1 = s0 * k;
    const mx = view.fx + (px - rx) / s, my = view.fy + (py - ry) / s;
    const to = { fx: mx - (px - rx) / s1, fy: my - (py - ry) / s1, k };
    if (smoothly) animateTo(to, 320); else { cancelAnimationFrame(raf); Object.assign(view, to); apply(); }
  };
  const local = (e: { clientX: number; clientY: number }): XY => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) { e.preventDefault(); zoomAt(...local(e), view.k * Math.exp(-e.deltaY * 0.01), false); return; }   // trackpad pinch
    const inward = e.deltaY < 0;
    // zooming in starts only from the top of the page; zooming out hands the wheel back to the page at the whole-country view
    if (inward ? (view.k <= 1.001 && scrollY > 8) : view.k <= 1.001) return;
    e.preventDefault();
    const next = view.k * Math.exp(-Math.max(-300, Math.min(300, e.deltaY)) * 0.0021);
    zoomAt(...local(e), inward ? next : Math.max(1, next), false);   // the wheel stops at the home view
  };
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('dblclick', (e) => { e.preventDefault(); zoomAt(...local(e), view.k * 2, true); });

  const touches = new Map<number, XY>();
  let start: { x: number; y: number; fx: number; fy: number } | null = null, pinch: { d: number; k: number } | null = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    dragged = false;
    if (touches.size === 1) start = { x: e.clientX, y: e.clientY, fx: view.fx, fy: view.fy };
    if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, k: view.k }; }
  });
  el.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2 && pinch) {
      const [a, b] = [...touches.values()], r = el.getBoundingClientRect();
      dragged = true;
      zoomAt((a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top, (pinch.k * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch.d, false);
      return;
    }
    if (touches.size !== 1 || !start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!dragged && Math.hypot(dx, dy) < 5) return;
    dragged = true;
    if (view.k <= 1.01 && e.pointerType !== 'mouse') return;   // on touch, the page scrolls at the home view
    if (!panning) { panning = true; el.classList.add('panning'); try { el.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ } }
    cancelAnimationFrame(raf);
    const s = s0 * view.k;
    view.fx = start.fx - dx / s; view.fy = start.fy - dy / s;
    apply();
  });
  const release = (e: PointerEvent) => {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinch = null;
    if (touches.size === 1) { const [p] = [...touches.values()]; start = { x: p[0], y: p[1], fx: view.fx, fy: view.fy }; }
    if (touches.size === 0) { start = null; panning = false; el.classList.remove('panning'); }
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  // pause everything that moves while the map is off screen
  const io = new IntersectionObserver(([en]) => {
    el.classList.toggle('paused', !en.isIntersecting);
    try { if (en.isIntersecting) el.unpauseAnimations(); else el.pauseAnimations(); } catch { /* not rendered */ }
  });
  io.observe(el);

  /** Size the label backgrounds to their text (once the map is in the page), then let the CSS hide the small ones. */
  const measure = () => {
    for (const g of el.querySelectorAll<SVGGElement>('.plabel')) {
      const tx = g.querySelector('text')!, rc = g.querySelector('rect')!, b = tx.getBBox();
      rc.setAttribute('x', String(b.x - 5)); rc.setAttribute('y', String(b.y - 3));
      rc.setAttribute('width', String(b.width + 10)); rc.setAttribute('height', String(b.height + 6));
    }
    el.classList.add('measured');
  };
  let measured = false;
  // once the pins have landed, drop the intro styles (a pin moved to the front would play its drop again)
  const introTimer = setTimeout(() => el.classList.remove('intro'), 4600);

  return {
    el,
    layout() { layout(); if (!measured && el.isConnected) { measured = true; measure(); } },
    home() { animateTo({ fx: HOME.fx, fy: HOME.fy, k: 1 }); },
    zoomBy(f) { zoomAt(rx, ry, view.k * f, true); },
    flyTo(lat, lon, k = 4) { const [x, y] = project(lat, lon); animateTo({ fx: x, fy: y, k: Math.max(view.k, k) }, 800); },
    fitTo(pts) {
      if (!pts.length) return;
      const xy = pts.map(P), xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const f = o.free(), fw = Math.max(160, W - f.l - f.r), fh = Math.max(200, H - f.t - f.b);
      const k = Math.min(fw / (x1 - x0 + 70), fh / (y1 - y0 + 70)) / s0;
      animateTo({ fx: (x0 + x1) / 2, fy: (y0 + y1) / 2, k: Math.max(KMIN, Math.min(KMAX, k)) }, 800);
    },
    setActive(id) {
      pinEls.forEach((p, k) => p.classList.toggle('active', k === id));
      const a = id ? pinEls.get(id) : null;
      if (a) pins.append(a);                                  // on top of its neighbours
    },
    setFilter(cats) { o.items.forEach((s) => pinEls.get(s.id)?.classList.toggle('off', !!cats && !s.cats.some((c) => cats.has(c)))); },
    setLayer(name, on) { el.classList.toggle(`show-${name}`, on); },
    setWeather(v) {
      for (const [id, body] of chips) {
        const w = v.get(id);
        body.replaceChildren();
        if (!w) continue;
        const sea = w.sea != null;
        body.append(svg('rect', { class: 'wbg', x: -24, y: -13, width: 48, height: sea ? 37 : 26, rx: 13 }),
          svg('text', { class: 'wicon', x: -12, y: 5.5 }, w.icon), svg('text', { class: 'wt', x: 11, y: 5 }, `${w.t}°`));
        if (sea) body.append(svg('text', { class: 'wsea', x: 0, y: 19 }, `🌊 ${w.sea}°`));
      }
    },
    setRoute(pts) {
      routeG.replaceChildren();
      if (!pts || pts.length < 2) return;
      const d = smooth(pts.map(P));
      routeG.append(svg('path', { d, class: 'route-casing' }), svg('path', { d, class: 'route', id: 'journey' }));
      pts.forEach((p, i) => { const [x, y] = P(p); routeG.append(svg('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, svg('g', { class: 'kz stopno' }, svg('circle', { r: 7, cy: -19 }), svg('text', { y: -15.4 }, String(i + 1))))); });
      if (!o.reduced) routeG.append(svg('g', {}, svg('animateMotion', { dur: `${Math.max(8, pts.length * 2.6)}s`, repeatCount: 'indefinite', path: d }), svg('circle', { r: 3.4, class: 'traveller kz2' })));
    },
    destroy() { cancelAnimationFrame(raf); clearTimeout(introTimer); io.disconnect(); el.removeEventListener('wheel', onWheel); },
  };
}
