/**
 * CASSETTE Service Worker v3
 *
 * Strategy:
 * - HTML documents  → Network-first (NEVER serve stale page HTML from cache)
 * - API calls       → Network-only (always fresh data)
 * - Static assets   → Cache-first with network fallback (JS/CSS/fonts/images)
 * - External URLs   → Pass-through (YouTube, Google APIs, PostHog)
 *
 * Bumping CACHE_NAME busts all previous caches on next SW activation.
 */

const CACHE_NAME = "cassette-v3";

// Assets worth pre-caching on install (small, stable)
const PRECACHE = ["/favicon.ico", "/manifest.json"];

// ── Message handler (SKIP_WAITING from client) ───────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(PRECACHE).catch(() => {
          /* ignore individual failures */
        })
      )
  );
  // Take over immediately — don't wait for old clients to close
  self.skipWaiting();
});

// ── Activate — delete ALL old caches ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET
  if (request.method !== "GET") return;

  // 2. Pass-through: external origins (YouTube, Google, PostHog, Vercel analytics)
  if (url.origin !== self.location.origin) return;

  // 3. Pass-through: Next.js internals & HMR websockets
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.startsWith("/_next/static/webpack/")
  ) {
    return;
  }

  // 4. Network-only: API routes (always need fresh data)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // 5. Network-first: HTML documents (CRITICAL — prevents stale page serving)
  if (request.destination === "document" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache 200 OK responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Offline fallback: try cache, else generic offline response
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response(
                `<!doctype html><html><body style="background:#060408;color:#F5F0E8;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
                  <div style="text-align:center"><p style="font-size:1.2rem">You're offline</p><p style="opacity:.5;font-size:.8rem">Connect to the internet to use CASSETTE</p></div>
                </body></html>`,
                { headers: { "Content-Type": "text/html" } }
              )
          )
        )
    );
    return;
  }

  // 6. Cache-first: static assets (_next/static, fonts, icons)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // 7. Default: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
