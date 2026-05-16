const THREADMAIL_CACHE = "threadmail-pwa-v2";
const THREADMAIL_ASSETS = [
  "./threadmail.html",
  "./threadmail.css",
  "./threadmail.webmanifest",
  "./threadmail-icon-192.png",
  "./threadmail-icon-512.png",
  "../style.css",
  "../js/threadmail.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(THREADMAIL_CACHE).then((cache) => cache.addAll(THREADMAIL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== THREADMAIL_CACHE).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.includes("/rest/v1/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(THREADMAIL_CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
