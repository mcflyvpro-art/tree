/* Arbre des trois monothéismes — service worker : fonctionnement hors connexion.
   __BUILD__ est remplacé à chaque déploiement : les fichiers versionnés évitent tout mélange d'anciennes et de nouvelles versions. */
const VERSION = '__BUILD__';
const CACHE = 'arbre3m-' + VERSION;
const V = '?v=' + VERSION;
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css' + V, './js/data.js' + V, './js/content.js' + V, './js/rich.js' + V, './js/app.js' + V,
  './fonts/gentium-400-latin.woff2', './fonts/gentium-400-latin-ext.woff2',
  './fonts/gentium-700-latin.woff2', './fonts/gentium-700-latin-ext.woff2',
  './fonts/gentium-400i-latin.woff2', './fonts/gentium-400i-latin-ext.woff2',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, {cache:'reload'}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('arbre3m-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate'){
    // la page : réseau d'abord pour rester à jour, copie locale si la connexion manque ou traîne
    e.respondWith((async () => {
      const cached = await caches.match('./index.html');
      const net = fetch(req).then(res => {
        if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
        return res;
      });
      if (!cached) return net;
      const slow = new Promise(r => setTimeout(() => r(cached), 3000));
      try { return await Promise.race([net, slow]); } catch (_e){ return cached; }
    })());
    return;
  }
  // fichiers : copie locale d'abord, réseau ensuite
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.type === 'basic'){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
