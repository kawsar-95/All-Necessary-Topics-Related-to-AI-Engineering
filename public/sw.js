// The service worker. It keeps the pages a reader opens, so they also open
// offline. src/components/layout/ServiceWorker.tsx registers it.
//
// - Pages and other files: network first. If the network fails, the saved copy.
// - /_next/static/ files: cache first. Their names change with each build.

const PAGES = "pages-v1";
const ASSETS = "assets-v1";
const MAX_ASSETS = 400;
const SCOPE = new URL(self.registration.scope).pathname;
const STATIC_PREFIX = SCOPE + "_next/static/";

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — AI Engineering</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f1013;color:#ebe8e2;font:16px/1.6 system-ui,sans-serif;padding:24px;text-align:center}
a{color:#5ec8d8}@media (prefers-color-scheme:light){body{background:#fbfaf7;color:#1d1c1a}a{color:#0e6f86}}</style></head>
<body><main><h1>You are offline</h1><p>This page is not saved on this device yet.<br>Pages you opened before work offline.</p>
<p><a href="${SCOPE}">Go to the home page</a></p></main></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(SCOPE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  if (url.pathname.startsWith(STATIC_PREFIX)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSETS);
    await cache.put(request, response.clone());
    trim(cache);
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: request.mode === "navigate" });
    if (cached) return cached;
    if (request.mode === "navigate") {
      return new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    throw error;
  }
}

/** Old builds leave old /_next/static/ files. Delete the oldest first. */
async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((k) => cache.delete(k)));
}
