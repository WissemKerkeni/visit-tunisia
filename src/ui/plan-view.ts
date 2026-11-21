/**
 * The "Plan my trip" view: the ready-made itineraries day by day, or the visitor's own trip stop by stop, with a
 * small map of the route, the arrival date and nights, and a hotel search for every night.
 */
import { hotelsUrl } from '../config';
import { TUNIS, drive } from '../content/atlas';
import { ITINERARIES } from '../content/guide';
import { TUNISIA_PATH, project } from '../content/tunisia-map';
import { t, tr, type T1 } from '../i18n';
import { svg } from './atlas-map';
import { h } from './dom';
import { photo, viewHead } from './guide';
import { icon } from './icons';
import { countUp, stagger } from './reveal';

export interface Stop { id: string; name: T1; text: T1; photo: string; lat: number; lon: number; hotels: string; walk?: boolean }
export interface PlanCtx {
  stop: (id: string) => Stop | undefined;
  trip: () => string[];
  setTrip: (ids: string[]) => void;
  /** The visitor's stops in driving order. */
  ordered: () => Stop[];
  dates: { arrival: string; nights: number };
  saveDates: () => void;
  /** Hotel dates of a stop of the visitor's trip. */
  datesFor: (id: string) => { checkin: string; checkout: string } | undefined;
  journeys: { id: string; name: T1; text: T1; stops: string[] }[];
  showPlace: (id: string) => void;
  /** Draw a route (journey, itinerary or 'mine') on the big map. */
  showRoute: (id: string) => void;
  goExplore: () => void;
}

/** What the view shows: an itinerary, or the visitor's trip ('mine'); kept while the page is redrawn. */
export const planState = { sel: 'it-7' };

const cap = (x: string) => x.charAt(0).toLocaleUpperCase() + x.slice(1);
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtH = (hrs: number) => {
  const m = Math.max(15, Math.round((hrs * 60) / 15) * 15);
  return m < 60 ? `${m} min` : t('hoursShort').replace('{h}', String(Math.floor(m / 60))) + (m % 60 ? ` ${m % 60}` : '');
};
const leg = (from: [number, number], to: Stop[]) => {
  let at = from, kmT = 0, hT = 0;
  for (const s of to) { const d = drive(at, [s.lat, s.lon]); kmT += d.km; hT += d.h; at = [s.lat, s.lon]; }
  return { km: kmT, h: hT, end: at };
};

