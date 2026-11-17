/* Offline cache: app shell precached, everything else stale-while-revalidate. */
const V = "lgw-12";
const SHELL = ["./", "index.html", "styles.css?v=12", "app.js?v=12", "fx.js?v=12", "data/wiki-data.js?v=12", "data/wiki-fr.js?v=12",
  "assets/img/logo-96.webp", "assets/img/banner-900.webp", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || /\.mkv$/.test(r.url)) return;
  const url = new URL(r.url);
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r);
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
