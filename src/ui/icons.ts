/** Line icons for the interface (24 × 24, drawn with the current text colour). */
import { svg } from './atlas-map';

const P: Record<string, string> = {
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  trip: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a4 4 0 0 1 4-4h2m6 4v6a4 4 0 0 1-4 4h-2',
  guide: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 1 2-2h12v4H6M8 7h6M8 10h6',
  events: 'M4 7h16v13H4V7Zm0 5h16M8 3v4m8-4v4m-8 9h2m4 0h2',
  food: 'M7 3v8m-3-8v5a3 3 0 0 0 6 0V3M7 11v10m10-18c-2 1-3 4-3 7 0 2 1 3 3 3v8',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.5 3.5 6 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-6-3.5-9S9.5 5.5 12 3Z',
  historic: 'M3 9 12 4l9 5H3Zm2 0v9m4.7-9v9m4.6-9v9M19 9v9M3 20h18',
  beach: 'M4 11a8 8 0 0 1 16 0H4Zm8 0v9M3 20c2 0 2-1.5 4.5-1.5S10 20 12 20s2-1.5 4.5-1.5S19 20 21 20',
  nature: 'M12 3 6 11h3l-4 6h14l-4-6h3l-6-8Zm0 14v4',
  sahara: 'M2 18c3-4 6-6 10-6s7 2 10 6M7 18c1.5-2 3-3 5-3M17 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  wildlife: 'M8.5 10a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm7 0a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm-10 4a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Zm13 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM12 13c-3 0-5 3-5 5 0 1.5 1.5 2 2.5 2 1 0 1.5-.6 2.5-.6s1.5.6 2.5.6c1 0 2.5-.5 2.5-2 0-2-2-5-5-5Z',
  transport: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z',
  weather: 'M8 4v1m-5.5 2.5.7.7M2 13h1m10.5-5.8.7-.7M12 13a4 4 0 1 0-7.6-1.6M9 20h8a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5 1.6A2.7 2.7 0 0 0 9 20Z',
  bed: 'M3 18V7m0 8h18v3M3 12h18v6M7 12V9h5v3',
  ticket: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Zm10 0v10',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z',
  share: 'M12 3v12m0-12L8 7m4-4 4 4M5 13v6h14v-6',
  star: 'm12 3 2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8L12 3Z',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  calendar: 'M4 6h16v14H4V6Zm0 5h16M8 3v4m8-4v4',
  pin: 'M12 21s-7-6.3-7-11.5a7 7 0 0 1 14 0C19 14.7 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  dice: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3.5 4.5h.01m7 0h.01m-3.5 3.5h.01m-3.5 3.5h.01m7 0h.01',
  route: 'M6 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 17c0-6 12-4 12-10',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  minus: 'M5 12h14', plus: 'M12 5v14M5 12h14',
};

export function icon(name: keyof typeof P | string, size = 18) {
  return svg('svg', { viewBox: '0 0 24 24', width: size, height: size, class: 'ic', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    svg('path', { d: P[name] ?? '' }));
}
