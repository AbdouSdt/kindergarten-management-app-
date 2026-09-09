/* Hand-written service worker for the kindergarten PWA.
 * No build step, no imports. Bump CACHE to invalidate everything.
 *
 * Rules:
 *  - Same-origin GET only. Everything else falls through to the network.
 *  - Never touch Supabase or any request carrying auth.
 *  - Navigations: network-first, then cached page, then /offline.html.
 *  - Static assets: cache-first.
 *  - Never cache non-200 or opaque responses.
 */

const CACHE = "roudha-v1";

const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name !== CACHE).map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// A response we are allowed to persist: real, same-origin-ish, 200, not opaque.
function isCacheable(response) {
  return (
    response &&
    response.status === 200 &&
    response.type !== "opaque" &&
    response.type !== "opaqueredirect"
  );
}

// Anything that smells like authenticated / Supabase traffic.
function isSensitive(request, url) {
  if (url.host.includes("supabase")) return true;
  if (request.headers.has("Authorization")) return true;
  if (url.searchParams.has("code") || url.searchParams.has("access_token")) {
    return true;
  }
  return false;
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Same-origin GET only; let the rest go straight to the network.
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (isSensitive(request, url)) return;

  if (request.mode === "navigate") {
    // Authenticated routes render children's PII. Never cache them and never
    // serve a cached copy: network-only, with a direct /offline.html fallback.
    if (/^\/(admin|teacher|parent)(\/|$)/.test(url.pathname)) {
      event.respondWith(
        fetch(request).catch(() => caches.match("/offline.html"))
      );
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(response)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html"))
        )
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (isCacheable(response)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
