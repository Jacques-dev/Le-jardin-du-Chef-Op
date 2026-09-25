// Généré par outils/generer-sw.mjs — ne pas modifier à la main
const VERSION = 'jco-77ef0483b4';
const PRECACHE = ["./",
  "./css/app.css",
  "./fonts/fraunces-latin-opsz-normal.woff2",
  "./fonts/ibm-plex-mono-latin-400-normal.woff2",
  "./fonts/ibm-plex-mono-latin-500-normal.woff2",
  "./fonts/inter-tight-latin-wght-normal.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/icon.svg",
  "./index.html",
  "./js/app.js",
  "./js/data/cadre.js",
  "./js/data/compo.js",
  "./js/data/index.js",
  "./js/data/intentions.js",
  "./js/data/lumiere.js",
  "./js/data/mouvements.js",
  "./js/env.js",
  "./js/icons.js",
  "./js/illus.js",
  "./js/lab3d.js",
  "./js/setup.js",
  "./js/store.js",
  "./js/tools.js",
  "./js/ui.js",
  "./manifest.webmanifest",
  "./vendor/three.bundle.js"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
