const CACHE_NAME = "pulse-league-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=all-upgrades",
  "./app.js?v=all-upgrades",
  "./manifest.webmanifest",
  "./assets/pulse-league-icon-192.png",
  "./assets/pulse-league-icon-512.png",
  "./assets/volleyball-court-hero.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
