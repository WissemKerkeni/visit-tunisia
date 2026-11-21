/**
 * Three views of the home page: Before you go (with a dinar converter), What's on (festivals by month) and Food
 * (dishes with photos, and a few words of Tunisian Arabic). Content in src/content/guide.ts.
 */
import { DISHES, EVENTS, PHRASES, PHRASE_SOURCES, PRACTICAL, type DishKind, type Event } from '../content/guide';
import { km } from '../content/atlas';
import { lang, t, tr, type T1 } from '../i18n';
import { h } from './dom';
import { icon } from './icons';
import { stagger } from './reveal';
import { monthName } from './weather';

const BASE = import.meta.env.BASE_URL;

export interface ViewCtx {
  place: (id: string) => { name: T1; photo: string } | undefined;
  /** Every place with its photo, to find the one nearest an event. */
  places: { id: string; lat: number; lon: number; photo: string }[];
  /** The month shown (0–11), shared with the weather layer. */
  month: () => number;
  setMonth: (m: number) => void;
  /** Open a place's card on the map. */
  showPlace: (id: string) => void;
  /** Fly the map to a point (an event far from any place). */
  flyTo: (lat: number, lon: number) => void;
  /** The photo credit line of a photo (by its id). */
  credit: (id: string) => HTMLElement;
}

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const srcLinks = (urls: string[]) => h('p', { class: 'gsrc' }, `${t('sources')}: `,
  ...urls.flatMap((u, i) => [i ? ' · ' : '', h('a', { href: u, target: '_blank', rel: 'noopener' }, host(u))]));
const monthsText = (ms: number[]) => ms.map((m) => monthName(m - 1, 'long')).join(' – ');
export const photo = (src: string, alt: string, cls = 'gphoto') => {
  const img = h('img', { src: BASE + src, alt, loading: 'lazy', decoding: 'async' });
  img.addEventListener('error', () => img.parentElement?.classList.add('nophoto'));
  return h('div', { class: cls }, img);
};
/** The header of a view: eyebrow, title, one line. */
export const viewHead = (eyebrow: string, title: string, text: string, extra: Node | null = null) =>
  h('header', { class: 'vhead' }, h('div', { class: 'eyebrow' }, h('span', { class: 'spark' }), eyebrow), h('h2', {}, title), h('p', {}, text), extra);

/** Events near a point (for a place's card). */
export const eventsNear = (lat: number, lon: number, r = 12) => EVENTS.filter((e) => km([lat, lon], [e.lat, e.lon]) <= r);
export const eventMonths = (e: Event) => monthsText(e.months);

// ---------- before you go ----------
export function guideView() {
  const tiles = PRACTICAL.map((s) => h('article', { class: `gtile t-${s.id}` },
    h('div', { class: 'gtile-ico', 'aria-hidden': 'true' }, s.icon),
    h('h3', {}, tr(s.title)),
    s.id === 'money' ? converter() : null,
    h('ul', {}, ...s.points.map((p) => h('li', {}, tr(p)))),
    srcLinks(s.sources)));
  return h('section', { class: 'view vguide', id: 'guide' },
    viewHead(t('navGuide'), t('guideTitle'), t('guideText')),
    h('div', { class: 'gtiles' }, ...stagger(tiles)));
}

