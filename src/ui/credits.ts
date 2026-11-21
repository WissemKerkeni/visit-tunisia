import { t, tr, type T1 } from '../i18n';
import { SITES } from '../content/sites';
import { h, loadPhotoCredits } from './dom';

const BASE = import.meta.env.BASE_URL;
/** The texts of this window (English; the other languages come from src/locales). */
const C: Record<string, T1> = {
  photosBy: { en: 'Photos by {authors}, via Wikimedia Commons, under the licences listed below. Resized for the web.' },
  onePhoto: { en: 'One photo per monument, via Wikimedia Commons, resized for the web:' },
  by: { en: '{title} by {author}' },
  osm: { en: 'Streets, building footprints, gardens, coastline and ruins outlines of the monuments built in 3D: © OpenStreetMap contributors, under the Open Database Licence (ODbL). Houses on streets without mapped buildings are generated.' },
  terrain: { en: 'Relief of the monuments and hill shading of the map: AWS Terrain Tiles (Mapzen; SRTM, ETOPO1 and other public sources).' },
  country: { en: 'Country map: coastline from Natural Earth (public domain); colours of the land from NASA Blue Marble (public domain, via NASA GIBS); lakes, salt flats and the Medjerda © OpenStreetMap contributors (ODbL).' },
  weather: { en: 'Weather and climate averages: Open-Meteo.com (ERA5 reanalysis and the Open-Meteo marine model, CC BY 4.0). Exchange rates: Exchange Rate API.' },
  engine: { en: '3D engine: three.js (MIT), three-mesh-bvh (MIT).' },
  models: { en: '3D models' },
};
const link = (href: string, text: string) => h('a', { href, target: '_blank', rel: 'noopener' }, text);

export async function openCredits(extra: string[] = []) {
  const photos = { ...(await loadPhotoCredits('el-jem')), ...(await loadPhotoCredits('sidi-bou-said')), ...(await loadPhotoCredits('carthage')), ...(await loadPhotoCredits('dougga')), ...(await loadPhotoCredits('kairouan')), ...(await loadPhotoCredits('sousse')), ...(await loadPhotoCredits('sbeitla')), ...(await loadPhotoCredits('djerba')), ...(await loadPhotoCredits('matmata')), ...(await loadPhotoCredits('ksar-ouled-soltane')), ...(await loadPhotoCredits('bulla-regia')), ...(await loadPhotoCredits('tunis-medina')), ...(await loadPhotoCredits('places')), ...(await loadPhotoCredits('food')) };
  let textures: { asset: string; name: string; authors: string[]; source: string }[] = [];
  try { const r = await fetch(`${BASE}textures/credits.json`); if (r.ok) textures = await r.json(); } catch { /* ignore */ }
  let sitePhotos: Record<string, { author: string; license: string; license_url: string; source: string; title: string }> = {};
  try { const r = await fetch(`${BASE}photos/sites/credits.json`); if (r.ok) sitePhotos = await r.json(); } catch { /* ignore */ }
  const siteName = (id: string) => { const s = SITES.find((x) => x.id === id); return s ? tr(s.name) : id; };
  const authors = [...new Set(Object.values(photos).map((p) => p.author))];
  const box = h('div', { class: 'modal open credits-modal' }, h('div', { class: 'modal-box' },
    h('button', { class: 'x', 'aria-label': t('close'), onclick: () => box.remove() }, '×'),
    h('h2', {}, t('creditsTitle')),
    h('h4', {}, t('photosBy')),
    h('p', {}, tr(C.photosBy).replace('{authors}', authors.join(', '))),
    h('ul', { class: 'small-list' }, ...Object.values(photos).map((p) =>
      h('li', {}, h('a', { href: p.source, target: '_blank', rel: 'noopener' }, p.source.split('File:')[1] ?? p.source), ` (${p.author}, ${p.license})`))),
    h('h4', {}, t('monumentsTitle')),
    h('p', {}, tr(C.onePhoto)),
    h('ul', { class: 'small-list' }, ...Object.entries(sitePhotos).map(([id, p]) =>
      h('li', {}, `${siteName(id)}: `, link(p.source, tr(C.by).replace('{title}', p.title).replace('{author}', p.author)), ', ',
        h('a', { href: p.license_url, target: '_blank', rel: 'noopener' }, p.license)))),
    h('h4', {}, t('texturesBy')),
    h('ul', { class: 'small-list' }, ...textures.map((x) =>
      h('li', {}, h('a', { href: x.source, target: '_blank', rel: 'noopener' }, x.name), ` by ${x.authors.join(', ')} (Poly Haven, CC0)`))),
    h('h4', {}, t('mapData')),
    h('p', {}, tr(C.osm), ' ', link('https://www.openstreetmap.org/copyright', 'openstreetmap.org/copyright')),
    h('p', {}, tr(C.terrain), ' ', link('https://registry.opendata.aws/terrain-tiles/', 'registry.opendata.aws')),
    h('p', {}, tr(C.country)),
    h('p', {}, tr(C.weather), ' ', link('https://open-meteo.com', 'open-meteo.com'), ' · ', link('https://www.exchangerate-api.com', 'exchangerate-api.com')),
    h('p', {}, tr(C.engine)),
    extra.length ? h('h4', {}, tr(C.models)) : null,
    extra.length ? h('ul', { class: 'small-list' }, ...extra.map((c) => h('li', {}, c))) : null,
  ));
  box.addEventListener('click', (e) => { if (e.target === box) box.remove(); });
  (document.querySelector('.overlay') ?? document.body).append(box);
}
