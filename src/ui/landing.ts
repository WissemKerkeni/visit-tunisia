/**
 * Home page: a living map of Tunisia (see atlas-map.ts) with everything worth a visit on it.
 * - filters by kind of place (heritage, beaches, nature, Sahara and oases), wildlife and transport layers;
 * - a card for each place: photo, short text, when to go, how far from Tunis, the nearest airport and
 *   station, hotels nearby and directions; the twelve monuments built in 3D open from their card;
 * - ready-made journeys and the visitor's own trip, drawn on the map with rough distances;
 * - below the map, every place as a card, following the same filters.
 */
import { SITE_URL, hotelsUrl, toursUrl } from '../config';
import { AIRPORTS, STATIONS, TUNIS, drive, km, type Airport, type Animal, type Line } from '../content/atlas';
import { BEST_TIME, CATS, JOURNEYS, PLACES, SITE_CATS, type Cat } from '../content/places';
import { HOTEL_TOWN, SITES } from '../content/sites';
import { UNITS_PER_DEG_LAT } from '../content/tunisia-map';
import { lang, onLangChange, t, tr, type T1, type T3 } from '../i18n';
import { langMenu } from './lang-menu';
import { monumentIcon } from './monument-icons';
import { placeIcon } from './place-icons';
import { CLIMATE, type Climate } from '../content/climate';
import { monthName, monthSky, nearestTown, sky, thisMonth, weatherNow } from './weather';
import { animalGlyph, createAtlasMap, svg, type AtlasMap, type MapItem } from './atlas-map';
import { openCredits } from './credits';
import { eventMonths, eventsNear, eventsView, foodView, guideView, photo as photoEl, type ViewCtx } from './guide';
import { icon } from './icons';
import { planState, planView } from './plan-view';
import { reveal } from './reveal';
import { trackView } from '../analytics';
import { ITINERARIES, VISITS } from '../content/guide';
import { h } from './dom';

const BASE = import.meta.env.BASE_URL;

interface Item extends MapItem { text: T3; photo: string; unesco?: boolean; hotels: string }

/** Labels of the walkable monuments keep to one side of their pin in the crowded north. */
const LABEL_LEFT = new Set(['tunis-medina', 'bulla-regia', 'dougga', 'sbeitla', 'kairouan', 'bardo', 'oudhna', 'raf-raf', 'ichkeul', 'nefta', 'ong-jemel', 'chebika', 'mides', 'jugurtha', 'chemtou', 'ain-draham', 'le-kef', 'makthar', 'thuburbo-majus', 'testour', 'chambi', 'tozeur', 'douz', 'ksar-ghilane', 'chenini', 'matmata']);
const LABEL_DY: Record<string, number> = { 'sidi-bou-said': -13, carthage: 11, 'la-marsa': -22 };
const shortName = (s: string) => s.replace(/^(Amphitheatre of |Amphithéâtre d’|Great Mosque of |Grande Mosquée de |Medina and Ribat of |Médina et ribat de |Medina of |Médina de )/, '').replace(/ troglodyte houses| \(Sufetula\)|Maisons troglodytes de /, '');

function buildItems(): Item[] {
  const sites: Item[] = SITES.map((s) => ({
    id: s.id, walk: true, cats: SITE_CATS[s.id] ?? ['historic'], lat: s.lat, lon: s.lon, name: s.name, text: s.era, unesco: s.unesco,
    photo: s.id === 'el-jem' ? 'photos/el-jem/p22.jpg' : `photos/sites/${s.id}.jpg`, hotels: HOTEL_TOWN[s.id] ?? tr(s.name),
    label: shortName(tr(s.name)), left: LABEL_LEFT.has(s.id), dy: LABEL_DY[s.id],
  }));
  const places: Item[] = PLACES.map((p) => ({
    id: p.id, walk: false, cats: [p.cat], lat: p.lat, lon: p.lon, name: p.name, text: p.text, unesco: p.unesco,
    photo: `photos/places/${p.id}.jpg`, hotels: p.search, label: tr(p.name), left: LABEL_LEFT.has(p.id), dy: LABEL_DY[p.id],
  }));
  return [...sites, ...places];
}