// ---------- what's on ----------
export function eventsView(ctx: ViewCtx) {
  const mbar = h('div', { class: 'gmonths', role: 'group', 'aria-label': t('eventsTitle') });
  const list = h('div', { class: 'gevents' });
  const btns = Array.from({ length: 12 }, (_, m) => {
    const b = h('button', { class: 'chip', onclick: () => ctx.setMonth(m) }, monthName(m));
    mbar.append(b); return b;
  });
  const near = (e: Event) => ctx.places.map((p) => ({ p, d: km([e.lat, e.lon], [p.lat, p.lon]) })).sort((a, b) => a.d - b.d)[0];
  const draw = () => {
    const m = ctx.month();
    btns.forEach((b, i) => { b.classList.toggle('on', i === m); b.setAttribute('aria-pressed', String(i === m)); });
    const evs = EVENTS.filter((e) => e.months.includes(m + 1));
    list.replaceChildren(...(evs.length ? stagger(evs.map((e) => {
      const n = near(e), close = !!n && n.d <= 25;
      return h('article', { class: 'gevent' },
        close ? photo(n.p.photo, tr(e.name)) : h('div', { class: 'gphoto nophoto' }),
        h('div', { class: 'gbody' },
          h('div', { class: 'gwhen' }, icon('calendar', 14), monthsText(e.months)),
          h('h3', {}, tr(e.name)), h('div', { class: 'gtown' }, icon('pin', 14), e.town),
          h('p', {}, tr(e.text)),
          h('div', { class: 'row' },
            h('button', { class: 'btn glass sm', onclick: () => (close && n.d <= 20 ? ctx.showPlace(n.p.id) : ctx.flyTo(e.lat, e.lon)) }, icon('map', 15), t('showOnMap')),
            h('a', { class: 'gmore', href: e.source, target: '_blank', rel: 'noopener' }, `${t('source')} ↗`))));
    })) : [h('p', { class: 'gnone' }, t('noEvents').replace('{month}', monthName(m, 'long')))]));
    // the cards just drawn are on screen already: show them now, one after another
    requestAnimationFrame(() => list.querySelectorAll('[data-reveal]').forEach((x) => x.classList.add('in')));
  };
  draw();
  const el = h('section', { class: 'view vevents', id: 'events' },
    viewHead(t('navEvents'), t('eventsTitle'), t('eventsText')), h('div', { class: 'gmonths-wrap' }, mbar), list);
  return { el, refresh: draw };
}

// ---------- food ----------
type KindKey = 'fAll' | 'fStreet' | 'fMain' | 'fSweet' | 'fProducts';
const KINDS: { id: DishKind | 'all'; key: KindKey }[] = [
  { id: 'all', key: 'fAll' }, { id: 'street', key: 'fStreet' }, { id: 'main', key: 'fMain' }, { id: 'sweet', key: 'fSweet' }, { id: 'product', key: 'fProducts' },
];
export function foodView(ctx: ViewCtx) {
  let kind: DishKind | 'all' = 'all';
  const cards = DISHES.map((d, i) => {
    const pl = d.place ? ctx.place(d.place) : undefined;
    return h('article', { class: `gdish${i === 0 ? ' big' : ''}`, 'data-kind': d.kind },
      h('div', { class: 'gdish-photo' }, photo(`photos/food/${d.id}.jpg`, d.name),
        h('div', { class: 'gtags' }, d.where ? h('span', { class: 'gtag' }, icon('pin', 12), tr(d.where)) : null, h('span', { class: 'gtag k' }, t(KINDS.find((k) => k.id === d.kind)!.key)))),
      h('div', { class: 'gbody' },
        h('h3', {}, h('span', {}, d.name), h('span', { class: 'gar', lang: 'ar', dir: 'rtl' }, d.ar)),
        h('p', {}, tr(d.text)),
        h('div', { class: 'row' },
          pl ? h('button', { class: 'link gmore', onclick: () => ctx.showPlace(d.place!) }, icon('map', 14), ` ${tr(pl.name)} →`) : null,
          h('a', { class: 'gmore', href: d.source, target: '_blank', rel: 'noopener' }, `${t('source')} ↗`)),
        ctx.credit(d.id)));
  });
  const grid = h('div', { class: 'gdishes' }, ...stagger(cards));
  const chips = KINDS.map((k) => h('button', { class: `chip${k.id === 'all' ? ' on' : ''}`, onclick: () => {
    kind = k.id;
    chips.forEach((c, j) => c.classList.toggle('on', KINDS[j].id === kind));
    cards.forEach((c) => { const on = kind === 'all' || c.dataset.kind === kind; c.hidden = !on; if (on) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } });
    grid.classList.toggle('filtered', kind !== 'all');
  } }, t(k.key)));
  const phrases = h('div', { class: 'gphrases', role: 'table' },
    ...PHRASES.map((p) => h('div', { class: 'gphrase', role: 'row' },
      h('b', { role: 'cell', lang: 'aeb-Latn' }, p.tr), h('span', { role: 'cell', class: 'gar', lang: 'aeb', dir: 'rtl' }, p.ar), h('span', { role: 'cell' }, tr(p.en)))));
  return h('section', { class: 'view vfood', id: 'food' },
    viewHead(t('navFood'), t('foodTitle'), t('foodText'), h('div', { class: 'ochips gkinds' }, ...chips)),
    grid,
    h('div', { class: 'gwords', 'data-reveal': '' }, h('h3', { class: 'gsub' }, t('phrasesTitle')), h('p', {}, t('phrasesText')), phrases, srcLinks(PHRASE_SOURCES)));
}

