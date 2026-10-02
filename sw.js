// Service worker — makes the app itself open without a connection.
//
// Everything a member's workout needs was already on the phone, but the page
// that reads it came off the network every time. In a gym with no signal the
// app simply did not load, which made all the offline work underneath it
// pointless (phase 4, 2026-10-01).
//
// Strategy is network-first for the app's own files, not cache-first. Fresh
// code matters more than the milliseconds a cache-first fetch would save:
// cache-first would keep serving yesterday's app after a deploy until the next
// load, and a member stuck on an old build is a bug nobody can see. The cache
// is the fallback, which is exactly the case it exists for.
//
// Bump CACHE on any change here. Old caches are deleted on activate.
const CACHE = "burnclub-v2";

// The shell: enough to open the app and run a workout from local data.
// Deliberately not the demo videos — they are ~1MB each and the browser's own
// HTTP cache handles the few a member actually watches.
const SHELL = [
  "./",
  "./index.html",
  "./palette.css",
  "./style.css",
  "./data.js",
  "./app.js",
  "./sync.js",
  "./supabase-client.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll fails the whole install if any single file 404s, which would
      // leave no cache at all. Individually, a missing file costs only itself.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never touch Supabase. Auth, member data and video all have to be live or
  // fail honestly — a cached API response would be a lie about what is saved.
  if (url.hostname.endsWith("supabase.co")) return;

  // Fonts: cache-first. They never change, they are on another origin, and
  // without this the app falls back to a system face the moment it is offline.
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // "no-cache" forces a revalidation rather than letting the browser's own HTTP
  // cache answer from a copy it is still holding. Without it a member who
  // reloads after a deploy can be served yesterday's CSS against today's HTML
  // for as long as the cache header says — which is exactly what happened here
  // the first time this was tested. Revalidation is a 304 when nothing moved,
  // so it costs a round trip and no bytes.
  const fresh = new Request(req, { cache: "no-cache" });

  event.respondWith(
    fetch(fresh)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          // A navigation that misses still has to render something, and the
          // member asked for the app, so give them the app.
          hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined)
        )
      )
  );
});
