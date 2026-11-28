// SatLapseMap service worker: makes the site installable as an app (Edge/Chrome "Install").
// The site's own files are fetched fresh from the network each time (so a publish shows up at once)
// and a copy is kept, so the app still opens when the connection drops. Map tiles, imagery and
// sign-in (other sites) are left alone.
const CACHE = 'satlapsemap-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return; // other sites: the browser handles them as usual
  e.respondWith((async () => {
    try {
      const res = await fetch(r, { cache: 'no-cache' }); // ask the server whether the file changed
      if (res.ok) { const c = await caches.open(CACHE); c.put(r, res.clone()); }
      return res;
    } catch (err) { // offline: use the last copy
      return (await caches.match(r, { ignoreSearch: true })) || (r.mode === 'navigate' && await caches.match('./')) || Response.error();
    }
  })());
});
