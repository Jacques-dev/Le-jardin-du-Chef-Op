// Régénère sw.js avec la liste des fichiers à mettre en cache hors ligne.
// Usage : node outils/generer-sw.mjs   (à relancer après chaque modification du site)
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const skip = /^(outils|\.git|\.nojekyll|node_modules|README|CARTOGRAPHIE|_test|lancer-serveur)|sw\.js$/;
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), r = path.relative(root, p).split(path.sep).join('/'); if (skip.test(r)) continue; if (fs.statSync(p).isDirectory()) walk(p); else files.push(r); } })(root);
files.sort();
const hash = crypto.createHash('sha1'); for (const f of files) hash.update(fs.readFileSync(path.join(root, f)));
const version = hash.digest('hex').slice(0, 10);
const list = ['./', ...files.map(f => './' + f)];
const sw = `// Généré par outils/generer-sw.mjs — ne pas modifier à la main
const VERSION = 'jco-${version}';
const PRECACHE = ${JSON.stringify(list, null, 0).replace(/","/g, '",\n  "')};
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
`;
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log(`sw.js : ${list.length} fichiers, version ${version}`);