export function planView(ctx: PlanCtx) {
  const tabs = h('div', { class: 'seg', role: 'tablist' });
  const cards = h('div', { class: 'pcards' });
  const timeline = h('div', { class: 'ptimeline' });
  const side = h('aside', { class: 'pside' });
  const journeys = h('div', { class: 'pjourneys' });

  const draw = () => {
    const mine = planState.sel === 'mine';
    const trip = ctx.trip();
    // tabs: ready-made or mine
    tabs.replaceChildren(
      h('button', { role: 'tab', 'aria-selected': String(!mine), class: mine ? '' : 'on', onclick: () => { if (mine) { planState.sel = 'it-7'; draw(); } } }, t('readyMade')),
      h('button', { role: 'tab', 'aria-selected': String(mine), class: mine ? 'on' : '', onclick: () => { planState.sel = 'mine'; draw(); } }, icon('star', 15), t('myTrip'), trip.length ? h('b', { class: 'count' }, String(trip.length)) : null));

    // the three itineraries
    cards.hidden = mine;
    cards.replaceChildren(...ITINERARIES.map((it) => {
      const first = ctx.stop(it.plan[it.plan.length - 1].stops[0]);
      const names = [...new Set(it.plan.flatMap((d) => d.stops))].map((id) => ctx.stop(id)).filter(Boolean).slice(0, 5).map((s) => tr(s!.name));
      return h('button', { class: `pcard${planState.sel === it.id ? ' on' : ''}`, onclick: () => { planState.sel = it.id; draw(); timeline.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
        first ? photo(first.photo, '') : h('div', { class: 'gphoto nophoto' }),
        h('span', { class: 'pdays' }, h('b', {}, String(it.days)), daysWord(it.days)),
        h('span', { class: 'pname' }, cap(tr(it.name).replace(/^\d+\s*\S*\s*[:：]\s*/, ''))),
        h('span', { class: 'pstops' }, names.join(' · ') + '…'));
    }));

    // the days or the stops
    let stats: { days: number; stops: number; km: number; h: number }, pts: Stop[];
    if (mine) {
      const stops = ctx.ordered(); pts = stops;
      let at: [number, number] = TUNIS, kmT = 0, hT = 0;
      const rows = stops.map((s, i) => {
        const l = leg(at, [s]); at = l.end; kmT += l.km; hT += l.h;
        const d = ctx.datesFor(s.id);
        return day(`${t('stopN').replace('{n}', String(i + 1))} · ${t('nightsN').replace('{n}', String(ctx.dates.nights))}`, l, [s], tr(s.text), s, d);
      });
      stats = { days: stops.length * ctx.dates.nights, stops: stops.length, km: kmT, h: hT };
      timeline.replaceChildren(stops.length ? h('ol', {}, ...stagger(rows))
        : h('div', { class: 'pempty' }, h('p', {}, t('tripEmptyPlan')), h('button', { class: 'btn accent', onclick: ctx.goExplore }, icon('map', 16), t('exploreMap'))));
    } else {
      const it = ITINERARIES.find((x) => x.id === planState.sel) ?? ITINERARIES[1];
      let at: [number, number] = TUNIS, kmT = 0, hT = 0;
      pts = [];
      const rows = it.plan.map((dp, i) => {
        const stops = dp.stops.map((id) => ctx.stop(id)).filter((s): s is Stop => !!s);
        const l = leg(at, stops); at = l.end; kmT += l.km; hT += l.h;
        stops.forEach((s) => { if (!pts.includes(s)) pts.push(s); });
        const last = stops[stops.length - 1];
        const d = ctx.dates.arrival ? { checkin: addDays(ctx.dates.arrival, i), checkout: addDays(ctx.dates.arrival, i + 1) } : undefined;
        return day(t('dayN').replace('{n}', String(i + 1)), l, stops, tr(dp.text), last, d);
      });
      stats = { days: it.days, stops: pts.length, km: kmT, h: hT };
      timeline.replaceChildren(h('div', { class: 'ptl-head' }, h('h3', {}, tr(it.name)), h('p', {}, tr(it.text))), h('ol', {}, ...stagger(rows)));
    }
    requestAnimationFrame(() => timeline.querySelectorAll('[data-reveal]').forEach((x, i) => setTimeout(() => x.classList.add('in'), i * 60)));

    // the side: map, dates, numbers, actions
    const date = h('input', { type: 'date', value: ctx.dates.arrival, 'aria-label': t('arrival') });
    date.addEventListener('change', () => { ctx.dates.arrival = date.value; ctx.saveDates(); draw(); });
    const step = (n: number) => { ctx.dates.nights = Math.max(1, Math.min(14, ctx.dates.nights + n)); ctx.saveDates(); draw(); };
    const kmEl = h('b', {}, '0');
    side.replaceChildren(h('div', { class: 'pside-in' },
      miniMap(pts),
      h('div', { class: 'psum' },
        h('h3', {}, mine ? t('myTrip') : tr((ITINERARIES.find((x) => x.id === planState.sel) ?? ITINERARIES[1]).name)),
        h('label', { class: 'pfield' }, t('arrival'), date),
        mine ? h('div', { class: 'pfield' }, t('nightsPerStop'), h('div', { class: 'stepper' },
          h('button', { 'aria-label': '−', onclick: () => step(-1) }, icon('minus', 16)), h('b', {}, String(ctx.dates.nights)), h('button', { 'aria-label': '+', onclick: () => step(1) }, icon('plus', 16)))) : null,
        h('dl', { class: 'pstats' },
          h('dt', {}, t('statDays')), h('dd', {}, String(stats.days)),
          h('dt', {}, t('statStops')), h('dd', {}, String(stats.stops)),
          h('dt', {}, t('statDistance')), h('dd', {}, kmEl, ' km'),
          h('dt', {}, t('statDriving')), h('dd', {}, fmtH(stats.h))),
        h('small', {}, ctx.dates.arrival ? t('tripDatesNote') : t('arrivalHint')),
        pts.length > 1 ? h('button', { class: 'btn accent', onclick: () => ctx.showRoute(planState.sel) }, icon('map', 16), t('showRoute')) : null,
        !mine ? h('button', { class: 'btn glass', onclick: () => { ctx.setTrip([...new Set(pts.map((s) => s.id))]); planState.sel = 'mine'; draw(); } }, icon('star', 16), t('makeMine')) : null,
        mine && pts.length ? h('div', { class: 'row' },
          h('button', { class: 'btn glass sm', onclick: (e) => {
            const url = `${location.origin}${location.pathname}#/trip/${pts.map((s) => s.id).join(',')}`;
            void navigator.clipboard?.writeText(url).then(() => { (e.currentTarget as HTMLElement).textContent = t('copied'); });
          } }, icon('link', 15), t('copyLink')),
          h('button', { class: 'btn glass sm', onclick: () => { ctx.setTrip([]); draw(); } }, t('clear'))) : null)));
    countUp(kmEl, stats.km);

    // themed journeys
    journeys.replaceChildren(...ctx.journeys.map((j) => {
      const s = ctx.stop(j.stops[0]);
      return h('button', { class: 'pjourney', onclick: () => ctx.showRoute(j.id) },
        s ? photo(s.photo, '') : null, h('span', {}, h('b', {}, tr(j.name)), h('small', {}, `${j.stops.length} ${t('statStops').toLowerCase()}`)), icon('arrow', 16));
    }));
  };

  /** One day (or stop) of the timeline. */
  function day(label: string, l: { km: number; h: number }, stops: Stop[], text: string, hotelAt: Stop | undefined, dates?: { checkin: string; checkout: string }) {
    const lead = stops[0];
    return h('li', { class: 'pday' },
      h('span', { class: 'pdot', 'aria-hidden': 'true' }),
      h('div', { class: 'pday-in' },
        h('div', { class: 'pday-top' }, h('span', { class: 'plabel' }, label), l.km >= 15 ? h('span', { class: 'pdrive' }, icon('route', 14), t('byRoad').replace('{km}', String(l.km)).replace('{h}', fmtH(l.h))) : null),
        h('div', { class: 'pday-main' },
          h('div', {},
            h('h4', {}, ...stops.flatMap((s, k) => [k ? ' · ' : '', h('button', { class: 'link', onclick: () => ctx.showPlace(s.id) }, tr(s.name))])),
            h('p', {}, text)),
          lead ? photo(lead.photo, tr(lead.name), 'pthumb') : null),
        hotelAt ? h('a', { class: 'photel', href: hotelsUrl(`${hotelAt.hotels}, Tunisia`, dates), target: '_blank', rel: 'noopener sponsored' },
          icon('bed', 15), t('hotelsNight').replace('{town}', hotelAt.hotels), dates ? ` · ${dates.checkin.slice(5).replace('-', '/')}` : '', ' ↗') : null));
  }

  draw();
  const el = h('section', { class: 'view vplan', id: 'plan' },
    viewHead(t('navPlan'), t('planTitle'), t('planText')),
    h('div', { class: 'pgrid' },
      h('div', { class: 'pmain' }, tabs, cards, timeline,
        h('h3', { class: 'gsub' }, t('themedJourneys')), journeys),
      side));
  return { el, refresh: draw };
}

/** 'days' agreeing with the number in the current language (3 dny, 10 dní; 3 дня, 10 дней). */
export function daysWord(n: number) {
  if (document.documentElement.lang === 'pl') return t('daysShort');   // Intl gives 'doby' (24-hour periods); 'dni' fits
  try {
    const l = document.documentElement.lang || 'en';
    const u = new Intl.NumberFormat(l === 'ar' ? 'ar-TN' : l, { style: 'unit', unit: 'day', unitDisplay: 'long' }).formatToParts(n).find((p) => p.type === 'unit');
    if (u) return u.value;
  } catch { /* old browser */ }
  return t('daysShort');
}

/** A small map of Tunisia with the route drawing itself through numbered stops. */
function miniMap(stops: Stop[]) {
  const pts = stops.map((s) => project(s.lat, s.lon));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  // frame the route, at least the northern half of the country
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  let x0 = Math.min(...xs) - 45, x1 = Math.max(...xs) + 45, y0 = Math.min(...ys) - 45, y1 = Math.max(...ys) + 45;
  if (!pts.length) { x0 = 0; x1 = 400; y0 = 0; y1 = 807; }
  const grow = (a: number, b: number, min: number) => { const c = (a + b) / 2, w = Math.max(min, b - a); return [c - w / 2, c + w / 2]; };
  [x0, x1] = grow(x0, x1, 230); [y0, y1] = grow(y0, y1, 280);
  return h('div', { class: 'pmap' }, svg('svg', { viewBox: `${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1 - y0).toFixed(0)}`, role: 'img', 'aria-label': t('showRoute') },
    svg('path', { d: TUNISIA_PATH, class: 'pland' }),
    pts.length > 1 ? svg('path', { d, class: 'proute', pathLength: 1 }) : svg('g', {}),
    ...pts.map((p, i) => svg('g', { class: 'pstop', transform: `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`, style: `--i:${i}` },
      svg('g', { class: 'pin' }, svg('circle', { r: 9 }), svg('text', { y: 3.5 }, String(i + 1)))))),
  xs.length ? null : h('p', {}, '—'));
}
