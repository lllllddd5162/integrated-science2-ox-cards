// 오프라인용 서비스 워커: 한 번 연 뒤에는 인터넷 없이도 열리고, 온라인이면 다음 실행 때 최신 파일로 바뀝니다.
const CACHE = "is2-ox-cards-v10";
const SHELL = ["./", "index.html", "style.css", "app.js", "data/items.json", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // 온라인이면 항상 최신 파일, 오프라인이면 저장해 둔 파일
  e.respondWith(caches.open(CACHE).then(c =>
    fetch(e.request).then(r => { if (r && r.ok && (r.type === "basic" || r.type === "cors")) c.put(e.request, r.clone()); return r; })
      .catch(() => c.match(e.request, { ignoreSearch: true }))
  ));
});
