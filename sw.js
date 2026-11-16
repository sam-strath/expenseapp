// Stale-while-revalidate: the app always opens instantly from the cache (works offline),
// and quietly fetches fresh copies in the background when online. Updated files appear
// the next time the app is opened. Your saved expenses live in IndexedDB and are never touched.
const CACHE = 'expense-log-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache:'reload'})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request, {ignoreSearch:true});
    const net = fetch(e.request, {cache:'no-cache'}).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || (await cache.match('./index.html')) || Response.error();
  })());
});
