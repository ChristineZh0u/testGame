const CACHE = 'majiang-v1';
const ASSETS = ['./', './index.html', './style.css', './tiles.js', './i18n.js', './sound.js', './game.js', './rogue.js'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
