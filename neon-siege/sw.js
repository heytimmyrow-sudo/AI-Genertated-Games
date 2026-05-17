const NEON_SIEGE_CACHE = "neon-siege-v1";
const NEON_SIEGE_ASSETS = [
  "./index.html",
  "./neon-siege.css",
  "./neon-siege.js?v=1",
  "./manifest.webmanifest",
  "./neon-siege-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(NEON_SIEGE_CACHE).then((cache) => cache.addAll(NEON_SIEGE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== NEON_SIEGE_CACHE).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(NEON_SIEGE_CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
