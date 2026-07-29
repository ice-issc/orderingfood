/* 같이시켜요 · 서비스 워커
   - 앱 껍데기는 네트워크 우선(항상 최신 버전), 실패하면 캐시
   - 아이콘/폰트는 캐시 우선
   - 주문 데이터는 절대 캐시하지 않음 (supabase.co 는 통과) */
const V = 'mo-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname.endsWith('supabase.co') || u.protocol === 'wss:') return;

  if (u.origin === location.origin && (u.pathname.endsWith('/') || u.pathname.endsWith('.html'))) {
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res.ok && (u.origin === location.origin || u.hostname.includes('fonts') || u.hostname.includes('jsdelivr'))) {
      const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp));
    }
    return res;
  })));
});