// ---------- the dinar converter ----------
interface Rates { rates: Record<string, number>; time: number }
const CUR = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'RUB', 'UAH', 'PLN', 'CZK', 'CNY', 'SAR', 'AED', 'DZD', 'LYD'];
const LANG_CUR: Record<string, string> = { ru: 'RUB', uk: 'UAH', pl: 'PLN', cs: 'CZK', zh: 'CNY' };
let ratesP: Promise<Rates | null> | null = null;
/** Daily rates against the dinar (free, from open.er-api.com, with attribution), kept for 12 hours. */
function rates(): Promise<Rates | null> {
  try { const c = JSON.parse(localStorage.getItem('rates') ?? 'null') as Rates | null; if (c && Date.now() - c.time < 12 * 3600e3) return Promise.resolve(c); } catch { /* none */ }
  ratesP ??= fetch('https://open.er-api.com/v6/latest/TND').then((r) => r.json()).then((j: { result: string; rates: Record<string, number> }) => {
    if (j.result !== 'success') return null;
    const v = { rates: j.rates, time: Date.now() };
    try { localStorage.setItem('rates', JSON.stringify(v)); } catch { /* private mode */ }
    return v;
  }).catch(() => null);
  return ratesP;
}
function converter() {
  const amount = h('input', { type: 'number', min: '0', step: 'any', value: '100', 'aria-label': t('amount') });
  const cur = h('select', { 'aria-label': t('currency') }, ...CUR.map((c) => h('option', { value: c }, c)));
  cur.value = LANG_CUR[lang()] ?? 'EUR';
  const out = h('output', {}, '…'), back = h('div', { class: 'gconv-back' });
  const box = h('div', { class: 'gconv' }, h('b', {}, t('converterTitle')),
    h('div', { class: 'gconv-row' }, h('div', { class: 'gconv-in' }, amount, cur), h('span', { class: 'gconv-eq', 'aria-hidden': 'true' }, '⇄'),
      h('div', { class: 'gconv-out' }, out, h('small', {}, 'TND'))), back,
    h('small', {}, t('converterNote'), ' ', h('a', { href: 'https://www.exchangerate-api.com', target: '_blank', rel: 'noopener' }, t('ratesBy'))));
  const num = (n: number) => new Intl.NumberFormat(lang() === 'ar' ? 'ar-TN' : lang(), { maximumFractionDigits: 1 }).format(n);
  const fmt = (n: number, c: string) => new Intl.NumberFormat(lang() === 'ar' ? 'ar-TN' : lang(), { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(n);
  const draw = (r: Rates | null) => {
    if (!r || !r.rates[cur.value]) { box.classList.add('off'); out.textContent = t('converterOff'); back.textContent = ''; return; }
    const perTnd = r.rates[cur.value], a = Math.max(0, +amount.value || 0);
    out.textContent = num(a / perTnd);
    back.textContent = `1 TND = ${fmt(perTnd, cur.value)}`;
  };
  const go = () => void rates().then(draw);
  amount.addEventListener('input', go); cur.addEventListener('change', go);
  // fetch only when the converter comes on screen
  const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { io.disconnect(); go(); } });
  queueMicrotask(() => io.observe(box));
  return box;
}
