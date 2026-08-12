/**
 * CASSETTE Service Worker
 * Minimal PWA support: cache app shell, network-first for API calls.
 */

const CACHE_NAME = "cassette-v1";
const STATIC_ASSETS = [
  "/",
  "/create",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Fail gracefully if some assets can't be cached
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip YouTube, Google APIs
  if (
    url.hostname.includes("youtube.com") ||
    url.hostname.includes("googleapis.com")
  ) {
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        if (response) return response;
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => {
              c.put(request, response.clone());
            });
            return response;
          })
          .catch(() => {
            // Offline fallback
            if (request.destination === "document") {
              return caches.match("/");
            }
          });
      })
  );
});
