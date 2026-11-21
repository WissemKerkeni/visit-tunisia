import { trackView } from './analytics';
import { initLang } from './i18n';
import { goView, mountLanding } from './ui/landing';
import type { SiteDef } from './sites/types';

/** Monuments that can be walked in 3D, loaded on demand. */
const SITE_LOADERS: Record<string, () => Promise<{ site: SiteDef }>> = {
  'el-jem': () => import('./sites/el-jem'),
  'sidi-bou-said': () => import('./sites/sidi-bou-said'),
  carthage: () => import('./sites/carthage'),
  dougga: () => import('./sites/dougga'),
  kairouan: () => import('./sites/kairouan'),
  sousse: () => import('./sites/sousse'),
  sbeitla: () => import('./sites/sbeitla'),
  djerba: () => import('./sites/djerba'),
  matmata: () => import('./sites/matmata'),
  'ksar-ouled-soltane': () => import('./sites/ksar-ouled-soltane'),
  'bulla-regia': () => import('./sites/bulla-regia'),
  'tunis-medina': () => import('./sites/tunis-medina'),
};

const root = document.getElementById('app')!;
let unmount: (() => void) | null = null;
let routeId = 0;

/** Sections of the home page reached by a link (#guide…): scroll there without redrawing the page. */
const SECTIONS = new Set(['', 'map', 'places', 'plan', 'guide', 'events', 'itineraries', 'food']);
let onLanding = false;

async function route() {
  const hash0 = location.hash.replace(/^#\/?/, '');
  if (onLanding && SECTIONS.has(hash0)) { goView(hash0); return; }
  const id = ++routeId;
  unmount?.();
  unmount = null;
  const hash = location.hash.replace(/^#\/?/, '');
  const loader = SITE_LOADERS[hash];
  document.body.classList.toggle('in-site', !!loader);
  onLanding = !loader;
  if (loader) {
    const [{ mountSite }, { site }] = await Promise.all([import('./ui/siteUI'), loader()]);
    if (id !== routeId) return;
    trackView(`/3d/${hash}/`);
    const cleanup = await mountSite(root, site, () => { location.hash = ''; });
    if (id !== routeId) { cleanup(); return; }
    unmount = cleanup;
  } else {
    // a place page opens on its place (scripts/make-pages.mjs writes one per place and language)
    const place = (window as { __PLACE__?: string }).__PLACE__;
    unmount = mountLanding(root, (s) => { location.hash = `/${s}`; }, hash ? undefined : place);
    if (hash === 'places') requestAnimationFrame(() => goView(hash));
  }
}

window.addEventListener('hashchange', () => { void route(); });
void initLang().then(route);

// installable and usable offline (public/sw.js); only in the built site
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).then(async () => {
      const reg = await navigator.serviceWorker.ready;
      // hand over what this first visit already loaded, so it is there offline too
      reg.active?.postMessage({ cache: [location.href, ...performance.getEntriesByType('resource').map((e) => e.name)] });
    }).catch(() => { /* not supported here */ });
  });
}
