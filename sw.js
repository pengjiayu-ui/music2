/* 音乐史打卡 · 离线缓存 */
const VERSION = 'e38dfd7f';
const CACHE = 'msh-' + VERSION;
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./assets/characters/cheer.png", "./assets/characters/default.png", "./assets/characters/excited.png", "./assets/characters/happy.png", "./assets/characters/love.png", "./assets/characters/proud.png", "./assets/characters/shy.png", "./assets/characters/sleepy.png", "./assets/characters/surprised.png"];

self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    const c = await caches.open(CACHE);
    await Promise.all(ASSETS.map(function (a) {
      return c.add(a).catch(function () {});
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async function () {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) {
      fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
      }).catch(function () {});
      return hit;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const fb = await cache.match('./index.html', { ignoreSearch: true });
        if (fb) return fb;
      }
      return new Response('当前处于离线状态', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
