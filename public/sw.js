const CACHE_VERSION = "ashhq-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const ALL_CACHES = [STATIC_CACHE, PAGES_CACHE];

const PRECACHE_STATIC = [
  "/offline.html",
  "/manifest.json",
];

// Routes that should never be cached
const BYPASS_PATTERNS = [
  /\/api\//,
  /\/login/,
  /\/_next\/webpack-hmr/,
];

// Long-lived static assets (_next/static has content hashes)
const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\/icons\//,
  /\.(?:ico|png|svg|webp|woff2?)$/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_STATIC).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !ALL_CACHES.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept non-same-origin requests
  if (url.origin !== self.location.origin) return;

  // Bypass patterns — let them go straight to network
  if (BYPASS_PATTERNS.some((p) => p.test(url.pathname))) return;

  // Static assets: cache-first (these are content-hashed, safe to cache forever)
  if (STATIC_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (hit) =>
            hit ||
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // HTML pages: network-first with stale fallback, offline fallback last
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then((hit) => hit || caches.match("/offline.html"))
      )
  );
});
