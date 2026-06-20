/*
 * Sloka Hub PWA service worker.
 *
 * Strategy:
 *   - Precache the app shell ("/" and the webmanifest) on install
 *   - Navigations: network-first, fall back to cached "/" when offline
 *   - Same-origin static assets (hashed by Expo): cache-first
 *   - Everything else: pass through
 *
 * Bump CACHE_VERSION whenever the deployment ships a new build so
 * old caches are evicted on activate.
 */

const CACHE_VERSION = "sloka-hub-v2";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        /* manifest path may differ — install still succeeds */
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API requests must NEVER be cached: responses are per-user and auth-scoped.
  // Let them go straight to the network (no SW interception) so one user's data
  // can never be served from cache to another.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations — network-first, cached shell as offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches
            .open(CACHE_VERSION)
            .then((cache) => cache.put("/", copy))
            .catch(() => {});
          return resp;
        })
        .catch(() =>
          caches
            .match("/")
            .then(
              (cached) =>
                cached ||
                new Response("Offline", {
                  status: 503,
                  statusText: "Offline",
                  headers: { "Content-Type": "text/plain" },
                }),
            ),
        ),
    );
    return;
  }

  // Same-origin static assets — cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            caches
              .open(CACHE_VERSION)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }
          return resp;
        })
        .catch(() => cached || Response.error());
    }),
  );
});
