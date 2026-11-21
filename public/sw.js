// Visit Tunisia works offline once visited: pages come from the network when there is one (so updates arrive) and
// from the cache otherwise; scripts, styles, photos, map and 3D data come from the cache first. Live weather and
// exchange rates are never cached here (the page shows the climate averages instead).
const VERSION = 'v2';
const PAGES = `pages-${VERSION}`, FILES = `files-${VERSION}`;
const ROOT = new URL('./', self.location).href;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll([ROOT, `${ROOT}manifest.webmanifest`])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== FILES).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// the page sends the files it loaded before the worker took over, so the first visit works offline too
self.addEventListener('message', (e) => {
  const urls = (e.data && e.data.cache) || [];
  e.waitUntil(caches.open(FILES).then((c) => Promise.all(urls.filter(cacheable).map((u) => c.match(u).then((hit) => hit || c.add(u).catch(() => {}))))));
});

const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
function cacheable(url) {
  const u = new URL(url, ROOT);
  return (u.href.startsWith(ROOT) && !u.pathname.endsWith('/sw.js')) || FONTS.test(u.href);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  if (req.mode === 'navigate') { e.respondWith(page(req)); return; }
  if (!cacheable(url)) return;          // weather, rates, hotel and map links: straight to the network
  e.respondWith(file(req));
});

async function page(req) {
  const c = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch {
    return (await c.match(req, { ignoreSearch: true })) || (await c.match(ROOT)) || Response.error();
  }
}
// built files have a hash in their name and never change: cache first. Photos, data and fonts: the cached copy at
// once, refreshed in the background for next time.
async function file(req) {
  const c = await caches.open(FILES);
  const hit = await c.match(req);
  const get = () => fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; });
  if (hit) { if (!new URL(req.url).pathname.includes('/assets/')) get().catch(() => {}); return hit; }
  return get();
}
