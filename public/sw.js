// Offline reading: static assets and Quran data are cached as you read; pages fall back to the cache when offline.
const CACHE = "qs-v3";
// Path the site is served under ("" locally, "/quraan-shareef" on GitHub Pages).
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
// Tafsir comes from a pinned commit on jsDelivr, so a cached copy never goes stale.
const TAFSIR = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.url.startsWith(TAFSIR)) {
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(req)) || fetch(req).then((res) => (res.ok && c.put(req, res.clone()), res))));
    return;
  }
  if (url.origin !== location.origin) return;
  const immutable = [BASE + "/_next/static/", BASE + "/data/", BASE + "/icon"].some((p) => url.pathname.startsWith(p));
  if (immutable) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => (await c.match(req)) || fetch(req).then((res) => (res.ok && c.put(req, res.clone()), res))),
    );
  } else if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(BASE + "/"))),
    );
  }
});