interface Credit { author: string; license: string; license_url: string; source: string }
let creditsP: Promise<Record<string, Credit>> | null = null;
/** Photo credits by item id, loaded once (shown under each photo, as the licences require). */
function photoCredits() {
  const get = (f: string) => fetch(`${BASE}photos/${f}/credits.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  creditsP ??= Promise.all([get('sites'), get('el-jem'), get('places'), get('food')]).then(([sites, elJem, places, food]: Record<string, Credit>[]) => ({ ...food, ...places, ...sites, 'el-jem': elJem.p22 }));
  return creditsP;
}
function creditEl(id: string) {
  const el = h('a', { class: 'pcredit', target: '_blank', rel: 'noopener' });
  void photoCredits().then((c) => {
    const x = c[id];
    if (!x) return;
    el.textContent = `${t('photo')}: ${x.author} · ${x.license}`;
    el.setAttribute('href', x.source);
  });
  return el;
}

/** The ready-made journeys and the itineraries (their stops in order), drawn the same way on the map. */
const ROUTES: { id: string; name: T1; text: T1; stops: string[] }[] = [
  ...JOURNEYS,
  ...ITINERARIES.map((it) => ({ id: it.id, name: it.name, text: it.text, stops: [...new Set(it.plan.flatMap((d) => d.stops))] })),
];
/** The browser's offer to install the site as an app (Chrome, Edge, Android), kept until used. */
let installEvt: (Event & { prompt: () => Promise<void> }) | null = null;
const installListeners = new Set<() => void>();
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e as typeof installEvt; installListeners.forEach((f) => f()); });
addEventListener('appinstalled', () => { installEvt = null; installListeners.forEach((f) => f()); });
function installBtn() {
  const b = h('button', { class: 'link install', hidden: !installEvt }, `⤓ ${t('installApp')}`);
  const show = () => { if (!b.isConnected) { installListeners.delete(show); return; } b.hidden = !installEvt; };
  installListeners.add(show);
  b.addEventListener('click', () => { void installEvt?.prompt(); installEvt = null; show(); });
  return b;
}
const CAT_KEY = { historic: 'catHistoric', beach: 'catBeach', nature: 'catNature', sahara: 'catSahara' } as const;
const fmtH = (hrs: number) => {
  const m = Math.max(15, Math.round((hrs * 60) / 15) * 15);
  return m < 60 ? `${m} min` : t('hoursShort').replace('{h}', String(Math.floor(m / 60))) + (m % 60 ? ` ${m % 60}` : '');
};
const nearest = <T extends { lat: number; lon: number }>(list: T[], p: [number, number]) => list.map((x) => ({ x, d: km(p, [x.lat, x.lon]) })).sort((a, b) => a.d - b.d)[0];

// what the visitor chose stays when the page is redrawn (language, resize)
type View = 'explore' | 'plan' | 'guide' | 'events' | 'food';
const VIEWS: View[] = ['explore', 'plan', 'guide', 'events', 'food'];
const state = { cats: new Set<Cat>(), wildlife: true, transport: false, weather: false, wmonth: -1, journey: null as string | null, active: null as string | null, hinted: false,
  view: 'explore' as View, cardTab: 'overview' as 'overview' | 'visit' | 'weather' | 'there', sheet: 'peek' as 'peek' | 'full' };
/** Called by main.ts when the address changes to a view (#/plan…) or a section (#/places) of the home page. */
export let goView: (hash: string) => void = () => {};
function loadTrip(): string[] {
  const m = location.hash.match(/trip\/([\w,-]+)/);
  if (m) return m[1].split(',');
  try { return JSON.parse(localStorage.getItem('trip') ?? '[]'); } catch { return []; }
}
let trip: string[] = [];
/** The trip's arrival date (YYYY-MM-DD) and nights at each stop, for the hotel searches. */
const tripDates = (() => { try { return JSON.parse(localStorage.getItem('tripDates') ?? 'null') as { arrival: string; nights: number } | null; } catch { return null; } })() ?? { arrival: '', nights: 2 };
const saveDates = () => { try { localStorage.setItem('tripDates', JSON.stringify(tripDates)); } catch { /* private mode */ } };
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export function mountLanding(root: HTMLElement, openSite: (id: string) => void, startPlace?: string) {
  if (startPlace) state.active = startPlace;
  const h0 = location.hash.replace(/^#\/?/, '');
  // the address picks the view (#/plan), or a page of a view written by scripts/make-pages.mjs (/en/plan/)
  const pageView = (window as { __VIEW__?: string }).__VIEW__;
  const want = h0 || (pageView ?? '');
  state.view = (VIEWS as string[]).includes(want) ? want as View : want === 'itineraries' ? 'plan' : 'explore';
  if (/^trip\//.test(h0)) planState.sel = 'mine';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let firstRender = true;
  let cleanup: (() => void) | null = null;
  trip = loadTrip();
  if (/trip\//.test(location.hash) && trip.length) state.journey = 'mine';
  else if (state.journey === 'mine' && !trip.length) state.journey = null;

  const render = () => {
    cleanup?.();
    root.innerHTML = '';
    const rtl = lang() === 'ar';
    const narrow = innerWidth < 1080;
    const items = buildItems();
    let events: ReturnType<typeof eventsView> | null = null;
    let plan: ReturnType<typeof planView> | null = null;
    const byId = new Map(items.map((i) => [i.id, i]));
    trip = trip.filter((id) => byId.has(id));
    const visible = (i: Item) => !state.cats.size || i.cats.some((c) => state.cats.has(c));

    // ---------- map ----------
    const panel = h('aside', { class: 'opanel' });
    const card = h('aside', { class: 'ocard', 'aria-live': 'polite' });
    const hero = h('section', { class: 'ohero', id: 'map' });
    const scale = h('div', { class: 'oscale' }, h('i', {}), h('span', {}));
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const hintText = matchMedia('(pointer: coarse)').matches ? t('mapHintTouch') : mac ? t('mapHint').replace(/\b(Ctrl|Strg)\b/, '⌘') : t('mapHint');
    const hint = h('div', { class: `ohint${state.hinted ? ' gone' : ''}` }, hintText);
    let nudgeTimer = 0;
    let map: AtlasMap;
    map = createAtlasMap({
      items, rtl, reduced, intro: firstRender,
      free: () => {
        if (narrow) return { l: 6, t: 6, r: 6, b: 6 };
        const pr = panel.getBoundingClientRect(), hr = hero.getBoundingClientRect();
        const side = pr.width + 2 * (rtl ? hr.right - pr.right : pr.left - hr.left) - 8, other = innerWidth >= 1360 ? 384 : 150;
        return rtl ? { l: other, r: side, t: 24, b: 46 } : { l: side, r: other, t: 24, b: 46 };
      },
      onPick: (id, how) => { if (how === 'click') showItem(byId.get(id)!, false); },
      onAnimal: showAnimal, onAirport: showAirport, onLine: showLine, onTown: (id) => showTown(CLIMATE.find((c) => c.id === id)!),
      onView: (k, s) => {
        // a scale bar that follows the zoom
        const len = [200, 100, 50, 20, 10, 5].find((d) => (d / 111.2) * UNITS_PER_DEG_LAT * s <= 120) ?? 5;
        (scale.firstChild as HTMLElement).style.width = `${((len / 111.2) * UNITS_PER_DEG_LAT * s).toFixed(0)}px`;
        scale.lastChild!.textContent = `${len} km`;
        if (k > 1.05 && !state.hinted) { state.hinted = true; hint.classList.add('gone'); }
      },
      // the wheel scrolled the page over the map: show again, briefly, how to zoom
      onWheelHint: () => {
        hint.classList.remove('gone'); hint.classList.add('nudge');
        clearTimeout(nudgeTimer);
        nudgeTimer = window.setTimeout(() => { hint.classList.remove('nudge'); if (state.hinted) hint.classList.add('gone'); }, 1800);
      },
    });
    map.setLayer('wildlife', state.wildlife && (!state.cats.size || state.cats.has('nature')));
    map.setLayer('transport', state.transport);
    map.setLayer('weather', state.weather);

    // ---------- filters ----------
    const chipSets: (() => void)[] = [];
    const cardEls = new Map<string, HTMLElement>();
    const count = h('span', { class: 'ocount' });
    const wildlifeOn = () => state.wildlife && (!state.cats.size || state.cats.has('nature'));
    const applyFilter = () => {
      map.setFilter(state.cats.size ? state.cats : null);
      map.setLayer('wildlife', wildlifeOn());          // animals go with Nature
      const a = state.active ? byId.get(state.active) : null;
      if (a && !visible(a)) { state.active = null; map.setActive(null); card.classList.remove('show'); }
      let n = 0;
      for (const i of items) { const on = visible(i); cardEls.get(i.id)?.toggleAttribute('hidden', !on); if (on) n++; }
      count.textContent = t('nPlaces').replace('{n}', String(n));
      chipSets.forEach((f) => f());
    };
    const chips = () => {
      const all = h('button', { class: 'chip', onclick: () => { state.cats.clear(); applyFilter(); } }, icon('globe', 16), t('catAll'));
      const btns = CATS.map((c) => h('button', { class: `chip c-${c}`, onclick: () => { if (state.cats.has(c)) state.cats.delete(c); else state.cats.add(c); applyFilter(); } }, h('span', { class: 'cico' }, icon(c, 16)), t(CAT_KEY[c])));
      chipSets.push(() => { all.classList.toggle('on', !state.cats.size); CATS.forEach((c, i) => btns[i].classList.toggle('on', state.cats.has(c))); });
      return h('div', { class: 'ochips', role: 'group', 'aria-label': t('placesTitle') }, all, ...btns);
    };
    const toggle = (key: 'wildlife' | 'transport' | 'weather', label: string, ico: Node) => {
      const b = h('button', { class: `chip toggle${state[key] ? ' on' : ''}`, 'aria-pressed': String(state[key]), onclick: () => {
        state[key] = !state[key]; b.classList.toggle('on', state[key]); b.setAttribute('aria-pressed', String(state[key])); map.setLayer(key, key === 'wildlife' ? wildlifeOn() : state[key]);
        if (key === 'transport' && state.transport) showNote(t('layerTransport'), t('transportNote'), '🚆');
        else if (key === 'transport' && !state.active) card.classList.remove('show');
        if (key === 'weather') { months.classList.toggle('show', state.weather); if (state.weather) refreshWeather(); }
      } }, h('span', { class: 'ico' }, ico), h('span', {}, label));
      return b;
    };

    // ---------- weather ----------
    const wnote = h('div', { class: 'wnote' });
    const months = h('div', { class: `omonths${state.weather ? ' show' : ''}`, role: 'group', 'aria-label': t('layerWeather') });
    const monthBtns: HTMLButtonElement[] = [];
    [-1, ...Array.from({ length: 12 }, (_, m) => m)].forEach((m) => {
      const b = h('button', { class: m === -1 ? 'now' : '', onclick: () => { state.wmonth = m; refreshWeather(); refreshCard(); } }, m === -1 ? t('nowShort') : monthName(m));
      monthBtns.push(b); months.append(b);
    });
    const climateChips = (m: number) => new Map(CLIMATE.map((c) => [c.id, { icon: monthSky(c.rain[m]), t: Math.round(c.hi[m]), sea: c.sea ? Math.round(c.sea[m]) : null }]));
    function refreshWeather() {
      events?.refresh();
      monthBtns.forEach((b, i) => b.classList.toggle('on', i - 1 === state.wmonth));
      if (state.wmonth >= 0) {
        map.setWeather(climateChips(state.wmonth));
        wnote.textContent = t('wNoteMonth').replace('{month}', monthName(state.wmonth, 'long'));
        return;
      }
      const m = thisMonth();
      map.setWeather(climateChips(m));
      wnote.textContent = t('wNoteLoading');
      void weatherNow().then((now) => {
        if (state.wmonth !== -1) return;
        if (!now) { wnote.textContent = t('wNoteOffline').replace('{month}', monthName(m, 'long')); return; }
        map.setWeather(new Map(CLIMATE.map((c) => { const w = now.get(c.id); const s = w ? sky(w.code, w.day) : null; return [c.id, { icon: s?.icon ?? monthSky(c.rain[m]), t: w?.t ?? Math.round(c.hi[m]), sea: c.sea ? Math.round(c.sea[m]) : null }]; })));
        wnote.textContent = t('wNoteNow');
      });
    }

    /** The weather block of a card: now and the next three days, and the year month by month. */
    function weatherBox(lat: number, lon: number, town?: Climate) {
      const c = town ?? nearestTown(lat, lon), m = state.wmonth >= 0 ? state.wmonth : thisMonth();
      const nowEl = h('div', { class: 'wnow' }), daysEl = h('div', { class: 'wdays' });
      void weatherNow().then((now) => {
        const w = now?.get(c.id);
        if (!w) { nowEl.remove(); daysEl.remove(); return; }
        const s = sky(w.code, w.day);
        nowEl.replaceChildren(h('span', { class: 'big' }, s.icon), h('b', {}, `${w.t}°`),
          h('span', {}, `${t('nowShort')} · ${tr(s.text)}`, h('br', {}), town ? '' : t('weatherAt').replace('{town}', tr(c.name))));
        const fmt = new Intl.DateTimeFormat(lang() === 'ar' ? 'ar-TN' : lang(), { weekday: 'short' });
        daysEl.replaceChildren(...w.days.slice(0, 3).map((d, i) => h('div', {}, fmt.format(new Date(Date.now() + (i + 1) * 864e5)), h('i', {}, sky(d.code).icon), `${d.hi}° / ${d.lo}°`)));
      });
      // twelve months: bars for the daytime high, a line for the sea
      const NS = 'http://www.w3.org/2000/svg', el = (tag: string, a: Record<string, string | number>, txt?: string) => {
        const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v)); if (txt) e.textContent = txt; return e;
      };
      const chart = el('svg', { viewBox: '0 0 240 84', class: 'wchart', role: 'img', 'aria-label': t('wHigh') });
      const yOf = (v: number) => 66 - (Math.max(0, v) / 42) * 56;
      for (let i = 0; i < 12; i++) {
        const x = i * 20 + 3, col = el('g', { class: 'wcol' });
        col.append(el('title', {}, `${monthName(i, 'long')}: ${Math.round(c.hi[i])}° / ${Math.round(c.lo[i])}°${c.sea ? ` · ${t('wSeaLeg')} ${Math.round(c.sea[i])}°` : ''} · ${t('rainyDays').replace('{n}', String(c.rain[i]))}`));
        col.append(el('rect', { class: `wbar${i === m ? ' cur' : ''}`, x, y: yOf(c.hi[i]), width: 14, height: 66 - yOf(c.hi[i]), rx: 2 }));
        if (i === m) col.append(el('text', { class: 'v', x: x + 7, y: yOf(c.hi[i]) - 3 }, `${Math.round(c.hi[i])}°`));
        col.append(el('text', { x: x + 7, y: 78 }, (lang() === 'zh' ? String(i + 1) : monthName(i).slice(0, lang() === 'ar' ? 6 : 1).replace('.', ''))));
        chart.append(col);
      }
      if (c.sea) {
        chart.append(el('polyline', { class: 'wsealine', points: c.sea.map((v, i) => `${i * 20 + 10},${yOf(v).toFixed(1)}`).join(' ') }));
        c.sea.forEach((v, i) => chart.append(el('circle', { class: 'seadot', cx: i * 20 + 10, cy: yOf(v).toFixed(1), r: i === m ? 2.6 : 1.4 })));
      }
      const sum = t('wSummary').replace('{month}', monthName(m, 'long')).replace('{hi}', String(Math.round(c.hi[m]))).replace('{lo}', String(Math.round(c.lo[m])))
        .replace('{sea}', c.sea ? t('wSea').replace('{sea}', String(Math.round(c.sea[m]))) : '').replace('{n}', String(c.rain[m]));
      return h('div', { class: 'wbox' }, nowEl, daysEl, chart,
        h('div', { class: 'wleg' }, h('span', {}, h('i', { style: 'background:#e99b50' }), t('wHigh')), c.sea ? h('span', {}, h('i', { style: 'background:#6fd3ea' }), t('wSeaLeg')) : null),
        h('div', { class: 'wsum' }, sum),
        h('div', { class: 'wsrc' }, h('a', { href: 'https://open-meteo.com/', target: '_blank', rel: 'noopener' }, t('wSource'))));
    }
    function showTown(c: Climate) {
      state.active = null; map.setActive(null);
      openCard(h('div', { class: 'ocard-tags' }, h('span', { class: 'tag' }, t('layerWeather'))), h('h3', {}, tr(c.name)), weatherBox(c.lat, c.lon, c));
    }

    // ---------- journeys and my trip ----------
    const tripBox = h('div', { class: 'otrip' });
    const journeyBtns = h('div', { class: 'ojourneys' });
    /** The visitor's stops in a sensible order: start nearest to Tunis, then always the nearest next. */
    const ordered = (ids: string[]) => {
      const left = ids.map((id) => byId.get(id)!).filter(Boolean), out: Item[] = [];
      let at: [number, number] = TUNIS;
      while (left.length) {
        left.sort((a, b) => km(at, [a.lat, a.lon]) - km(at, [b.lat, b.lon]));
        const n = left.shift()!; out.push(n); at = [n.lat, n.lon];
      }
      return out;
    };
    const saveTrip = () => { try { localStorage.setItem('trip', JSON.stringify(trip)); } catch { /* private mode */ } };
    const drawJourney = (fit: boolean) => {
      for (const b of journeyBtns.children) b.classList.toggle('on', (b as HTMLElement).dataset.id === state.journey);
      (journeyBtns.lastChild as HTMLElement).lastChild!.textContent = trip.length ? ` ${trip.length}` : '';
      const j = ROUTES.find((x) => x.id === state.journey);
      const stops = state.journey === 'mine' ? ordered(trip) : j ? j.stops.map((id) => byId.get(id)!).filter(Boolean) : [];
      map.setRoute(stops.length > 1 ? stops.map((s) => [s.lat, s.lon] as [number, number]) : null);
      tripBox.replaceChildren();
      tripBox.classList.toggle('show', !!state.journey);
      if (!state.journey) return;
      let dist = 0, hrs = 0;
      for (let i = 1; i < stops.length; i++) { const d = drive([stops[i - 1].lat, stops[i - 1].lon], [stops[i].lat, stops[i].lon]); dist += d.km; hrs += d.h; }
      const mine = state.journey === 'mine';
      tripBox.append(h('div', { class: 'otrip-in' },
        h('div', { class: 'otrip-head' }, h('b', {}, mine ? t('myTrip') : tr(j!.name)),
          h('button', { class: 'x', 'aria-label': t('close'), onclick: () => { state.journey = null; drawJourney(false); } }, '×')),
        mine ? (stops.length ? null : h('p', {}, t('tripEmpty'))) : h('p', {}, tr(j!.text)),
        stops.length ? h('ol', {}, ...stops.map((s) => h('li', {}, h('button', { class: 'link', onclick: () => showItem(s, true) }, tr(s.name)), s.walk ? h('span', { class: 'tag3d' }, '3D') : null,
          mine ? h('a', { class: 'stop-hotel', href: hotelsUrl(`${s.hotels}, Tunisia`, datesFor(s.id)), target: '_blank', rel: 'noopener sponsored', title: t('hotelsNearby') }, '🛏') : null))) : null,
        stops.length > 1 ? h('div', { class: 'otrip-stats' }, t('tripStats').replace('{n}', String(stops.length)).replace('{km}', String(dist)).replace('{h}', fmtH(hrs))) : null,
        mine && stops.length > 1 ? h('div', { class: 'otrip-note' }, t('tripOrder')) : null,
        mine && stops.length ? (() => {
          const date = h('input', { type: 'date', value: tripDates.arrival, 'aria-label': t('arrival') });
          const nights = h('input', { type: 'number', min: '1', max: '14', value: String(tripDates.nights), 'aria-label': t('nightsPerStop') });
          date.addEventListener('change', () => { tripDates.arrival = date.value; saveDates(); drawJourney(false); refreshCard(); });
          nights.addEventListener('change', () => { tripDates.nights = Math.max(1, Math.min(14, Math.round(+nights.value || 2))); saveDates(); drawJourney(false); refreshCard(); });
          return h('div', { class: 'otrip-dates' }, h('label', {}, t('arrival'), date), h('label', {}, t('nightsPerStop'), nights), h('small', {}, t('tripDatesNote')));
        })() : null,
        mine && stops.length ? h('div', { class: 'row' },
          h('button', { class: 'btn glass sm', onclick: (e) => {
            const url = `${location.origin}${location.pathname}#/trip/${ordered(trip).map((s) => s.id).join(',')}`;
            void navigator.clipboard?.writeText(url).then(() => { (e.target as HTMLElement).textContent = t('copied'); });
          } }, t('copyLink')),
          h('button', { class: 'btn glass sm', onclick: () => { trip = []; saveTrip(); drawJourney(false); refreshCard(); } }, t('clear'))) : null,
      ));
      if (fit && stops.length > 1) { map.fitTo(stops.map((s) => [s.lat, s.lon])); if (narrow) hero.querySelector('.omapwrap')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
    };
    for (const j of JOURNEYS) journeyBtns.append(h('button', { class: 'chip', 'data-id': j.id, onclick: () => { state.journey = state.journey === j.id ? null : j.id; if (state.journey && state.cats.size) { state.cats.clear(); applyFilter(); } drawJourney(true); } }, tr(j.name)));
    journeyBtns.append(h('button', { class: 'chip mine', 'data-id': 'mine', onclick: () => { state.journey = state.journey === 'mine' ? null : 'mine'; drawJourney(true); } }, h('span', { class: 'ico' }, '★'), t('myTrip'), h('b', {})));

    // ---------- the card ----------
    const closeCard = () => { state.active = null; map.setActive(null); card.classList.remove('show', 'full'); };
    const closeBtn = () => h('button', { class: 'x', 'aria-label': t('close'), onclick: closeCard }, '×');
    const grab = () => {
      // on a phone the card is a sheet over the map: drag or tap the handle to open it fully or lower it
      const g = h('button', { class: 'grab', 'aria-label': t('expand') }, h('i', {}));
      let y0 = 0, dy = 0, dragging = false;
      g.addEventListener('pointerdown', (e) => { dragging = true; y0 = e.clientY; dy = 0; g.setPointerCapture(e.pointerId); card.classList.add('drag'); });
      g.addEventListener('pointermove', (e) => { if (!dragging) return; dy = e.clientY - y0; card.style.setProperty('--dy', `${Math.max(-120, dy)}px`); });
      const end = () => {
        if (!dragging) return; dragging = false; card.classList.remove('drag'); card.style.removeProperty('--dy');
        if (Math.abs(dy) < 6) state.sheet = state.sheet === 'full' ? 'peek' : 'full';
        else if (dy < -40) state.sheet = 'full';
        else if (dy > 120 && state.sheet === 'peek') { closeCard(); return; }
        else if (dy > 40) state.sheet = 'peek';
        card.classList.toggle('full', state.sheet === 'full');
      };
      g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
      return g;
    };
    const openCard = (...kids: (Node | null)[]) => {
      card.replaceChildren(grab(), closeBtn(), ...kids.filter((k): k is Node => !!k));
      card.classList.remove('show'); void card.offsetWidth;          // restart the entrance
      card.classList.add('show');
      card.classList.toggle('full', narrow && state.sheet === 'full');
      card.scrollTop = 0;
    };
    const fact = (k: string, v: string) => [h('dt', {}, k), h('dd', {}, v)];
    function showItem(s: Item, fly: boolean, quiet = false) {
      if (!visible(s)) { state.cats.clear(); applyFilter(); }   // picked from the search or a journey: show its pin
      state.active = s.id;
      map.setActive(s.id);
      const p: [number, number] = [s.lat, s.lon], d = drive(TUNIS, p), ap = nearest(AIRPORTS, p), st = nearest(STATIONS, p);
      const inTrip = trip.includes(s.id);
      const img = h('img', { class: 'ocard-img', src: BASE + s.photo, alt: tr(s.name), loading: 'lazy' });
      img.addEventListener('error', () => img.remove());
      const ev = eventsNear(s.lat, s.lon);
      const TABS = [['overview', t('tabOverview')], ['visit', t('tabVisit')], ['weather', t('layerWeather')], ['there', t('tabGetThere')]] as const;
      const body = h('div', { class: 'otab-body', role: 'tabpanel' });
      const tabBtns = TABS.map(([id, label]) => h('button', { role: 'tab', class: state.cardTab === id ? 'on' : '', 'aria-selected': String(state.cardTab === id), onclick: () => { state.cardTab = id; drawTab(); } }, label));
      const drawTab = () => {
        tabBtns.forEach((b, i) => { const on = TABS[i][0] === state.cardTab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
        const tab = state.cardTab;
        body.replaceChildren(...(tab === 'overview' ? [
          h('dl', {},
            ...fact(t('bestTime'), tr(BEST_TIME[s.cats[s.cats.length - 1]])),
            ...(d.km >= 15 ? fact(t('fromTunis'), t('byRoad').replace('{km}', String(d.km)).replace('{h}', fmtH(d.h))) : []),
            ...(ev.length ? fact(t('festivalsNear'), ev.map((e) => `${tr(e.name)} (${eventMonths(e)})`).join(' · ')) : [])),
        ] : tab === 'visit' ? [
          visitBox(s.id) ?? h('p', { class: 'onote' }, t('noVisitInfo')),
          h('a', { class: 'olink', href: toursUrl(`${s.name.en}, Tunisia`), target: '_blank', rel: 'noopener sponsored' }, icon('ticket', 16), `${t('toursHere')} ↗`),
        ] : tab === 'weather' ? [weatherBox(s.lat, s.lon)] : [
          h('dl', {},
            ...(d.km >= 15 ? fact(t('fromTunis'), t('byRoad').replace('{km}', String(d.km)).replace('{h}', fmtH(d.h))) : []),
            ...fact(t('nearestAirport'), t('kmAway').replace('{name}', `${tr(ap.x.name)} · ${ap.x.code}`).replace('{km}', String(Math.max(5, Math.round(ap.d / 5) * 5)))),
            ...(st.d <= 60 ? fact(t('nearestStation'), t('kmAway').replace('{name}', tr(st.x.name)).replace('{km}', String(Math.max(1, Math.round(st.d))))) : [])),
          h('a', { class: 'olink', href: `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`, target: '_blank', rel: 'noopener' }, icon('compass', 16), `${t('directions')} ↗`),
        ]));
        body.classList.remove('in'); void body.offsetWidth; body.classList.add('in');
      };
      drawTab();
      const shareBtn = h('button', { class: 'btn glass icon-only', 'aria-label': t('share'), title: t('share') }, icon('share', 18));
      shareBtn.addEventListener('click', () => void share(s, shareBtn));
      openCard(
        h('div', { class: 'ocard-photo' }, img, s.walk ? h('span', { class: 'badge' }, t('legendOpen')) : null),
        creditEl(s.id),
        h('div', { class: 'ocard-tags' }, ...s.cats.map((c) => h('span', { class: `tag c-${c}` }, t(CAT_KEY[c]))), s.unesco ? h('span', { class: 'tag' }, 'UNESCO') : null),
        h('h3', {}, tr(s.name)),
        h('p', {}, tr(s.text)),
        h('div', { class: 'ocard-acts' },
          s.walk ? h('button', { class: 'btn accent', onclick: () => openSite(s.id) }, `${t('walkIn3d')} →`) : null,
          hotelsBtn(s)),
        h('div', { class: 'otabs', role: 'tablist' }, ...tabBtns),
        body,
        h('div', { class: 'ocard-foot' },
          h('button', { class: `btn glass${inTrip ? ' on' : ''}`, onclick: () => {
            trip = inTrip ? trip.filter((x) => x !== s.id) : [...trip, s.id];
            saveTrip(); state.journey = 'mine'; drawJourney(false); plan?.refresh(); showItem(s, false, true);
          } }, icon('star', 16), inTrip ? t('removeTrip') : t('addTrip')),
          shareBtn),
      );
      if (fly) map.flyTo(s.lat, s.lon, 3.2);
      void quiet;
    }
    /** Opening hours and tickets of a monument, with the year they were checked. */
    function visitBox(id: string) {
      const v = VISITS[id];
      if (!v) return null;
      return h('div', { class: 'ovisit' }, h('b', {}, `🎫 ${t('visiting')}`),
        h('dl', {}, ...(v.hours ? fact(t('hoursL'), tr(v.hours)) : []), ...(v.price ? fact(t('ticketL'), tr(v.price)) : []), ...(v.closed ? fact(t('closedL'), tr(v.closed)) : [])),
        v.note ? h('p', {}, tr(v.note)) : null,
        h('small', {}, t('checkedIn').replace('{y}', String(v.year)), ' ', h('a', { href: v.source, target: '_blank', rel: 'noopener' }, `${t('source')} ↗`)));
    }
    /** Hotel dates for a place: its own nights when it is a stop of the trip, else the first nights of the trip. */
    const datesFor = (id: string) => {
      if (!tripDates.arrival) return undefined;
      const i = Math.max(0, ordered(trip).findIndex((s) => s.id === id));
      const checkin = addDays(tripDates.arrival, i * tripDates.nights);
      return { checkin, checkout: addDays(checkin, tripDates.nights) };
    };
    /** The page of a place (written at build time) in the current language. */
    const placeUrl = (id: string) => (SITE_URL ? `${SITE_URL}/${lang()}/${id}/` : new URL(`${lang()}/${id}/`, document.baseURI).href);
    const share = async (s: Item, btn: HTMLElement) => {
      const url = placeUrl(s.id), title = `${tr(s.name)} · ${t('brand')}`;
      try {
        if (navigator.share) { await navigator.share({ title, url }); return; }
        await navigator.clipboard.writeText(url); btn.textContent = `✓ ${t('copied')}`;
      } catch { /* cancelled */ }
    };
    /** A clear button to the hotels of the nearest town with places to stay. */
    function hotelsBtn(s: Item, small = false) {
      return h('a', { class: `btn hotels${small ? ' sm' : ''}`, href: hotelsUrl(`${s.hotels}, Tunisia`, datesFor(s.id)), target: '_blank', rel: 'noopener sponsored' },
        h('span', { class: 'hico', 'aria-hidden': 'true' }, icon('bed', 22)),
        h('span', { class: 'htxt' }, h('b', {}, t('hotelsNearby')), small ? null : h('small', {}, s.hotels)),
        h('span', { class: 'harrow', 'aria-hidden': 'true' }, '↗'));
    }
    const refreshCard = () => { const a = state.active ? byId.get(state.active) : null; if (a) showItem(a, false, true); };
    function showNote(title: string, text: string, ico: string | Node, extra: Node | null = null, tag = '') {
      state.active = null; map.setActive(null);
      openCard(h('div', { class: 'ocard-icon' }, ico), tag ? h('div', { class: 'ocard-tags' }, h('span', { class: 'tag' }, tag)) : null, h('h3', {}, title), h('p', {}, text), extra);
    }
    function showAnimal(a: Animal) {
      const g = animalGlyph(a.id);
      showNote(tr(a.name), tr(a.text), g ? svg('svg', { viewBox: '-12 -12 24 24', width: 64, height: 64 }, g) : a.icon, null, t('wildlifeTag'));
    }
    function showAirport(a: Airport) {
      const d = drive(TUNIS, [a.lat, a.lon]);
      showNote(`${tr(a.name)} · ${a.code}`, t(a.intl ? 'airportIntl' : 'airportDom'), '✈',
        d.km >= 15 ? h('dl', {}, ...fact(t('fromTunis'), t('byRoad').replace('{km}', String(d.km)).replace('{h}', fmtH(d.h)))) : null, t('layerTransport'));
    }
    function showLine(l: Line) {
      showNote(tr(l.name), [l.note ? tr(l.note) : '', t('transportNote')].filter(Boolean).join('. ').replace('..', '.'), l.kind === 'rail' ? '🚆' : l.kind === 'ferry' ? '⛴' : '🛣',
        null, t(l.kind === 'rail' ? 'railway' : l.kind === 'ferry' ? 'ferry' : 'motorway'));
    }

    // ---------- search, zoom buttons ----------
    const search = h('input', { class: 'osearch', type: 'search', placeholder: t('searchPlaces'), 'aria-label': t('searchPlaces'),
      role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'oresults', 'aria-autocomplete': 'list', autocomplete: 'off' });
    const results = h('ul', { class: 'oresults', id: 'oresults', role: 'listbox' });
    const searchBox = h('div', { class: 'osrch' }, search, results);
    const norm = (x: string) => x.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    let hits: Item[] = [], cur = -1;
    const miniIcon = (s: Item) => {
      const g = s.walk ? monumentIcon(s.id) : placeIcon(s.id);
      g.setAttribute('transform', s.walk ? 'scale(0.78)' : 'scale(0.66)');
      return svg('svg', { viewBox: '-14 -14 28 28', class: `ri ${s.walk ? 'walk' : `c-${s.cats[0]}`}`, 'aria-hidden': 'true' }, svg('circle', { r: 13 }), g);
    };
    const drawResults = () => {
      const q = norm(search.value.trim());
      hits = q ? items.filter((i) => norm(tr(i.name)).includes(q) || norm(i.name.en).includes(q)).slice(0, 8) : items.filter((i) => i.walk).slice(0, 8);
      cur = q && hits.length ? 0 : -1;
      results.replaceChildren(...(hits.length ? hits.map((s, i) => {
        const li = h('li', { role: 'option', id: `or-${i}`, class: i === cur ? 'on' : '' }, miniIcon(s),
          h('span', { class: 'rt' }, h('b', {}, tr(s.name)), h('small', {}, s.cats.map((c) => t(CAT_KEY[c])).join(' · '))), s.walk ? h('span', { class: 'tag3d' }, '3D') : null);
        li.addEventListener('pointerdown', (e) => { e.preventDefault(); pick(s); });
        return li;
      }) : [h('li', { class: 'none' }, '—')]));
      searchBox.classList.add('open'); search.setAttribute('aria-expanded', 'true');
    };
    const closeResults = () => { searchBox.classList.remove('open'); search.setAttribute('aria-expanded', 'false'); };
    const pick = (s: Item) => {
      closeResults(); search.value = ''; search.blur();
      showPlace(s.id);
    };
    search.addEventListener('input', drawResults);
    search.addEventListener('focus', drawResults);
    search.addEventListener('blur', () => setTimeout(closeResults, 120));
    search.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault(); if (!hits.length) return;
        cur = (cur + (k === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
        [...results.children].forEach((li, i) => li.classList.toggle('on', i === cur));
        search.setAttribute('aria-activedescendant', `or-${cur}`);
      } else if (k === 'Enter') { e.preventDefault(); const s = hits[Math.max(0, cur)]; if (s) pick(s); }
      else if (k === 'Escape') { closeResults(); search.blur(); }
    });
    const ctl = h('div', { class: 'octl' },
      h('button', { 'aria-label': t('zoomIn'), title: t('zoomIn'), onclick: () => map.zoomBy(1.7) }, '+'),
      h('button', { 'aria-label': t('zoomOut'), title: t('zoomOut'), onclick: () => map.zoomBy(1 / 1.7) }, '−'),
      h('button', { 'aria-label': t('resetView'), title: t('resetView'), onclick: () => map.home() }, '⌂'),
      h('button', { class: 'wide', onclick: () => { const pool = items.filter(visible); showItem(pool[Math.floor(Math.random() * pool.length)], true); } }, icon('dice', 17), t('surprise')));

    // ---------- the views ----------
    const toMap = () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    /** Open a place on the map, from anywhere. */
    function showPlace(id: string) {
      const s = byId.get(id); if (!s) return;
      navTo('explore');
      requestAnimationFrame(() => { toMap(); showItem(s, true); });
    }
    const ctx: ViewCtx = {
      place: (id) => byId.get(id), places: items, credit: creditEl,
      month: () => (state.wmonth >= 0 ? state.wmonth : thisMonth()),
      setMonth: (m) => { state.wmonth = m; refreshWeather(); refreshCard(); },
      showPlace,
      flyTo: (lat, lon) => { navTo('explore'); requestAnimationFrame(() => { toMap(); map.flyTo(lat, lon, 3.2); }); },
    };
    events = eventsView(ctx);
    plan = planView({
      stop: (id) => byId.get(id), trip: () => trip, setTrip: (ids) => { trip = ids; saveTrip(); drawJourney(false); refreshCard(); },
      ordered: () => ordered(trip), dates: tripDates, saveDates: () => { saveDates(); refreshCard(); }, datesFor,
      journeys: JOURNEYS, showPlace,
      showRoute: (id) => {
        if (state.cats.size) { state.cats.clear(); applyFilter(); }
        state.journey = id; navTo('explore');
        requestAnimationFrame(() => { toMap(); drawJourney(true); });
      },
      goExplore: () => navTo('explore'),
    });
    const viewEls: Record<View, HTMLElement> = {
      explore: h('div', { class: 'view vexplore' }), plan: plan.el, guide: guideView(), events: events.el, food: foodView(ctx),
    };
    const NAV: Record<View, [string, string, string]> = {
      explore: [t('navExplore'), t('tabMap'), 'map'], plan: [t('navPlan'), t('tabTrip'), 'trip'], guide: [t('navGuide'), t('tabGuide'), 'guide'],
      events: [t('navEvents'), t('tabEvents'), 'events'], food: [t('navFoodShort'), t('tabFood'), 'food'],
    };
    const ind = h('span', { class: 'ind', 'aria-hidden': 'true' });
    const topTabs = VIEWS.map((v) => h('a', { href: v === 'explore' ? '#/' : `#/${v}`, class: 'ttab', onclick: (e) => { e.preventDefault(); navTo(v); } }, NAV[v][0]));
    const botTabs = VIEWS.map((v) => h('a', { href: v === 'explore' ? '#/' : `#/${v}`, class: 'btab', onclick: (e) => { e.preventDefault(); navTo(v); } }, icon(NAV[v][2], 22), h('span', {}, NAV[v][1])));
    const moveInd = () => {
      const a = topTabs[VIEWS.indexOf(state.view)];
      if (!a || !a.offsetWidth) return;
      ind.style.width = `${a.offsetWidth}px`; ind.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    let stopReveal = () => {};
    /** Show a view (the map, the trip planner, the guide…). */
    function setView(v: View, animate = true) {
      const same = v === state.view && !firstRender;
      const apply = () => {
        state.view = v;
        for (const k of VIEWS) viewEls[k].hidden = k !== v;
        topTabs.forEach((a, i) => { const on = VIEWS[i] === v; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
        botTabs.forEach((a, i) => a.classList.toggle('on', VIEWS[i] === v));
        document.title = v === 'explore' ? `${t('brand')}: ${t('heroTitle')}` : `${NAV[v][0]} · ${t('brand')}`;
        card.classList.toggle('hide', v !== 'explore');
        trackView(v === 'explore' ? (firstRender ? location.pathname : `/${lang()}/`) : `/${lang()}/${v}/`);
        if (v === 'explore') map.layout();
        moveInd();
        stopReveal(); stopReveal = reveal(viewEls[v]);
      };
      if (same) return;
      if (!firstRender) window.scrollTo({ top: 0 });
      type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
      const vt = (document as Document & { startViewTransition?: (f: () => void) => VT }).startViewTransition;
      if (animate && !firstRender && !reduced && vt) {
        // a transition can be skipped (the window resized, another view chosen): the view still changes, so ignore that
        const tr = vt.call(document, apply);
        for (const p of [tr.ready, tr.finished, tr.updateCallbackDone]) p.catch(() => {});
      } else apply();
    }
    function navTo(v: View) {
      setView(v);
      const want = v === 'explore' ? '#/' : `#/${v}`;
      if (location.hash !== want && !(v === 'explore' && !location.hash)) history.pushState(null, '', want);
    }
    goView = (hash) => {
      if (hash === 'places') { setView('explore'); requestAnimationFrame(() => document.getElementById('places')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })); return; }
      if (hash === 'itineraries') { setView('plan'); return; }
      setView((VIEWS as string[]).includes(hash) ? hash as View : 'explore');
    };

    // ---------- hero ----------
    const title = t('heroTitle'), em = t('heroEm');
    const k = title.indexOf(em);
    const h1 = h('h1', {}, ...(k >= 0 ? [title.slice(0, k), h('em', {}, em), title.slice(k + em.length)] : [title]));
    panel.append(
      h('div', { class: 'ohead' }, h('div', { class: 'eyebrow' }, h('span', { class: 'spark' }), t('heroEyebrow')), h1, h('p', { class: 'lead' }, t('heroText'))),
      h('div', { class: 'ofilters' }, chips(), h('div', { class: 'olabel' }, t('mapLayers')), h('div', { class: 'ochips olayers' }, toggle('wildlife', t('layerWildlife'), icon('wildlife', 20)), toggle('transport', t('layerTransport'), icon('transport', 20)), toggle('weather', t('layerWeather'), icon('weather', 20))), months, wnote),
      h('div', { class: 'ojbox' }, h('div', { class: 'olabel' }, t('journeys')), journeyBtns, tripBox),
    );
    hero.append(
      h('div', { class: 'osea' }),
      h('div', { class: 'omapwrap' }, map.el, ctl, scale, hint),
      panel,
      card,
      h('a', { class: 'scroll-cue', href: '#/places' }, t('scrollCue'), h('span', { class: 'chev' })),
    );
    const topbar = h('header', { class: 'otop' },
      h('a', { class: 'logo', href: '#/', onclick: (e) => { e.preventDefault(); navTo('explore'); toMap(); } }, h('img', { src: `${BASE}logo.svg`, alt: '', width: '32', height: '32' }), t('brand')), searchBox,
      h('nav', { class: 'ttabs', 'aria-label': t('brand') }, ind, ...topTabs), h('div', { class: 'spacer' }), langMenu());
    const bottombar = h('nav', { class: 'obot', 'aria-label': t('brand') }, ...botTabs);

    // ---------- all the places ----------
    const grid = h('div', { class: 'mcards' });
    for (const s of items) {
      const img = h('img', { class: 'mcard-img', src: BASE + s.photo, alt: tr(s.name), loading: 'lazy' });
      img.addEventListener('error', () => img.remove());
      const onMap = () => { toMap(); showItem(s, true); };
      const c = h('article', { class: `mcard${s.walk ? ' ready' : ''}` },
        img,
        h('div', { class: 'mcard-body' },
          h('div', { class: 'mcard-tag' }, ...s.cats.map((x) => h('span', { class: `c-${x}` }, h('i', { class: 'dot' }), t(CAT_KEY[x]))), s.walk ? h('b', {}, t('walkIn3d')) : null),
          h('h3', {}, (() => { const a = h('a', { href: `${lang()}/${s.id}/` }, tr(s.name)); a.addEventListener('click', (e) => { e.preventDefault(); onMap(); }); return a; })()),
          h('p', {}, tr(s.text) + (s.walk && s.unesco ? ' · UNESCO' : '')),
          h('div', { class: 'row' },
            s.walk ? h('button', { class: 'btn accent', onclick: () => openSite(s.id) }, t('open')) : null,
            hotelsBtn(s, true),
            h('button', { class: 'btn glass', onclick: onMap }, t('showOnMap'))),
          creditEl(s.id)));
      cardEls.set(s.id, c);
      grid.append(c);
    }
    const teaser = (v: View, title: string, img: string) => {
      const a = h('a', { class: 'oteaser', href: `#/${v}`, 'data-reveal': '', onclick: (e) => { e.preventDefault(); navTo(v); } },
        photoEl(img, ''), h('span', { class: 'ot-in' }, h('b', {}, title), icon('arrow', 22)));
      return a;
    };
    const teasers = h('section', { class: 'oteasers' },
      teaser('plan', t('navPlan'), 'photos/places/ksar-ghilane.jpg'),
      teaser('guide', t('navGuide'), 'photos/sites/tunis-medina.jpg'),
      teaser('events', t('teaserEvents').replace('{month}', monthName(thisMonth(), 'long')), 'photos/el-jem/p22.jpg'),
      teaser('food', t('foodTitle'), 'photos/food/couscous.jpg'));
    teasers.querySelectorAll<HTMLElement>('.oteaser').forEach((e, i) => e.style.setProperty('--i', String(i)));
    const places = h('section', { class: 'omonuments', id: 'places' },
      h('div', { class: 'eyebrow' }, h('span', { class: 'spark' }), t('mapTitle')),
      h('h2', {}, t('placesTitle')),
      h('p', {}, t('placesText')),
      h('div', { class: 'ofilterbar' }, chips(), count),
      grid);

    const footer = h('footer', { class: 'footer ofooter' },
      h('span', {}, `© ${t('brand')}`),
      h('span', { class: 'indep' }, t('independent')),
      installBtn(),
      h('button', { class: 'link', onclick: () => openCredits() }, t('credits')));

    viewEls.explore.append(hero, teasers, places);
    root.append(h('div', { class: 'olanding' }, topbar, ...VIEWS.map((v) => viewEls[v]), footer, bottombar));
    setView(state.view, false);
    requestAnimationFrame(moveInd);
    void document.fonts?.ready.then(moveInd);
    // the tabs change size when their font arrives (Arabic, Chinese) or the language changes: follow them
    const tabsRO = new ResizeObserver(moveInd);
    topTabs.forEach((a) => tabsRO.observe(a));
    map.layout();
    applyFilter();
    drawJourney(false);
    if (state.weather) refreshWeather();

    // open a card once the pins have landed: the last one looked at, or El Jem
    const first = byId.get(state.active ?? 'el-jem')!;
    const fly = firstRender && !!startPlace;
    const timer = setTimeout(() => { if (!narrow || state.active) showItem(first, fly, true); }, firstRender && !reduced ? (fly ? 1800 : 2800) : 0);
    if (firstRender && state.journey === 'mine') setTimeout(() => drawJourney(true), 400);
    const mapIO = new IntersectionObserver(([e]) => card.classList.toggle('offmap', !e.isIntersecting), { threshold: 0.15 });
    mapIO.observe(hero.querySelector('.omapwrap')!);
    const onResize = () => { if ((innerWidth < 1080) !== narrow) render(); else { map.layout(); moveInd(); } };
    addEventListener('resize', onResize);
    cleanup = () => { clearTimeout(timer); removeEventListener('resize', onResize); mapIO.disconnect(); tabsRO.disconnect(); stopReveal(); map.destroy(); };
    firstRender = false;
  };

  render();
  const off = onLangChange(render);
  return () => { off(); cleanup?.(); };
}
