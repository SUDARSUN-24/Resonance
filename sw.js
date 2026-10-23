/* RESONANCE service worker — offline cache
   Pages: network first (so updates show up straight away), cache as fallback.
   Static files: cache first. Fonts & images: stale-while-revalidate. */
const VERSION = 'resonance-v2';
const RUNTIME = 'resonance-runtime-v1';
const CORE = [
  './', 'index.html', 'services.html', 'contact.html', 'clone.html', '404.html',
  'manifest.webmanifest', 'favicon.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== RUNTIME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/api/') || url.pathname === '/admin.html' || /\.(php|sql)$/.test(url.pathname)) return;
    if (req.mode === 'navigate') {
      e.respondWith(
        fetch(req).then(function (res) {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
          return res;
        }).catch(function () {
          return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('index.html'); });
        })
      );
      return;
    }
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
          return res;
        });
      })
    );
    return;
  }

  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|images\.unsplash\.com)$/.test(url.hostname)) {
    e.respondWith(
      caches.open(RUNTIME).then(function (c) {
        return c.match(req).then(function (hit) {
          const net = fetch(req).then(function (res) { c.put(req, res.clone()); return res; }).catch(function () { return hit; });
          return hit || net;
        });
      })
    );
  }
});
