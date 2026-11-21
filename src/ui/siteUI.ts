import { Viewer, type Mode, type Quality, type ScreenHotspot } from '../viewer/Viewer';
import { Ambience } from '../viewer/audio';
import type { Hotspot, SiteDef } from '../sites/types';
import { onLangChange, t, tr, type UIKey } from '../i18n';
import { langMenu } from './lang-menu';
import { hotelsUrl, toursUrl } from '../config';
import { HOTEL_TOWN } from '../content/sites';
import { creditLine, h, loadPhotoCredits, type PhotoCredit } from './dom';
import { openCredits } from './credits';

const BASE = import.meta.env.BASE_URL;

export async function mountSite(root: HTMLElement, site: SiteDef, goHome: () => void) {
  const INFO = site.info, HOTSPOTS = site.hotspots;
  root.innerHTML = '';
  const stage = h('div', { class: 'site' });
  const overlay = h('div', { class: 'overlay' });
  stage.append(overlay);
  root.append(stage);

  const loader = h('div', { class: 'loader' },
    h('div', { class: 'loader-title' }, tr(INFO.name)),
    h('div', { class: 'loader-text' }, tr(INFO.loading)),
    h('div', { class: 'bar' }, h('div', { class: 'bar-fill' })));
  stage.append(loader);
  const fill = loader.querySelector('.bar-fill') as HTMLDivElement;

  const quality: Quality = matchMedia('(pointer: coarse)').matches ? 'medium' : 'high';
  let viewer: Viewer;
  try {
    viewer = new Viewer(stage, overlay, quality, site);
  } catch (err) {
    console.error(err);
    loader.replaceChildren(h('div', { class: 'loader-text' }, t('webglError')));
    return () => {};
  }
  if (import.meta.env.DEV) {
    const w = window as unknown as { __viewer: Viewer; __snap: (p: string) => Promise<string[]> };
    w.__viewer = viewer;
    w.__snap = async (p) => (await import('../dev/snapshots')).snapAll(viewer, p);
  }
  const ambience = new Ambience();
  const credits = await loadPhotoCredits(site.photos);

  // ---- HUD ----
  const markers = new Map<string, HTMLButtonElement>();
  const markerLayer = h('div', { class: 'markers' });
  overlay.append(markerLayer);
  for (const hs of HOTSPOTS) {
    const b = h('button', { class: 'marker', 'aria-label': tr(hs.title), onclick: () => openCard(hs) }, h('span', { class: 'marker-dot' }));
    b.append(h('span', { class: 'marker-label' }, tr(hs.title)));
    markers.set(hs.id, b);
    markerLayer.append(b);
  }
  const crosshair = h('div', { class: 'crosshair' });
  overlay.append(crosshair);

  const topBar = h('div', { class: 'topbar' });
  const backBtn = h('button', { class: 'btn ghost', onclick: () => goHome() });
  const titleEl = h('div', { class: 'site-title' });
  const placesBtn = h('button', { class: 'btn ghost', onclick: () => togglePlaces() });
  const visitBtn = h('button', { class: 'btn accent', onclick: () => openVisit() });
  const ls = langMenu();
  topBar.append(backBtn, titleEl, h('div', { class: 'spacer' }), placesBtn, visitBtn, ls);
  overlay.append(topBar);

  const intro = h('div', { class: 'intro-panel' });
  overlay.append(intro);

  const bottom = h('div', { class: 'bottombar' });
  const timeLabel = h('label', { class: 'ctl' });
  const time = h('input', { type: 'range', min: '5', max: '21.5', step: '0.05', value: '14.5', 'aria-label': 'time' }) as HTMLInputElement;
  const timeVal = h('span', { class: 'time-val' });
  const qualitySel = h('select', { class: 'ctl-select', 'aria-label': 'quality' }) as HTMLSelectElement;
  const speedSel = h('select', { class: 'ctl-select', 'aria-label': 'walking speed' }) as HTMLSelectElement;
  const soundBtn = h('button', { class: 'btn ghost small' });
  const photoBtn = h('button', { class: 'btn ghost small', onclick: () => photoMode(true) });
  const hint = h('div', { class: 'hint' });
  bottom.append(timeLabel, speedSel, qualitySel, soundBtn, photoBtn);

  // walking speed: remembered per visitor, also changed with + / - keys
  const SPEEDS: { v: number; key: UIKey }[] = [
    { v: 0.5, key: 'speedSlow' }, { v: 1, key: 'speedNormal' }, { v: 2, key: 'speedFast' }, { v: 4, key: 'speedVeryFast' },
  ];
  let speed = 1;
  try { const s = Number(localStorage.getItem('walkSpeed')); if (SPEEDS.some((x) => x.v === s)) speed = s; } catch { /* storage blocked */ }
  const setSpeed = (v: number) => {
    speed = v;
    if (viewer.player) viewer.player.speedFactor = v;
    speedSel.value = String(v);
    try { localStorage.setItem('walkSpeed', String(v)); } catch { /* ignore */ }
  };
  speedSel.addEventListener('change', () => setSpeed(Number(speedSel.value)));
  overlay.append(bottom, hint);

  const card = h('aside', { class: 'card', 'aria-live': 'polite' });
  const places = h('aside', { class: 'places' });
  const modal = h('div', { class: 'modal' });
  const photoBar = h('div', { class: 'photobar' });
  overlay.append(card, places, modal, photoBar);

  const render = () => {
    backBtn.textContent = '← ' + t('back');
    titleEl.textContent = tr(INFO.name);
    placesBtn.textContent = t('places');
    visitBtn.textContent = t('planVisit');
    timeLabel.replaceChildren(h('span', {}, t('time')), time, timeVal);
    qualitySel.replaceChildren(...(['low', 'medium', 'high'] as Quality[]).map((q) =>
      h('option', { value: q, selected: q === viewer.quality }, `${t('quality')}: ${t(q)}`)));
    speedSel.replaceChildren(...SPEEDS.map((s) =>
      h('option', { value: String(s.v), selected: s.v === speed }, `${t('speed')}: ${t(s.key)} (${s.v}×)`)));
    soundBtn.textContent = `${t('sound')}: ${ambience.enabled ? t('on') : t('off')}`;
    photoBtn.textContent = t('photoMode');
    intro.replaceChildren(
      h('h1', {}, tr(INFO.name)),
      h('p', {}, tr(INFO.intro)),
      h('ul', { class: 'facts' }, ...INFO.facts.map((f) => h('li', {}, h('b', {}, tr(f.k)), ' ', tr(f.v)))),
      h('button', { class: 'btn accent big', onclick: () => start() }, t('startWalk')),
      h('p', { class: 'note' }, tr(INFO.note)),
    );
    hint.textContent = viewer.input.isTouch ? t('controlsTouch') : t('controlsDesktop');
    for (const hs of HOTSPOTS) {
      const m = markers.get(hs.id)!;
      m.setAttribute('aria-label', tr(hs.title));
      (m.querySelector('.marker-label') as HTMLElement).textContent = tr(hs.title);
    }
    renderPlaces();
    if (card.dataset.id) openCard(HOTSPOTS.find((x) => x.id === card.dataset.id)!);
    if (modal.classList.contains('open')) openVisit();
    updateTimeLabel();
  };

  const updateTimeLabel = () => {
    const v = Number(time.value);
    const hh = Math.floor(v), mm = Math.round((v - hh) * 60);
    timeVal.textContent = `${String(hh).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
  };
  time.addEventListener('input', () => { viewer.setTime(Number(time.value)); updateTimeLabel(); });
  qualitySel.addEventListener('change', () => viewer.setQuality(qualitySel.value as Quality));
  soundBtn.addEventListener('click', () => {
    if (!ambience.enabled) ambience.start(); else ambience.setEnabled(false);
    render();
  });

  function start() {
    ambience.start();
    viewer.startWalk();
    render();
  }

  function photoFor(id?: string): PhotoCredit | undefined { return id ? credits[id] : undefined; }

  function openCard(hs: Hotspot) {
    card.dataset.id = hs.id;
    const p = photoFor(hs.photo);
    const kids: Node[] = [h('button', { class: 'x', 'aria-label': t('close'), onclick: () => closeCard() }, '×')];
    if (p) kids.push(h('img', { src: BASE + p.file, alt: tr(hs.title), loading: 'lazy' }), creditLine(p, t('photo')));
    if (hs.legend) kids.push(h('span', { class: 'tag' }, t('legend')));
    kids.push(
      h('h2', {}, tr(hs.title)),
      h('p', {}, tr(hs.text)),
      h('div', { class: 'row' },
        h('button', { class: 'btn accent', onclick: () => { void viewer.goTo(hs); } }, t('goThere')),
        h('button', { class: 'btn ghost', onclick: () => openVisit() }, t('planVisit'))),
    );
    card.replaceChildren(...kids);
    card.classList.add('open');
    viewer.input.release();
  }
  function closeCard() { card.classList.remove('open'); delete card.dataset.id; }

  function renderPlaces() {
    places.replaceChildren(
      h('div', { class: 'places-head' }, h('h3', {}, t('places')), h('button', { class: 'x', onclick: () => togglePlaces(false) }, '×')),
      ...HOTSPOTS.map((hs) => {
        const p = photoFor(hs.photo);
        return h('button', { class: 'place', onclick: () => { togglePlaces(false); openCard(hs); void viewer.goTo(hs); } },
          p ? h('img', { src: BASE + p.file, alt: '', loading: 'lazy' }) : h('span', {}),
          h('span', {}, tr(hs.title)));
      }),
    );
  }
  function togglePlaces(force?: boolean) {
    const open = force ?? !places.classList.contains('open');
    places.classList.toggle('open', open);
    if (open) viewer.input.release();
  }

  function openVisit() {
    viewer.input.release();
    modal.replaceChildren(h('div', { class: 'modal-box' },
      h('button', { class: 'x', 'aria-label': t('close'), onclick: () => modal.classList.remove('open') }, '×'),
      h('h2', {}, `${t('planVisit')}: ${tr(INFO.name)}`),
      h('dl', {}, ...INFO.visit.flatMap((r) => [h('dt', {}, tr(r.k)), h('dd', {}, tr(r.v))])),
      h('div', { class: 'row' },
        h('a', { class: 'btn accent', href: toursUrl(INFO.searchTerm), target: '_blank', rel: 'noopener sponsored' }, t('findTours')),
        h('a', { class: 'btn ghost', href: hotelsUrl(`${HOTEL_TOWN[site.id] ?? INFO.searchTerm}, Tunisia`), target: '_blank', rel: 'noopener sponsored' }, t('findHotels'))),
      h('button', { class: 'link', onclick: () => openCredits(viewer.propCredits) }, t('creditsTitle')),
    ));
    modal.classList.add('open');
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  function photoMode(on: boolean) {
    stage.classList.toggle('photo', on);
    viewer.input.release();
    photoBar.replaceChildren(
      h('button', { class: 'btn accent', onclick: async () => {
        const blob = await viewer.capture(`${t('brand')} · ${tr(INFO.name)}`);
        if (!blob) return;
        const a = h('a', { href: URL.createObjectURL(blob), download: `${site.id}.jpg` });
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } }, t('savePhoto')),
      h('button', { class: 'btn ghost', onclick: () => photoMode(false) }, t('close')),
    );
  }

  viewer.onAutoQuality = () => render();
  viewer.onModeChange = (m: Mode) => {
    stage.dataset.mode = m;
    render();
  };
  viewer.onFrame = (spots: ScreenHotspot[]) => {
    for (const s of spots) {
      const m = markers.get(s.id)!;
      m.style.display = s.visible ? 'flex' : 'none';
      if (s.visible) {
        m.style.transform = `translate(${s.x}px, ${s.y}px)`;
        m.classList.toggle('near', s.dist < 22);
      }
    }
    crosshair.style.display = viewer.input.locked ? 'block' : 'none';
  };

  const keyHandler = (e: KeyboardEvent) => {
    if (e.code === 'Escape') { closeCard(); togglePlaces(false); modal.classList.remove('open'); if (stage.classList.contains('photo')) photoMode(false); }
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT') return;
    const i = SPEEDS.findIndex((s) => s.v === speed);
    if ((e.code === 'Equal' || e.code === 'NumpadAdd') && i < SPEEDS.length - 1) setSpeed(SPEEDS[i + 1].v);
    if ((e.code === 'Minus' || e.code === 'NumpadSubtract') && i > 0) setSpeed(SPEEDS[i - 1].v);
  };
  window.addEventListener('keydown', keyHandler);
  const offLang = onLangChange(render);

  stage.dataset.mode = 'intro';
  render();
  await viewer.load((f) => { fill.style.width = `${Math.round(f * 100)}%`; });
  setSpeed(speed);
  if (viewer.satelliteAvailable) {
    const groundBtn = h('button', { class: 'btn ghost small' });
    const attribution = h('div', { class: 'map-attribution' });
    overlay.append(attribution);
    viewer.onAttribution = (text) => {
      attribution.replaceChildren(...(text ? [h('b', {}, 'Google'), ` ${text}`] : []));
      attribution.style.display = text ? 'block' : 'none';
    };
    const label = () => { groundBtn.textContent = `${t('ground')}: ${viewer.groundMode === 'satellite' ? t('groundSatellite') : t('groundModel')}`; };
    groundBtn.addEventListener('click', async () => {
      groundBtn.disabled = true;
      try { await viewer.setGroundMode(viewer.groundMode === 'satellite' ? 'model' : 'satellite'); }
      catch (err) { console.warn(err); attribution.textContent = String(err); attribution.style.display = 'block'; }
      groundBtn.disabled = false;
      label();
    });
    onLangChange(label);
    label();
    bottom.append(groundBtn);
  }
  loader.classList.add('done');
  setTimeout(() => loader.remove(), 700);

  return () => {
    window.removeEventListener('keydown', keyHandler);
    offLang();
    ambience.dispose();
    viewer.dispose();
  };
}
