/**
 * The language menu: a button with the current language's flag and code, opening a list of every language
 * with its flag and its own name. Flags are drawn in SVG (flag emoji do not show on Windows).
 * Arabic carries the flag of Tunisia, the country the site is about.
 */
import { LANGS, lang, onLangChange, setLang, type Lang } from '../i18n';
import { h } from './dom';

const NS = 'http://www.w3.org/2000/svg';
type Part = [string, Record<string, string | number>];
const r = (x: number, y: number, w: number, hh: number, fill: string): Part => ['rect', { x, y, width: w, height: hh, fill }];
const star = (cx: number, cy: number, R: number, fill: string, rot = 0): Part => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.42 : R;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`;
  }
  return ['path', { d: d + 'Z', fill }];
};
// all flags on a 30 × 20 box
const FLAGS: Record<Lang, Part[]> = {
  en: [r(0, 0, 30, 20, '#012169'), ['path', { d: 'M0,0 L30,20 M30,0 L0,20', stroke: '#fff', 'stroke-width': 4 }], ['path', { d: 'M0,0 L30,20 M30,0 L0,20', stroke: '#C8102E', 'stroke-width': 1.4 }],
    r(12.5, 0, 5, 20, '#fff'), r(0, 7.5, 30, 5, '#fff'), r(13.5, 0, 3, 20, '#C8102E'), r(0, 8.5, 30, 3, '#C8102E')],
  fr: [r(0, 0, 10, 20, '#0055A4'), r(10, 0, 10, 20, '#fff'), r(20, 0, 10, 20, '#EF4135')],
  ar: [r(0, 0, 30, 20, '#E70013'), ['circle', { cx: 15, cy: 10, r: 5, fill: '#fff' }], ['circle', { cx: 14.6, cy: 10, r: 3.7, fill: '#E70013' }], ['circle', { cx: 15.6, cy: 10, r: 3, fill: '#fff' }], star(16.4, 10, 1.9, '#E70013', Math.PI / 2)],
  de: [r(0, 0, 30, 6.7, '#000'), r(0, 6.67, 30, 6.7, '#DD0000'), r(0, 13.33, 30, 6.7, '#FFCE00')],
  it: [r(0, 0, 10, 20, '#009246'), r(10, 0, 10, 20, '#fff'), r(20, 0, 10, 20, '#CE2B37')],
  es: [r(0, 0, 30, 20, '#AA151B'), r(0, 5, 30, 10, '#F1BF00')],
  ru: [r(0, 0, 30, 6.7, '#fff'), r(0, 6.67, 30, 6.7, '#0039A6'), r(0, 13.33, 30, 6.7, '#D52B1E')],
  uk: [r(0, 0, 30, 10, '#0057B7'), r(0, 10, 30, 10, '#FFD700')],
  pl: [r(0, 0, 30, 10, '#fff'), r(0, 10, 30, 10, '#DC143C')],
  cs: [r(0, 0, 30, 10, '#fff'), r(0, 10, 30, 10, '#D7141A'), ['path', { d: 'M0,0 L15,10 L0,20Z', fill: '#11457E' }]],
  nl: [r(0, 0, 30, 6.7, '#AE1C28'), r(0, 6.67, 30, 6.7, '#fff'), r(0, 13.33, 30, 6.7, '#21468B')],
  zh: [r(0, 0, 30, 20, '#DE2910'), star(5, 5, 3, '#FFDE00'), star(10, 2, 1, '#FFDE00'), star(12, 4, 1, '#FFDE00'), star(12, 7, 1, '#FFDE00'), star(10, 9, 1, '#FFDE00')],
};
export function flag(l: Lang, w = 22): SVGSVGElement {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 30 20'); s.setAttribute('width', String(w)); s.setAttribute('height', String((w * 2) / 3));
  s.setAttribute('class', 'flag'); s.setAttribute('aria-hidden', 'true');
  for (const [tag, a] of FLAGS[l]) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v)); s.append(e); }
  return s;
}

/** The language button and its menu. */
export function langMenu(): HTMLElement {
  const cur = lang();
  const label = LANGS.find((x) => x.id === cur)!.label;
  const btn = h('button', { class: 'lm-btn', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': `Language: ${label}`, title: label },
    flag(cur), h('span', { class: 'lm-code' }, cur.toUpperCase()), h('span', { class: 'lm-chev' }));
  const list = h('ul', { class: 'lm-list', role: 'listbox', 'aria-label': 'Language' });
  const items = LANGS.map((x) => {
    const li = h('li', { role: 'option', 'aria-selected': String(x.id === cur), tabindex: '-1', lang: x.id, class: x.id === cur ? 'on' : '' },
      flag(x.id), h('span', { class: 'lm-name' }, x.label), h('span', { class: 'lm-c' }, x.id.toUpperCase()));
    li.addEventListener('click', () => { close(); if (x.id !== lang()) void setLang(x.id); });
    li.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key, i = items.indexOf(li);
      if (k === 'Enter' || k === ' ') { e.preventDefault(); li.click(); }
      else if (k === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (k === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (k === 'Escape') { close(); btn.focus(); }
    });
    list.append(li);
    return li;
  });
  const wrap = h('div', { class: 'lm' }, btn, list);
  const onDoc = (e: Event) => { if (!wrap.contains(e.target as Node)) close(); };
  function open() {
    wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onDoc);
    (items.find((x) => x.classList.contains('on')) ?? items[0]).focus();
  }
  function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', onDoc); }
  // follow the language when it changes elsewhere (pages that are not redrawn keep this menu)
  const off = onLangChange(() => {
    if (!wrap.isConnected) { off(); return; }
    const l = lang(), name = LANGS.find((x) => x.id === l)!.label;
    btn.replaceChildren(flag(l), h('span', { class: 'lm-code' }, l.toUpperCase()), h('span', { class: 'lm-chev' }));
    btn.setAttribute('aria-label', `Language: ${name}`); btn.title = name;
    items.forEach((li, i) => { const on = LANGS[i].id === l; li.classList.toggle('on', on); li.setAttribute('aria-selected', String(on)); });
  });
  btn.addEventListener('click', () => (wrap.classList.contains('open') ? close() : open()));
  btn.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'ArrowDown') { e.preventDefault(); open(); } });
  return wrap;
}
